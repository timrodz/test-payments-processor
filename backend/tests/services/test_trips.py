from datetime import datetime, timedelta, timezone
from decimal import Decimal

from fastapi.encoders import jsonable_encoder
from sqlmodel import Session

from app.api.services import trips as services
from app.models import Trip, TripCreate, TripUpdate, Registration, RegistrationStatus
from tests.utils.school import create_random_school
from tests.utils.trip import create_random_trip
from tests.utils.utils import random_lower_string


def test_create_trip(db: Session) -> None:
    school = create_random_school(db)
    title = random_lower_string()
    description = random_lower_string()
    location = random_lower_string()
    date = datetime.now(timezone.utc) + timedelta(days=30)
    cost = Decimal("10.00")
    trip_in = TripCreate(
        title=title,
        description=description,
        location=location,
        date=date,
        cost=cost,
        school_id=school.id,
    )
    trip = services.create_trip(session=db, trip_create=trip_in)
    assert trip.title == title
    assert trip.description == description
    assert trip.school_id == school.id
    assert hasattr(trip, "id")


def test_get_trip(db: Session) -> None:
    trip = create_random_trip(db)
    trip_2 = services.get_trip(session=db, trip_id=trip.id)
    assert trip_2
    assert trip.title == trip_2.title
    assert jsonable_encoder(trip) == jsonable_encoder(trip_2)


def test_get_trips(db: Session) -> None:
    create_random_trip(db)
    create_random_trip(db)
    trips = services.get_trips(session=db)
    assert len(trips) >= 2
    for trip, reg_count in trips:
        assert isinstance(trip, Trip)
        assert isinstance(reg_count, int)


def test_get_trips_by_school(db: Session) -> None:
    school = create_random_school(db)
    title = random_lower_string()
    trip_in = TripCreate(
        title=title,
        location="Location",
        date=datetime.now(timezone.utc) + timedelta(days=30),
        cost=Decimal("10.00"),
        school_id=school.id,
    )
    services.create_trip(session=db, trip_create=trip_in)
    create_random_trip(db)  # another trip in another school
    
    trips = services.get_trips(session=db, school_id=school.id)
    assert len(trips) == 1
    assert trips[0][0].title == title


def test_get_trips_count(db: Session) -> None:
    initial_count = services.get_trips_count(session=db)
    trip = create_random_trip(db)
    count = services.get_trips_count(session=db)
    assert count == initial_count + 1
    
    # Test with school_id
    count_school = services.get_trips_count(session=db, school_id=trip.school_id)
    assert count_school == 1


def test_get_trip_registration_count(db: Session) -> None:
    trip = create_random_trip(db)
    reg1 = Registration(
        trip_id=trip.id,
        student_name="S1",
        parent_name="P1",
        parent_email="p1@e.com",
        status=RegistrationStatus.CONFIRMED,
    )
    reg2 = Registration(
        trip_id=trip.id,
        student_name="S2",
        parent_name="P2",
        parent_email="p2@e.com",
        status=RegistrationStatus.CANCELLED,
    )
    db.add(reg1)
    db.add(reg2)
    db.commit()
    
    count = services.get_trip_registration_count(session=db, trip_id=trip.id)
    assert count == 1


def test_update_trip(db: Session) -> None:
    trip = create_random_trip(db)
    new_title = random_lower_string()
    trip_in_update = TripUpdate(title=new_title)
    services.update_trip(session=db, db_trip=trip, trip_in=trip_in_update)
    trip_2 = services.get_trip(session=db, trip_id=trip.id)
    assert trip_2
    assert trip_2.title == new_title


def test_delete_trip(db: Session) -> None:
    trip = create_random_trip(db)
    services.delete_trip(session=db, db_trip=trip)
    trip_2 = services.get_trip(session=db, trip_id=trip.id)
    assert trip_2 is None
