from __future__ import annotations

import uuid
from typing import Sequence
from sqlmodel import Session, select, func

from app.models import (
    Registration,
    RegistrationStatus,
    Trip,
    TripCreate,
    TripUpdate,
)


def create_trip(*, session: Session, trip_create: TripCreate) -> Trip:
    db_obj = Trip.model_validate(trip_create)
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    return db_obj


def get_trip(*, session: Session, trip_id: uuid.UUID) -> Trip | None:
    return session.get(Trip, trip_id)


def get_trips(
    *,
    session: Session,
    school_id: uuid.UUID | None = None,
    skip: int = 0,
    limit: int = 100,
) -> Sequence[tuple[Trip, int]]:
    registration_count_subquery = (
        select(func.count(Registration.id))  # type: ignore[arg-type]
        .where(
            Registration.trip_id == Trip.id,
            Registration.status != RegistrationStatus.CANCELLED,
        )
        .correlate(Trip)
        .scalar_subquery()
    )
    statement = select(Trip, registration_count_subquery)
    if school_id:
        statement = statement.where(Trip.school_id == school_id)
    statement = statement.offset(skip).limit(limit)
    return session.exec(statement).all()  # type: ignore


def get_trips_count(*, session: Session, school_id: uuid.UUID | None = None) -> int:
    statement = select(func.count()).select_from(Trip)
    if school_id:
        statement = statement.where(Trip.school_id == school_id)
    return session.exec(statement).one()


def get_trip_registration_count(*, session: Session, trip_id: uuid.UUID) -> int:
    statement = (
        select(func.count())
        .select_from(Registration)
        .where(
            Registration.trip_id == trip_id,
            Registration.status != RegistrationStatus.CANCELLED,
        )
    )
    return session.exec(statement).one()


def update_trip(*, session: Session, db_trip: Trip, trip_in: TripUpdate) -> Trip:
    trip_data = trip_in.model_dump(exclude_unset=True)
    db_trip.sqlmodel_update(trip_data)
    session.add(db_trip)
    session.commit()
    session.refresh(db_trip)
    return db_trip


def delete_trip(*, session: Session, db_trip: Trip) -> None:
    session.delete(db_trip)
    session.commit()
