from sqlmodel import Session

from app.api.services import registrations as services
from app.models import Registration, RegistrationCreate
from tests.utils.trip import create_random_trip
from tests.utils.utils import random_email, random_lower_string


def create_random_registration(db: Session, *, parent_email: str | None = None) -> Registration:
    trip = create_random_trip(db)
    student_name = random_lower_string()
    parent_name = random_lower_string()
    email = parent_email or random_email()
    registration_in = RegistrationCreate(
        trip_id=trip.id,
        student_name=student_name,
        parent_name=parent_name,
        parent_email=email,
    )
    registration = services.create_registration(session=db, registration_create=registration_in)
    return registration
