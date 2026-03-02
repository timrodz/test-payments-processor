import uuid
from sqlmodel import Session

from app.api.services import registrations as services
from app.models import RegistrationCreate, RegistrationUpdate
from tests.utils.trip import create_random_trip
from tests.utils.registration import create_random_registration
from tests.utils.utils import random_email, random_lower_string


def test_create_registration(db: Session) -> None:
    trip = create_random_trip(db)
    student_name = random_lower_string()
    parent_name = random_lower_string()
    parent_email = random_email()
    registration_in = RegistrationCreate(
        trip_id=trip.id,
        student_name=student_name,
        parent_name=parent_name,
        parent_email=parent_email,
    )
    registration = services.create_registration(session=db, registration_create=registration_in)
    assert registration.student_name == student_name
    assert registration.parent_email == parent_email
    assert registration.trip_id == trip.id
    assert hasattr(registration, "id")


def test_create_registration_trip_not_found(db: Session) -> None:
    registration_in = RegistrationCreate(
        trip_id=uuid.uuid4(),
        student_name="S",
        parent_name="P",
        parent_email=random_email(),
    )
    try:
        services.create_registration(session=db, registration_create=registration_in)
    except ValueError as e:
        assert str(e) == "Trip not found"


def test_get_registration(db: Session) -> None:
    registration = create_random_registration(db)
    registration_2 = services.get_registration(session=db, registration_id=registration.id)
    assert registration_2
    assert registration.student_name == registration_2.student_name
    assert registration.id == registration_2.id


def test_get_registrations_by_parent(db: Session) -> None:
    email = random_email()
    create_random_registration(db, parent_email=email)
    create_random_registration(db, parent_email=email)
    create_random_registration(db)  # another parent
    
    registrations = services.get_registrations_by_parent(session=db, parent_email=email)
    assert len(registrations) == 2
    for reg in registrations:
        assert reg.parent_email == email


def test_get_registrations_count_by_parent(db: Session) -> None:
    email = random_email()
    initial_count = services.get_registrations_count_by_parent(session=db, parent_email=email)
    create_random_registration(db, parent_email=email)
    count = services.get_registrations_count_by_parent(session=db, parent_email=email)
    assert count == initial_count + 1


def test_get_registrations(db: Session) -> None:
    create_random_registration(db)
    create_random_registration(db)
    registrations = services.get_registrations(session=db)
    assert len(registrations) >= 2


def test_get_registrations_count(db: Session) -> None:
    initial_count = services.get_registrations_count(session=db)
    create_random_registration(db)
    count = services.get_registrations_count(session=db)
    assert count == initial_count + 1


def test_update_registration(db: Session) -> None:
    registration = create_random_registration(db)
    new_student_name = "New Student Name"
    registration_in = RegistrationUpdate(student_name=new_student_name)
    updated_registration = services.update_registration(
        session=db, db_registration=registration, registration_in=registration_in
    )
    assert updated_registration.student_name == new_student_name
    assert updated_registration.id == registration.id


def test_delete_registration(db: Session) -> None:
    registration = create_random_registration(db)
    services.delete_registration(session=db, db_registration=registration)
    registration_2 = services.get_registration(session=db, registration_id=registration.id)
    assert registration_2 is None
