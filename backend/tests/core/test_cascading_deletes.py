import uuid
from decimal import Decimal
from datetime import datetime
from sqlmodel import Session

from app.models import (
    School,
    Trip,
    Registration,
    Payment,
    RegistrationStatus,
    PaymentStatus,
)


# Helper functions to create test data
def create_school(session: Session) -> School:
    school = School(name="Test School Cascading", address="123 Test St")
    session.add(school)
    session.commit()
    session.refresh(school)
    return school


def create_trip(session: Session, school_id: uuid.UUID) -> Trip:
    trip = Trip(
        title="Test Trip Cascading",
        location="Test Location",
        date=datetime.now(),
        cost=Decimal("100.00"),
        school_id=school_id,
    )
    session.add(trip)
    session.commit()
    session.refresh(trip)
    return trip


def create_registration(session: Session, trip_id: uuid.UUID) -> Registration:
    registration = Registration(
        trip_id=trip_id,
        student_name="Test Student",
        parent_name="Test Parent",
        parent_email="test@example.com",
        status=RegistrationStatus.CONFIRMED,
    )
    session.add(registration)
    session.commit()
    session.refresh(registration)
    return registration


def create_payment(session: Session, registration_id: uuid.UUID) -> Payment:
    payment = Payment(
        registration_id=registration_id,
        amount=Decimal("100.00"),
        status=PaymentStatus.SUCCESS,
    )
    session.add(payment)
    session.commit()
    session.refresh(payment)
    return payment


def test_delete_school_cascades(db: Session) -> None:
    # Setup data
    school = create_school(db)
    trip = create_trip(db, school.id)
    registration = create_registration(db, trip.id)
    payment = create_payment(db, registration.id)

    # Store IDs
    school_id = school.id
    trip_id = trip.id
    registration_id = registration.id
    payment_id = payment.id

    # Delete School
    db.delete(school)
    db.commit()
    db.expunge_all()

    # Verify cascading deletes
    assert db.get(School, school_id) is None
    assert db.get(Trip, trip_id) is None
    assert db.get(Registration, registration_id) is None
    assert db.get(Payment, payment_id) is None


def test_delete_trip_cascades(db: Session) -> None:
    # Setup data
    school = create_school(db)
    trip = create_trip(db, school.id)
    registration = create_registration(db, trip.id)
    payment = create_payment(db, registration.id)

    # Store IDs
    school_id = school.id
    trip_id = trip.id
    registration_id = registration.id
    payment_id = payment.id

    # Delete Trip
    db.delete(trip)
    db.commit()
    db.expunge_all()

    # Verify cascading deletes from Trip level
    assert db.get(Trip, trip_id) is None
    assert db.get(Registration, registration_id) is None
    assert db.get(Payment, payment_id) is None

    # Verify School still exists
    assert db.get(School, school_id) is not None
