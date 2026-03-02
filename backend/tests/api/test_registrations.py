from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone
from decimal import Decimal

from fastapi.testclient import TestClient
from sqlmodel import Session

from app.core.config import settings
from app.models import School, Trip


def test_create_registration_full_capacity(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    # 1. Create a school
    school = School(
        name="Test School Reg",
        address="Test Address",
    )
    db.add(school)
    db.commit()
    db.refresh(school)

    # 2. Create a trip with max_students = 1
    trip_date = datetime.now(timezone.utc) + timedelta(days=30)
    trip = Trip(
        title="Test Full Trip",
        description="Test Description",
        location="Test Location",
        date=trip_date,
        cost=Decimal("10.00"),
        max_students=1,
        school_id=school.id,
    )
    db.add(trip)
    db.commit()
    db.refresh(trip)

    # 3. Create first registration (should succeed)
    reg_data = {
        "trip_id": str(trip.id),
        "student_name": "Student 1",
        "parent_name": "Parent 1",
        "parent_email": "parent1@example.com",
    }
    r = client.post(
        f"{settings.API_V1_STR}/registrations/",
        json=reg_data,
    )
    assert r.status_code == 200

    # 4. Create second registration (should fail due to capacity)
    reg_data_2 = {
        "trip_id": str(trip.id),
        "student_name": "Student 2",
        "parent_name": "Parent 2",
        "parent_email": "parent2@example.com",
    }
    r = client.post(
        f"{settings.API_V1_STR}/registrations/",
        json=reg_data_2,
    )
    assert r.status_code == 400
    assert r.json()["detail"] == "Trip is at full capacity"


def test_read_my_registrations(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    from tests.utils.registration import create_random_registration

    email = settings.EMAIL_TEST_USER
    create_random_registration(db, parent_email=email)
    create_random_registration(db, parent_email=email)

    r = client.get(
        f"{settings.API_V1_STR}/registrations/me",
        headers=normal_user_token_headers,
    )
    assert r.status_code == 200
    data = r.json()
    assert data["count"] >= 2
    for reg in data["data"]:
        assert reg["parent_email"] == email


def test_create_registration(client: TestClient, db: Session) -> None:
    from tests.utils.trip import create_random_trip

    trip = create_random_trip(db)
    reg_data = {
        "trip_id": str(trip.id),
        "student_name": "Test Student",
        "parent_name": "Test Parent",
        "parent_email": "test@example.com",
    }
    r = client.post(
        f"{settings.API_V1_STR}/registrations/",
        json=reg_data,
    )
    assert r.status_code == 200
    created_reg = r.json()
    assert created_reg["student_name"] == "Test Student"
    assert created_reg["parent_email"] == "test@example.com"


def test_read_registration_by_id(client: TestClient, db: Session) -> None:
    from tests.utils.registration import create_random_registration

    registration = create_random_registration(db)
    r = client.get(
        f"{settings.API_V1_STR}/registrations/{registration.id}",
    )
    assert r.status_code == 200
    api_reg = r.json()
    assert api_reg["id"] == str(registration.id)


def test_read_registration_not_found(client: TestClient) -> None:
    r = client.get(
        f"{settings.API_V1_STR}/registrations/{uuid.uuid4()}",
    )
    assert r.status_code == 404


def test_read_registrations(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    from tests.utils.registration import create_random_registration

    create_random_registration(db)
    create_random_registration(db)

    r = client.get(
        f"{settings.API_V1_STR}/registrations/",
        headers=superuser_token_headers,
    )
    assert r.status_code == 200
    data = r.json()
    assert data["count"] >= 2


def test_update_registration(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    from tests.utils.registration import create_random_registration

    registration = create_random_registration(db)
    new_student_name = "Updated Student Name"
    update_data = {"student_name": new_student_name}

    r = client.patch(
        f"{settings.API_V1_STR}/registrations/{registration.id}",
        headers=superuser_token_headers,
        json=update_data,
    )
    assert r.status_code == 200
    updated_reg = r.json()
    assert updated_reg["student_name"] == new_student_name
    assert updated_reg["id"] == str(registration.id)


def test_delete_registration(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    from tests.utils.registration import create_random_registration

    registration = create_random_registration(db)

    r = client.delete(
        f"{settings.API_V1_STR}/registrations/{registration.id}",
        headers=superuser_token_headers,
    )
    assert r.status_code == 200
    data = r.json()
    assert data["message"] == "Registration deleted successfully"

    r = client.get(
        f"{settings.API_V1_STR}/registrations/{registration.id}",
    )
    assert r.status_code == 404
