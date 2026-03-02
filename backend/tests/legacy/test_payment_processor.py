import pytest
from unittest.mock import patch
from app.legacy.payment_processor import LegacyPaymentProcessor


@pytest.fixture
def processor():
    return LegacyPaymentProcessor()


@pytest.fixture
def valid_payment_data():
    return {
        "student_name": "John Doe",
        "parent_name": "Jane Doe",
        "amount": 100.0,
        "card_number": "1234567812345678",
        "expiry_date": "12/25",
        "cvv": "123",
        "school_id": "school_1",
        "activity_id": "activity_1",
    }


def test_missing_required_fields(processor, valid_payment_data):
    required_fields = [
        "student_name",
        "parent_name",
        "amount",
        "card_number",
        "expiry_date",
        "cvv",
        "school_id",
        "activity_id",
    ]
    for field in required_fields:
        data = valid_payment_data.copy()
        del data[field]

        response = processor.process_payment(data)
        assert response.success is False
        assert f"Missing required field: {field}" in response.error_message


def test_invalid_card_number_length(processor, valid_payment_data):
    # Too short
    valid_payment_data["card_number"] = "123456789012345"
    response = processor.process_payment(valid_payment_data)
    assert response.success is False
    assert "Invalid card number" in response.error_message

    # Too long
    valid_payment_data["card_number"] = "12345678901234567"
    response = processor.process_payment(valid_payment_data)
    assert response.success is False
    assert "Invalid card number" in response.error_message


def test_invalid_card_number_non_digits(processor, valid_payment_data):
    valid_payment_data["card_number"] = "123456781234567a"
    response = processor.process_payment(valid_payment_data)
    assert response.success is False
    assert "Invalid card number" in response.error_message


def test_card_number_with_spaces(processor, valid_payment_data):
    valid_payment_data["card_number"] = "1234 5678 1234 5678"
    with patch("time.sleep"), patch("random.random", return_value=0.5):
        response = processor.process_payment(valid_payment_data)
        assert response.success is True


def test_invalid_expiry_format_not_string(processor, valid_payment_data):
    valid_payment_data["expiry_date"] = 1225
    response = processor.process_payment(valid_payment_data)
    assert response.success is False
    assert "Invalid expiry date format" in response.error_message


def test_invalid_expiry_format_length(processor, valid_payment_data):
    valid_payment_data["expiry_date"] = "12/2"
    response = processor.process_payment(valid_payment_data)
    assert response.success is False
    assert "Invalid expiry date format" in response.error_message


def test_invalid_expiry_format_separator(processor, valid_payment_data):
    valid_payment_data["expiry_date"] = "12-25"
    response = processor.process_payment(valid_payment_data)
    assert response.success is False
    assert "Invalid expiry date format" in response.error_message


def test_invalid_expiry_format_non_digits(processor, valid_payment_data):
    valid_payment_data["expiry_date"] = "aa/25"
    response = processor.process_payment(valid_payment_data)
    assert response.success is False
    assert "Invalid expiry date format" in response.error_message

    valid_payment_data["expiry_date"] = "12/bb"
    response = processor.process_payment(valid_payment_data)
    assert response.success is False
    assert "Invalid expiry date format" in response.error_message


def test_invalid_expiry_month_range(processor, valid_payment_data):
    # Month 0
    valid_payment_data["expiry_date"] = "00/25"
    response = processor.process_payment(valid_payment_data)
    assert response.success is False
    assert "Invalid expiry date format" in response.error_message

    # Month 13
    valid_payment_data["expiry_date"] = "13/25"
    response = processor.process_payment(valid_payment_data)
    assert response.success is False
    assert "Invalid expiry date format" in response.error_message


def test_invalid_cvv_length(processor, valid_payment_data):
    # Too short
    valid_payment_data["cvv"] = "12"
    response = processor.process_payment(valid_payment_data)
    assert response.success is False
    assert "Invalid CVV" in response.error_message

    # Too long
    valid_payment_data["cvv"] = "1234"
    response = processor.process_payment(valid_payment_data)
    assert response.success is False
    assert "Invalid CVV" in response.error_message


def test_invalid_cvv_non_digits(processor, valid_payment_data):
    valid_payment_data["cvv"] = "12a"
    response = processor.process_payment(valid_payment_data)
    assert response.success is False
    assert "Invalid CVV" in response.error_message


def test_invalid_amount_not_positive(processor, valid_payment_data):
    # Zero
    valid_payment_data["amount"] = 0
    response = processor.process_payment(valid_payment_data)
    assert response.success is False
    assert "Payment amount must be a positive number" in response.error_message

    # Negative
    valid_payment_data["amount"] = -10.0
    response = processor.process_payment(valid_payment_data)
    assert response.success is False
    assert "Payment amount must be a positive number" in response.error_message


def test_invalid_amount_type(processor, valid_payment_data):
    valid_payment_data["amount"] = "100"
    response = processor.process_payment(valid_payment_data)
    assert response.success is False
    assert "Payment amount must be a positive number" in response.error_message


@patch("time.sleep")
@patch("random.random")
def test_payment_failure_simulation(
    mock_random, mock_sleep, processor, valid_payment_data
):
    # Simulate random < 0.1 (failure)
    mock_random.return_value = 0.05
    response = processor.process_payment(valid_payment_data)

    assert response.success is False
    assert "Payment declined by processor" in response.error_message
    mock_sleep.assert_called_once_with(1.5)


@patch("time.sleep")
@patch("random.random")
@patch("time.time")
@patch("random.randint")
def test_payment_success(
    mock_randint, mock_time, mock_random, mock_sleep, processor, valid_payment_data
):
    # Simulate random >= 0.1 (success)
    mock_random.return_value = 0.1
    mock_time.return_value = 1234567890
    mock_randint.return_value = 9999

    response = processor.process_payment(valid_payment_data)

    assert response.success is True
    assert response.transaction_id == "TX-1234567890-9999"
    assert response.error_message is None
    mock_sleep.assert_called_once_with(1.5)
