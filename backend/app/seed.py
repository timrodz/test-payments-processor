from __future__ import annotations

from datetime import datetime, timedelta, timezone
from decimal import Decimal

from loguru import logger
from sqlmodel import Session, select

from app.api.services import users as user_service
from app.core.db import engine
from app.models import School, Trip, UserCreate


def seed_data() -> None:
    with Session(engine) as session:
        # Create default superuser
        admin_email = "admin@schooly.com"
        admin_user = user_service.get_user_by_email(session=session, email=admin_email)
        if not admin_user:
            admin_in = UserCreate(
                email=admin_email,
                password="adminpassword",
                is_superuser=True,
                full_name="Admin User",
            )
            user_service.create_user(session=session, user_create=admin_in)
            logger.info(f"Created admin user: {admin_email}")
        else:
            logger.info(f"Admin user already exists: {admin_email}")

        # Create default parent user
        parent_email = "parent@example.com"
        parent_user = user_service.get_user_by_email(
            session=session, email=parent_email
        )
        if not parent_user:
            parent_in = UserCreate(
                email=parent_email,
                password="parentpassword",
                is_superuser=False,
                full_name="Demo Parent",
            )
            user_service.create_user(session=session, user_create=parent_in)
            logger.info(f"Created parent user: {parent_email}")
        else:
            logger.info(f"Parent user already exists: {parent_email}")

        # Check if school already exists
        school_name = "Demo Elementary School"
        school = session.exec(select(School).where(School.name == school_name)).first()
        if not school:
            school = School(
                name=school_name,
                address="123 Education Lane, Learning City",
            )
            session.add(school)
            session.commit()
            session.refresh(school)
            logger.info(f"Created school: {school.name}")
        else:
            logger.info(f"School already exists: {school.name}")

        # Check if trip already exists
        trip_title = "Museum Field Trip"
        trip = session.exec(
            select(Trip).where(Trip.title == trip_title, Trip.school_id == school.id)
        ).first()
        if not trip:
            # Set date to next month
            trip_date = datetime.now(timezone.utc) + timedelta(days=30)
            trip = Trip(
                title=trip_title,
                description="A wonderful trip to the local museum to learn about history and science.",
                location="City History Museum",
                date=trip_date,
                cost=Decimal("25.00"),
                max_students=30,
                school_id=school.id,
            )
            session.add(trip)
            session.commit()
            session.refresh(trip)
            logger.info(f"Created trip: {trip.title}")
        else:
            logger.info(f"Trip already exists: {trip.title}")


if __name__ == "__main__":
    logger.info("Seeding database...")
    seed_data()
    logger.info("Done!")
