from __future__ import annotations

import uuid
from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import SessionDep, get_current_active_superuser
from app.api.services import trips as trip_service
from app.models import (
    Message,
    Trip,
    TripCreate,
    TripPublic,
    TripUpdate,
    TripsPublic,
)

router = APIRouter(prefix="/trips", tags=["trips"])


@router.get("/", response_model=TripsPublic)
def read_trips(
    session: SessionDep,
    school_id: uuid.UUID | None = None,
    skip: int = 0,
    limit: int = 100,
) -> TripsPublic:
    """
    Retrieve trips.
    """
    count = trip_service.get_trips_count(session=session, school_id=school_id)
    trips_with_counts = trip_service.get_trips(
        session=session, school_id=school_id, skip=skip, limit=limit
    )

    return TripsPublic(
        data=[
            TripPublic.model_validate(trip, update={"registration_count": reg_count})
            for trip, reg_count in trips_with_counts
        ],
        count=count,
    )


@router.post(
    "/", dependencies=[Depends(get_current_active_superuser)], response_model=TripPublic
)
def create_trip(*, session: SessionDep, trip_in: TripCreate) -> Trip:
    """
    Create new trip.
    """
    trip = trip_service.create_trip(session=session, trip_create=trip_in)
    return trip


@router.get("/{trip_id}", response_model=TripPublic)
def read_trip_by_id(trip_id: uuid.UUID, session: SessionDep) -> TripPublic:
    """
    Get a specific trip by id.
    """
    trip = trip_service.get_trip(session=session, trip_id=trip_id)
    if trip is None:
        raise HTTPException(status_code=404, detail="Trip not found")
    count = trip_service.get_trip_registration_count(session=session, trip_id=trip_id)
    return TripPublic.model_validate(trip, update={"registration_count": count})


@router.patch(
    "/{trip_id}",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=TripPublic,
)
def update_trip(
    *,
    session: SessionDep,
    trip_id: uuid.UUID,
    trip_in: TripUpdate,
) -> Trip:
    """
    Update a trip.
    """
    db_trip = trip_service.get_trip(session=session, trip_id=trip_id)
    if not db_trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    db_trip = trip_service.update_trip(
        session=session, db_trip=db_trip, trip_in=trip_in
    )
    return db_trip


@router.delete(
    "/{trip_id}",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=Message,
)
def delete_trip(session: SessionDep, trip_id: uuid.UUID) -> Message:
    """
    Delete a trip.
    """
    trip = trip_service.get_trip(session=session, trip_id=trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    trip_service.delete_trip(session=session, db_trip=trip)
    return Message(message="Trip deleted successfully")
