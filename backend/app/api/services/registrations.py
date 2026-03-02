from __future__ import annotations

import uuid
from sqlmodel import Session, select, func

from typing import Sequence
from app.models import Registration, RegistrationCreate, RegistrationUpdate, RegistrationStatus, Trip


def create_registration(*, session: Session, registration_create: RegistrationCreate) -> Registration:
    # Check if trip exists
    trip = session.get(Trip, registration_create.trip_id)
    if not trip:
        raise ValueError("Trip not found")

    # Check capacity
    count_statement = select(func.count()).select_from(Registration).where(
        Registration.trip_id == registration_create.trip_id,
        Registration.status != RegistrationStatus.CANCELLED
    )
    current_registrations = session.exec(count_statement).one()
    if current_registrations >= trip.max_students:
        raise ValueError("Trip is at full capacity")

    db_obj = Registration.model_validate(registration_create)
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    return db_obj


def get_registration(*, session: Session, registration_id: uuid.UUID) -> Registration | None:
    return session.get(Registration, registration_id)


def get_registrations(*, session: Session, trip_id: uuid.UUID | None = None, skip: int = 0, limit: int = 100) -> Sequence[Registration]:
    statement = select(Registration)
    if trip_id:
        statement = statement.where(Registration.trip_id == trip_id)
    statement = statement.offset(skip).limit(limit)
    return session.exec(statement).all()


def get_registrations_count(*, session: Session, trip_id: uuid.UUID | None = None) -> int:
    statement = select(func.count()).select_from(Registration)
    if trip_id:
        statement = statement.where(Registration.trip_id == trip_id)
    return session.exec(statement).one()


def get_registrations_by_parent(*, session: Session, parent_email: str, skip: int = 0, limit: int = 100) -> Sequence[Registration]:
    statement = (
        select(Registration)
        .where(Registration.parent_email == parent_email)
        .offset(skip)
        .limit(limit)
    )
    return session.exec(statement).all()


def get_registrations_count_by_parent(*, session: Session, parent_email: str) -> int:
    statement = (
        select(func.count())
        .select_from(Registration)
        .where(Registration.parent_email == parent_email)
    )
    return session.exec(statement).one()


def update_registration(*, session: Session, db_registration: Registration, registration_in: RegistrationUpdate) -> Registration:
    update_data = registration_in.model_dump(exclude_unset=True)
    db_registration.sqlmodel_update(update_data)
    session.add(db_registration)
    session.commit()
    session.refresh(db_registration)
    return db_registration


def delete_registration(*, session: Session, db_registration: Registration) -> None:
    session.delete(db_registration)
    session.commit()
