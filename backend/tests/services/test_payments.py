import uuid
from unittest.mock import patch, MagicMock
from sqlmodel import Session

from app.api.services import payments as services
from app.models import PaymentProcess, PaymentStatus, RegistrationStatus
from app.legacy.payment_processor import PaymentResponse
from tests.utils.registration import create_random_registration
from tests.utils.trip import create_random_trip


def test_process_payment_success(db: Session) -> None:
    registration = create_random_registration(db)
    payment_in = PaymentProcess(
        registration_id=registration.id,
        card_number="4111111111111111",
        expiry_date="12/30",
        cvv="123",
    )
    
    mock_response = PaymentResponse(success=True, transaction_id="TX-12345")
    with patch("app.api.services.payments.LegacyPaymentProcessor.process_payment", return_value=mock_response):
        payment = services.process_payment(session=db, payment_in=payment_in)
        
    assert payment.status == PaymentStatus.SUCCESS
    assert payment.transaction_id == "TX-12345"
    assert payment.registration_id == registration.id
    
    db.refresh(registration)
    assert registration.status == RegistrationStatus.CONFIRMED


def test_process_payment_failure(db: Session) -> None:
    registration = create_random_registration(db)
    payment_in = PaymentProcess(
        registration_id=registration.id,
        card_number="4111111111111111",
        expiry_date="12/30",
        cvv="123",
    )
    
    mock_response = PaymentResponse(success=False, error_message="Declined")
    with patch("app.api.services.payments.LegacyPaymentProcessor.process_payment", return_value=mock_response):
        payment = services.process_payment(session=db, payment_in=payment_in)
        
    assert payment.status == PaymentStatus.FAILED
    assert payment.error_message == "Declined"
    
    db.refresh(registration)
    assert registration.status == RegistrationStatus.PENDING


def test_process_payment_registration_not_found(db: Session) -> None:
    payment_in = PaymentProcess(
        registration_id=uuid.uuid4(),
        card_number="4111111111111111",
        expiry_date="12/30",
        cvv="123",
    )
    try:
        services.process_payment(session=db, payment_in=payment_in)
    except ValueError as e:
        assert str(e) == "Registration not found"


def test_process_payment_already_confirmed(db: Session) -> None:
    registration = create_random_registration(db)
    registration.status = RegistrationStatus.CONFIRMED
    db.add(registration)
    db.commit()
    
    payment_in = PaymentProcess(
        registration_id=registration.id,
        card_number="4111111111111111",
        expiry_date="12/30",
        cvv="123",
    )
    try:
        services.process_payment(session=db, payment_in=payment_in)
    except ValueError as e:
        assert str(e) == "Registration is already confirmed"


def test_process_payment_trip_not_found(db: Session) -> None:
    registration = create_random_registration(db)
    
    payment_in = PaymentProcess(
        registration_id=registration.id,
        card_number="4111111111111111",
        expiry_date="12/30",
        cvv="123",
    )
    
    # Mock session.get to return None when looking for Trip
    # We need to be careful not to mock it for the registration lookup if it uses session.get
    # But the service uses session.exec for registration and session.get for trip.
    
    original_get = db.get
    def mock_get(model, ident):
        from app.models import Trip
        if model == Trip:
            return None
        return original_get(model, ident)
        
    with patch.object(db, "get", side_effect=mock_get):
        try:
            services.process_payment(session=db, payment_in=payment_in)
        except ValueError as e:
            assert str(e) == "Trip not found"


def test_get_payment(db: Session) -> None:
    # We can use the real processor for one simple test or mock it
    registration = create_random_registration(db)
    payment_in = PaymentProcess(
        registration_id=registration.id,
        card_number="4111111111111111",
        expiry_date="12/30",
        cvv="123",
    )
    
    mock_response = PaymentResponse(success=True, transaction_id="TX-GET")
    with patch("app.api.services.payments.LegacyPaymentProcessor.process_payment", return_value=mock_response):
        payment = services.process_payment(session=db, payment_in=payment_in)
        
    payment_2 = services.get_payment(session=db, payment_id=payment.id)
    assert payment_2
    assert payment_2.transaction_id == "TX-GET"
    assert payment_2.id == payment.id
