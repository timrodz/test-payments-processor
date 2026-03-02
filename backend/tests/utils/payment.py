from sqlmodel import Session

from app.api.services import payments as services
from app.models import Payment, PaymentProcess
from tests.utils.registration import create_random_registration


def create_random_payment(db: Session) -> Payment:
    registration = create_random_registration(db)
    payment_in = PaymentProcess(
        registration_id=registration.id,
        card_number="4111111111111111",  # Mock a valid Visa
        expiry_date="12/30",
        cvv="123",
    )
    payment = services.process_payment(session=db, payment_in=payment_in)
    return payment
