import uuid

from fastapi.testclient import TestClient
from sqlmodel import Session, select

from app.api.services import schools as services
from app.core.config import settings
from app.models import School
from tests.utils.school import create_random_school
from tests.utils.utils import random_lower_string


def test_create_school_as_superuser(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    name = random_lower_string()
    address = random_lower_string()
    data = {"name": name, "address": address}
    r = client.post(
        f"{settings.API_V1_STR}/schools/",
        headers=superuser_token_headers,
        json=data,
    )
    assert 200 <= r.status_code < 300
    created_school = r.json()
    school = services.get_school(session=db, school_id=uuid.UUID(created_school["id"]))
    assert school
    assert school.name == created_school["name"]


def test_create_school_by_normal_user(
    client: TestClient, normal_user_token_headers: dict[str, str]
) -> None:
    name = random_lower_string()
    address = random_lower_string()
    data = {"name": name, "address": address}
    r = client.post(
        f"{settings.API_V1_STR}/schools/",
        headers=normal_user_token_headers,
        json=data,
    )
    assert r.status_code == 403


def test_get_existing_school(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    school = create_random_school(db)
    r = client.get(
        f"{settings.API_V1_STR}/schools/{school.id}",
        headers=normal_user_token_headers,
    )
    assert 200 <= r.status_code < 300
    api_school = r.json()
    assert school.name == api_school["name"]


def test_get_non_existing_school(
    client: TestClient, normal_user_token_headers: dict[str, str]
) -> None:
    r = client.get(
        f"{settings.API_V1_STR}/schools/{uuid.uuid4()}",
        headers=normal_user_token_headers,
    )
    assert r.status_code == 404
    assert r.json() == {"detail": "School not found"}


def test_retrieve_schools(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    create_random_school(db)
    create_random_school(db)

    r = client.get(f"{settings.API_V1_STR}/schools/", headers=normal_user_token_headers)
    all_schools = r.json()

    assert len(all_schools["data"]) >= 2
    assert "count" in all_schools
    for item in all_schools["data"]:
        assert "name" in item


def test_update_school_as_superuser(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    school = create_random_school(db)
    new_name = random_lower_string()
    data = {"name": new_name}
    r = client.patch(
        f"{settings.API_V1_STR}/schools/{school.id}",
        headers=superuser_token_headers,
        json=data,
    )
    assert r.status_code == 200
    updated_school = r.json()
    assert updated_school["name"] == new_name
    db.refresh(school)
    assert school.name == new_name


def test_update_school_by_normal_user(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    school = create_random_school(db)
    new_name = random_lower_string()
    data = {"name": new_name}
    r = client.patch(
        f"{settings.API_V1_STR}/schools/{school.id}",
        headers=normal_user_token_headers,
        json=data,
    )
    assert r.status_code == 403


def test_delete_school_as_superuser(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    school = create_random_school(db)
    r = client.delete(
        f"{settings.API_V1_STR}/schools/{school.id}",
        headers=superuser_token_headers,
    )
    assert r.status_code == 200
    deleted_message = r.json()
    assert deleted_message["message"] == "School deleted successfully"
    result = db.exec(select(School).where(School.id == school.id)).first()
    assert result is None


def test_delete_school_by_normal_user(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    school = create_random_school(db)
    r = client.delete(
        f"{settings.API_V1_STR}/schools/{school.id}",
        headers=normal_user_token_headers,
    )
    assert r.status_code == 403
