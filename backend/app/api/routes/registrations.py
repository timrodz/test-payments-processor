from __future__ import annotations

import uuid
from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import CurrentUser, SessionDep, get_current_active_superuser
from app.api.services import registrations as registration_service
from app.models import (
    Message,
    Registration,
    RegistrationCreate,
    RegistrationUpdate,
    RegistrationPublic,
    RegistrationsPublic,
)

router = APIRouter(prefix="/registrations", tags=["registrations"])


@router.get(
    "/",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=RegistrationsPublic,
)
def read_registrations(
    session: SessionDep, trip_id: uuid.UUID | None = None, skip: int = 0, limit: int = 100
) -> RegistrationsPublic:
    """
    Retrieve registrations.
    """
    count = registration_service.get_registrations_count(
        session=session, trip_id=trip_id
    )
    registrations = registration_service.get_registrations(
        session=session, trip_id=trip_id, skip=skip, limit=limit
    )

    return RegistrationsPublic(data=registrations, count=count)


@router.get("/me", response_model=RegistrationsPublic)
def read_my_registrations(
    session: SessionDep, current_user: CurrentUser, skip: int = 0, limit: int = 100
) -> RegistrationsPublic:
    """
    Retrieve current user's registrations.
    """
    count = registration_service.get_registrations_count_by_parent(
        session=session, parent_email=current_user.email
    )
    registrations = registration_service.get_registrations_by_parent(
        session=session, parent_email=current_user.email, skip=skip, limit=limit
    )

    return RegistrationsPublic(data=registrations, count=count)


@router.post("/", response_model=RegistrationPublic)
def create_registration(
    *, session: SessionDep, registration_in: RegistrationCreate
) -> Registration:
    """
    Register a student for a trip.
    """
    try:
        registration = registration_service.create_registration(
            session=session, registration_create=registration_in
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return registration


@router.get("/{registration_id}", response_model=RegistrationPublic)
def read_registration_by_id(
    registration_id: uuid.UUID, session: SessionDep
) -> Registration:
    """
    Get a specific registration by id.
    """
    registration = registration_service.get_registration(
        session=session, registration_id=registration_id
    )
    if registration is None:
        raise HTTPException(status_code=404, detail="Registration not found")
    return registration


@router.patch(
    "/{registration_id}",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=RegistrationPublic,
)
def update_registration(
    *,
    session: SessionDep,
    registration_id: uuid.UUID,
    registration_in: RegistrationUpdate,
) -> Registration:
    """
    Update a registration.
    """
    db_registration = registration_service.get_registration(
        session=session, registration_id=registration_id
    )
    if not db_registration:
        raise HTTPException(status_code=404, detail="Registration not found")
    db_registration = registration_service.update_registration(
        session=session, db_registration=db_registration, registration_in=registration_in
    )
    return db_registration


@router.delete(
    "/{registration_id}",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=Message,
)
def delete_registration(session: SessionDep, registration_id: uuid.UUID) -> Message:
    """
    Delete a registration.
    """
    registration = registration_service.get_registration(
        session=session, registration_id=registration_id
    )
    if not registration:
        raise HTTPException(status_code=404, detail="Registration not found")
    registration_service.delete_registration(
        session=session, db_registration=registration
    )
    return Message(message="Registration deleted successfully")
