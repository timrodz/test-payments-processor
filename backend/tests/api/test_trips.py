from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone
from decimal import Decimal

from fastapi.testclient import TestClient
from sqlmodel import Session, select

from app.api.services import trips as services
from app.core.config import settings
from app.models import School, Trip, Registration, RegistrationStatus
from tests.utils.school import create_random_school
from tests.utils.trip import create_random_trip
from tests.utils.utils import random_lower_string


def test_create_trip_as_superuser(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    school = create_random_school(db)
    title = random_lower_string()
    description = random_lower_string()
    location = random_lower_string()
    date = (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
    cost = "10.00"
    data = {
        "title": title,
        "description": description,
        "location": location,
        "date": date,
        "cost": cost,
        "school_id": str(school.id),
    }
    r = client.post(
        f"{settings.API_V1_STR}/trips/",
        headers=superuser_token_headers,
        json=data,
    )
    assert 200 <= r.status_code < 300
    created_trip = r.json()
    trip = services.get_trip(session=db, trip_id=uuid.UUID(created_trip["id"]))
    assert trip
    assert trip.title == created_trip["title"]


def test_create_trip_by_normal_user(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    school = create_random_school(db)
    data = {
        "title": "T",
        "location": "L",
        "date": (datetime.now(timezone.utc) + timedelta(days=30)).isoformat(),
        "cost": "10.00",
        "school_id": str(school.id),
    }
    r = client.post(
        f"{settings.API_V1_STR}/trips/",
        headers=normal_user_token_headers,
        json=data,
    )
    assert r.status_code == 403


def test_read_trips_with_registration_count(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    # 1. Create a school
    school = School(
        name="Test School",
        address="Test Address",
    )
    db.add(school)
    db.commit()
    db.refresh(school)

    # 2. Create a trip
    trip_date = datetime.now(timezone.utc) + timedelta(days=30)
    trip = Trip(
        title="Test Trip",
        description="Test Description",
        location="Test Location",
        date=trip_date,
        cost=Decimal("10.00"),
        max_students=30,
        school_id=school.id,
    )
    db.add(trip)
    db.commit()
    db.refresh(trip)

    # 3. Create some registrations
    # 2 confirmed, 1 pending, 1 cancelled
    reg1 = Registration(
        trip_id=trip.id,
        student_name="Student 1",
        parent_name="Parent 1",
        parent_email="parent1@example.com",
        status=RegistrationStatus.CONFIRMED,
    )
    reg2 = Registration(
        trip_id=trip.id,
        student_name="Student 2",
        parent_name="Parent 2",
        parent_email="parent2@example.com",
        status=RegistrationStatus.PENDING,
    )
    reg3 = Registration(
        trip_id=trip.id,
        student_name="Student 3",
        parent_name="Parent 3",
        parent_email="parent3@example.com",
        status=RegistrationStatus.CANCELLED,
    )
    db.add(reg1)
    db.add(reg2)
    db.add(reg3)
    db.commit()

    # 4. Call the API
    r = client.get(
        f"{settings.API_V1_STR}/trips/",
        headers=superuser_token_headers,
    )
    assert r.status_code == 200
    data = r.json()

    # 5. Verify the registration count
    # Count should be 2 (confirmed + pending), excluding cancelled
    found_trip = None
    for item in data["data"]:
        if item["id"] == str(trip.id):
            found_trip = item
            break

    assert found_trip is not None
    assert found_trip["registration_count"] == 2


def test_get_existing_trip(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    trip = create_random_trip(db)
    r = client.get(
        f"{settings.API_V1_STR}/trips/{trip.id}",
        headers=normal_user_token_headers,
    )
    assert 200 <= r.status_code < 300
    api_trip = r.json()
    assert trip.title == api_trip["title"]
    assert "registration_count" in api_trip


def test_get_non_existing_trip(
    client: TestClient, normal_user_token_headers: dict[str, str]
) -> None:
    r = client.get(
        f"{settings.API_V1_STR}/trips/{uuid.uuid4()}",
        headers=normal_user_token_headers,
    )
    assert r.status_code == 404
    assert r.json() == {"detail": "Trip not found"}


def test_update_trip_as_superuser(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    trip = create_random_trip(db)
    new_title = random_lower_string()
    data = {"title": new_title}
    r = client.patch(
        f"{settings.API_V1_STR}/trips/{trip.id}",
        headers=superuser_token_headers,
        json=data,
    )
    assert r.status_code == 200
    updated_trip = r.json()
    assert updated_trip["title"] == new_title
    db.refresh(trip)
    assert trip.title == new_title


def test_update_trip_by_normal_user(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    trip = create_random_trip(db)
    new_title = random_lower_string()
    data = {"title": new_title}
    r = client.patch(
        f"{settings.API_V1_STR}/trips/{trip.id}",
        headers=normal_user_token_headers,
        json=data,
    )
    assert r.status_code == 403


def test_delete_trip_as_superuser(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    trip = create_random_trip(db)
    r = client.delete(
        f"{settings.API_V1_STR}/trips/{trip.id}",
        headers=superuser_token_headers,
    )
    assert r.status_code == 200
    deleted_message = r.json()
    assert deleted_message["message"] == "Trip deleted successfully"
    result = db.exec(select(Trip).where(Trip.id == trip.id)).first()
    assert result is None


def test_delete_trip_by_normal_user(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    trip = create_random_trip(db)
    r = client.delete(
        f"{settings.API_V1_STR}/trips/{trip.id}",
        headers=normal_user_token_headers,
    )
    assert r.status_code == 403
