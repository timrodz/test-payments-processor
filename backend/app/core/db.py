from sqlmodel import create_engine

from app.core.config import settings

database_uri = str(settings.SQLALCHEMY_DATABASE_URI)
engine = create_engine(database_uri)
