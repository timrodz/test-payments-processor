from datetime import datetime, timedelta, timezone
from decimal import Decimal
from unittest.mock import patch

from fastapi.testclient import TestClient
from sqlmodel import Session

from app.core.config import settings
from app.legacy.payment_processor import PaymentResponse
from app.models import RegistrationStatus, TripCreate
from tests.utils.school import create_random_school


def test_capacity_exceeded_race_condition(client: TestClient, db: Session) -> None:
    # 1. Create a trip with max_students = 2
    school = create_random_school(db)
    trip_in = TripCreate(
        title="Limited Trip",
        description="Will lower capacity later",
        location="Nowhere",
        date=datetime.now(timezone.utc) + timedelta(days=30),
        cost=Decimal("100.00"),
        school_id=school.id,
        max_students=2,
    )
    from app.api.services.trips import create_trip

    trip = create_trip(session=db, trip_create=trip_in)

    # 2. Create 2 registrations for this trip (both PENDING)
    from app.api.services.registrations import create_registration
    from app.models import RegistrationCreate
    from tests.utils.utils import random_email, random_lower_string

    reg1 = create_registration(
        session=db,
        registration_create=RegistrationCreate(
            trip_id=trip.id,
            student_name="Student 1",
            parent_name="Parent 1",
            parent_email=random_email(),
        ),
    )
    reg2 = create_registration(
        session=db,
        registration_create=RegistrationCreate(
            trip_id=trip.id,
            student_name="Student 2",
            parent_name="Parent 2",
            parent_email=random_email(),
        ),
    )

    # 3. Lower capacity to 1 manually
    trip.max_students = 1
    db.add(trip)
    db.commit()

    mock_response = PaymentResponse(success=True, transaction_id="TX-CAP")

    # 4. Pay for the first registration
    with patch(
        "app.api.services.payments.LegacyPaymentProcessor.process_payment",
        return_value=mock_response,
    ):
        r1 = client.post(
            f"{settings.API_V1_STR}/payments/",
            json={
                "registration_id": str(reg1.id),
                "card_number": "4111111111111111",
                "expiry_date": "12/30",
                "cvv": "123",
            },
        )
    assert r1.status_code == 200

    # 5. Pay for the second registration
    # This SHOULD fail because max_students=1 and 1 is already confirmed
    with patch(
        "app.api.services.payments.LegacyPaymentProcessor.process_payment",
        return_value=mock_response,
    ):
        r2 = client.post(
            f"{settings.API_V1_STR}/payments/",
            json={
                "registration_id": str(reg2.id),
                "card_number": "4111111111111111",
                "expiry_date": "12/30",
                "cvv": "123",
            },
        )

    # EXPECTED BEHAVIOR: Second one should fail with 400 Bad Request
    assert r2.status_code == 400
    assert r2.json()["detail"] == "Trip is full"

    db.refresh(reg1)
    db.refresh(reg2)
    assert reg1.status == RegistrationStatus.CONFIRMED
    assert reg2.status == RegistrationStatus.PENDING  # Status didn't change for reg2
