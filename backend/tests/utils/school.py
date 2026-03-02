from sqlmodel import Session

from app.api.services import schools as services
from app.models import School, SchoolCreate
from tests.utils.utils import random_lower_string


def create_random_school(db: Session) -> School:
    name = random_lower_string()
    address = random_lower_string()
    school_in = SchoolCreate(name=name, address=address)
    school = services.create_school(session=db, school_create=school_in)
    return school
