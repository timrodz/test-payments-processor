from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import SessionDep, get_current_active_superuser
from app.api.services import schools as school_service
from app.models import (
    Message,
    School,
    SchoolCreate,
    SchoolPublic,
    SchoolUpdate,
    SchoolsPublic,
)

router = APIRouter(prefix="/schools", tags=["schools"])


@router.get("/", response_model=SchoolsPublic)
def read_schools(session: SessionDep, skip: int = 0, limit: int = 100) -> SchoolsPublic:
    """
    Retrieve schools.
    """
    count = school_service.get_schools_count(session=session)
    schools = school_service.get_schools(session=session, skip=skip, limit=limit)

    return SchoolsPublic(data=schools, count=count)


@router.post(
    "/",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=SchoolPublic,
)
def create_school(*, session: SessionDep, school_in: SchoolCreate) -> School:
    """
    Create new school.
    """
    school = school_service.create_school(session=session, school_create=school_in)
    return school


@router.get("/{school_id}", response_model=SchoolPublic)
def read_school_by_id(school_id: uuid.UUID, session: SessionDep) -> School:
    """
    Get a specific school by id.
    """
    school = school_service.get_school(session=session, school_id=school_id)
    if school is None:
        raise HTTPException(status_code=404, detail="School not found")
    return school


@router.patch(
    "/{school_id}",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=SchoolPublic,
)
def update_school(
    *,
    session: SessionDep,
    school_id: uuid.UUID,
    school_in: SchoolUpdate,
) -> School:
    """
    Update a school.
    """
    db_school = school_service.get_school(session=session, school_id=school_id)
    if not db_school:
        raise HTTPException(status_code=404, detail="School not found")
    db_school = school_service.update_school(
        session=session, db_school=db_school, school_in=school_in
    )
    return db_school


@router.delete(
    "/{school_id}",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=Message,
)
def delete_school(session: SessionDep, school_id: uuid.UUID) -> Message:
    """
    Delete a school.
    """
    school = school_service.get_school(session=session, school_id=school_id)
    if not school:
        raise HTTPException(status_code=404, detail="School not found")
    school_service.delete_school(session=session, db_school=school)
    return Message(message="School deleted successfully")
