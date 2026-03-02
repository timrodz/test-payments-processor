from __future__ import annotations

import uuid
from sqlalchemy import func
from sqlmodel import Session, select

from app.legacy.payment_processor import LegacyPaymentProcessor
from app.models import (
    LegacyPaymentData,
    Payment,
    PaymentProcess,
    PaymentStatus,
    Registration,
    RegistrationStatus,
    Trip,
)


def process_payment(*, session: Session, payment_in: PaymentProcess) -> Payment:
    # Use a transaction block to ensure atomicity and consistency
    # We hold the FOR UPDATE lock on the trip to prevent overbooking
    with session.begin_nested():
        # 1. Fetch registration with a row-level lock
        registration = session.exec(
            select(Registration)
            .where(Registration.id == payment_in.registration_id)
            .with_for_update()
        ).first()

        if not registration:
            raise ValueError("Registration not found")

        if registration.status == RegistrationStatus.CONFIRMED:
            raise ValueError("Registration is already confirmed")

        # 2. Fetch trip with a row-level lock
        trip = session.exec(
            select(Trip)
            .where(Trip.id == registration.trip_id)
            .with_for_update()
        ).first()

        if not trip:
            raise ValueError("Trip not found")

        # 3. Check capacity
        # We only count confirmed registrations to determine if there's room for one more
        confirmed_count = session.exec(
            select(func.count(Registration.id))
            .where(Registration.trip_id == trip.id)
            .where(Registration.status == RegistrationStatus.CONFIRMED)
        ).one()

        if confirmed_count >= trip.max_students:
            raise ValueError("Trip is full")

    # 4. Prepare data for legacy processor using Pydantic validation
    legacy_payment_data = LegacyPaymentData(
        student_name=registration.student_name,
        parent_name=registration.parent_name,
        amount=float(trip.cost),
        card_number=payment_in.card_number,
        expiry_date=payment_in.expiry_date,
        cvv=payment_in.cvv,
        school_id=str(trip.school_id),
        activity_id=str(trip.id),
    )

    # 5. Call legacy processor (External API call should be OUTSIDE the DB transaction to avoid long locks)
    # However, since we are in an outer transaction, the locks will be held.
    # This is a trade-off for consistency (CAP theorem).
    processor = LegacyPaymentProcessor()
    response = processor.process_payment(legacy_payment_data.model_dump())  # type: ignore

    # 6. Save payment record and update registration within a final transaction
    db_payment = Payment(
        registration_id=registration.id,
        amount=trip.cost,
        status=PaymentStatus.SUCCESS if response.success else PaymentStatus.FAILED,
        transaction_id=response.transaction_id,
        error_message=response.error_message,
    )
    session.add(db_payment)

    if response.success:
        registration.status = RegistrationStatus.CONFIRMED
        session.add(registration)

    session.commit()
    session.refresh(db_payment)
    return db_payment


def get_payment(*, session: Session, payment_id: uuid.UUID) -> Payment | None:
    return session.get(Payment, payment_id)
