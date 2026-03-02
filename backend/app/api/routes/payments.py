from __future__ import annotations

import uuid
from fastapi import APIRouter, HTTPException

from app.api.deps import SessionDep
from app.api.services import payments as payment_service
from app.models import (
    Payment,
    PaymentProcess,
    PaymentPublic,
)

router = APIRouter(prefix="/payments", tags=["payments"])


@router.post("/", response_model=PaymentPublic)
def submit_payment(*, session: SessionDep, payment_in: PaymentProcess) -> Payment:
    """
    Submit payment for a registration.
    """
    try:
        payment = payment_service.process_payment(
            session=session, payment_in=payment_in
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return payment


@router.get("/{payment_id}", response_model=PaymentPublic)
def read_payment_by_id(payment_id: uuid.UUID, session: SessionDep) -> Payment:
    """
    Get a specific payment by id.
    """
    payment = payment_service.get_payment(session=session, payment_id=payment_id)
    if payment is None:
        raise HTTPException(status_code=404, detail="Payment not found")
    return payment
