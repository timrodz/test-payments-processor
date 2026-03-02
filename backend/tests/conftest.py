from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, create_engine, SQLModel, select
from sqlalchemy import text
from pydantic import PostgresDsn

from app.api.deps import get_db
from app.api.services.users import create_user
from app.core.config import settings
from app.main import app
from app.models import User, UserCreate
from tests.utils.user import authentication_token_from_email
from tests.utils.utils import get_superuser_token_headers


# Build test db url
test_db_name = f"{settings.POSTGRES_DB}_test"
test_database_uri = str(
    PostgresDsn.build(
        scheme="postgresql+psycopg",
        username=settings.POSTGRES_USER,
        password=settings.POSTGRES_PASSWORD,
        host=settings.POSTGRES_SERVER,
        port=settings.POSTGRES_PORT,
        path=test_db_name,
    )
)

# Build server db url to connect and create the test db
server_database_uri = str(
    PostgresDsn.build(
        scheme="postgresql+psycopg",
        username=settings.POSTGRES_USER,
        password=settings.POSTGRES_PASSWORD,
        host=settings.POSTGRES_SERVER,
        port=settings.POSTGRES_PORT,
        path="postgres",
    )
)


def setup_test_data(session: Session) -> None:
    user = session.exec(
        select(User).where(User.email == settings.EMAIL_TEST_SUPERUSER)
    ).first()
    if not user:
        user_in = UserCreate(
            email=settings.EMAIL_TEST_SUPERUSER,
            password=settings.EMAIL_TEST_SUPERUSER_PASSWORD,
            is_superuser=True,
        )
        user = create_user(session=session, user_create=user_in)


@pytest.fixture(scope="session", autouse=True)
def engine_for_test():
    # Connect to default postgres DB to create the test DB
    server_engine = create_engine(server_database_uri, isolation_level="AUTOCOMMIT")
    with server_engine.connect() as conn:
        conn.execute(text(f"DROP DATABASE IF EXISTS {test_db_name} WITH (FORCE)"))
        conn.execute(text(f"CREATE DATABASE {test_db_name}"))

    test_engine = create_engine(test_database_uri)
    SQLModel.metadata.create_all(test_engine)

    yield test_engine

    test_engine.dispose()
    with server_engine.connect() as conn:
        conn.execute(text(f"DROP DATABASE IF EXISTS {test_db_name} WITH (FORCE)"))


@pytest.fixture(scope="session", autouse=True)
def db(engine_for_test) -> Generator[Session, None, None]:
    with Session(engine_for_test) as session:
        setup_test_data(session)
        yield session


@pytest.fixture(scope="module")
def client(engine_for_test) -> Generator[TestClient, None, None]:
    def override_get_db() -> Generator[Session, None, None]:
        with Session(engine_for_test) as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture(scope="module")
def superuser_token_headers(client: TestClient) -> dict[str, str]:
    return get_superuser_token_headers(client)


@pytest.fixture(scope="module")
def normal_user_token_headers(client: TestClient, db: Session) -> dict[str, str]:
    return authentication_token_from_email(
        client=client, email=settings.EMAIL_TEST_USER, db=db
    )
