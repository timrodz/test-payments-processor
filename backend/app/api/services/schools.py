from __future__ import annotations

import uuid
from typing import Sequence
from sqlmodel import Session, select, func

from app.models import School, SchoolCreate, SchoolUpdate


def create_school(*, session: Session, school_create: SchoolCreate) -> School:
    db_obj = School.model_validate(school_create)
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    return db_obj


def get_school(*, session: Session, school_id: uuid.UUID) -> School | None:
    return session.get(School, school_id)


def get_schools(*, session: Session, skip: int = 0, limit: int = 100) -> Sequence[School]:
    statement = select(School).offset(skip).limit(limit)
    return session.exec(statement).all()


def get_schools_count(*, session: Session) -> int:
    statement = select(func.count()).select_from(School)
    return session.exec(statement).one()


def update_school(*, session: Session, db_school: School, school_in: SchoolUpdate) -> School:
    school_data = school_in.model_dump(exclude_unset=True)
    db_school.sqlmodel_update(school_data)
    session.add(db_school)
    session.commit()
    session.refresh(db_school)
    return db_school


def delete_school(*, session: Session, db_school: School) -> None:
    session.delete(db_school)
    session.commit()
