import uuid
from unittest.mock import patch
from fastapi.testclient import TestClient
from sqlmodel import Session

from app.core.config import settings
from app.models import PaymentStatus, RegistrationStatus
from app.legacy.payment_processor import PaymentResponse
from tests.utils.registration import create_random_registration


def test_submit_payment_success(client: TestClient, db: Session) -> None:
    registration = create_random_registration(db)
    data = {
        "registration_id": str(registration.id),
        "card_number": "4111111111111111",
        "expiry_date": "12/30",
        "cvv": "123",
    }
    
    mock_response = PaymentResponse(success=True, transaction_id="TX-API")
    with patch("app.api.services.payments.LegacyPaymentProcessor.process_payment", return_value=mock_response):
        r = client.post(
            f"{settings.API_V1_STR}/payments/",
            json=data,
        )
        
    assert r.status_code == 200
    payment_out = r.json()
    assert payment_out["status"] == PaymentStatus.SUCCESS
    assert payment_out["transaction_id"] == "TX-API"
    
    db.refresh(registration)
    assert registration.status == RegistrationStatus.CONFIRMED


def test_submit_payment_invalid_registration(client: TestClient) -> None:
    data = {
        "registration_id": str(uuid.uuid4()),
        "card_number": "4111111111111111",
        "expiry_date": "12/30",
        "cvv": "123",
    }
    r = client.post(
        f"{settings.API_V1_STR}/payments/",
        json=data,
    )
    assert r.status_code == 400
    assert r.json()["detail"] == "Registration not found"


def test_read_payment_by_id(client: TestClient, db: Session) -> None:
    registration = create_random_registration(db)
    data = {
        "registration_id": str(registration.id),
        "card_number": "4111111111111111",
        "expiry_date": "12/30",
        "cvv": "123",
    }
    
    mock_response = PaymentResponse(success=True, transaction_id="TX-READ")
    with patch("app.api.services.payments.LegacyPaymentProcessor.process_payment", return_value=mock_response):
        r_post = client.post(
            f"{settings.API_V1_STR}/payments/",
            json=data,
        )
        
    payment_id = r_post.json()["id"]
    r = client.get(
        f"{settings.API_V1_STR}/payments/{payment_id}",
    )
    assert r.status_code == 200
    api_payment = r.json()
    assert api_payment["id"] == payment_id
    assert api_payment["transaction_id"] == "TX-READ"


def test_read_payment_not_found(client: TestClient) -> None:
    r = client.get(
        f"{settings.API_V1_STR}/payments/{uuid.uuid4()}",
    )
    assert r.status_code == 404
    assert r.json()["detail"] == "Payment not found"
