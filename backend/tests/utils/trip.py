from datetime import datetime, timedelta, timezone
from decimal import Decimal

from sqlmodel import Session

from app.api.services import trips as services
from app.models import Trip, TripCreate
from tests.utils.school import create_random_school
from tests.utils.utils import random_lower_string


def create_random_trip(db: Session) -> Trip:
    school = create_random_school(db)
    title = random_lower_string()
    description = random_lower_string()
    location = random_lower_string()
    date = datetime.now(timezone.utc) + timedelta(days=30)
    cost = Decimal("10.00")
    trip_in = TripCreate(
        title=title,
        description=description,
        location=location,
        date=date,
        cost=cost,
        school_id=school.id,
    )
    trip = services.create_trip(session=db, trip_create=trip_in)
    return trip
