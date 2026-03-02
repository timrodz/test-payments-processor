from fastapi.encoders import jsonable_encoder
from sqlmodel import Session

from app.api.services import schools as services
from app.models import SchoolCreate, SchoolUpdate
from tests.utils.utils import random_lower_string


def test_create_school(db: Session) -> None:
    name = random_lower_string()
    address = random_lower_string()
    school_in = SchoolCreate(name=name, address=address)
    school = services.create_school(session=db, school_create=school_in)
    assert school.name == name
    assert school.address == address
    assert hasattr(school, "id")


def test_get_school(db: Session) -> None:
    name = random_lower_string()
    address = random_lower_string()
    school_in = SchoolCreate(name=name, address=address)
    school = services.create_school(session=db, school_create=school_in)
    school_2 = services.get_school(session=db, school_id=school.id)
    assert school_2
    assert school.name == school_2.name
    assert jsonable_encoder(school) == jsonable_encoder(school_2)


def test_update_school(db: Session) -> None:
    name = random_lower_string()
    address = random_lower_string()
    school_in = SchoolCreate(name=name, address=address)
    school = services.create_school(session=db, school_create=school_in)
    new_name = random_lower_string()
    school_in_update = SchoolUpdate(name=new_name)
    services.update_school(session=db, db_school=school, school_in=school_in_update)
    school_2 = services.get_school(session=db, school_id=school.id)
    assert school_2
    assert school_2.name == new_name
    assert school_2.address == address


def test_delete_school(db: Session) -> None:
    name = random_lower_string()
    address = random_lower_string()
    school_in = SchoolCreate(name=name, address=address)
    school = services.create_school(session=db, school_create=school_in)
    services.delete_school(session=db, db_school=school)
    school_2 = services.get_school(session=db, school_id=school.id)
    assert school_2 is None
