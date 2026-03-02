import re
import uuid
from datetime import datetime, timezone
from decimal import Decimal
from enum import Enum

from pydantic import BaseModel, EmailStr, field_validator
from pydantic import Field as PydanticField
from sqlalchemy import DateTime
from sqlmodel import Field, Relationship, SQLModel

EXPIRY_DATE_REGEX = r"^(0[1-9]|1[0-2])\/[0-9]{2}$"
# Visa: 4... (16 digits)
# Mastercard: 51-55 or 2221-2720 (16 digits)
CARD_NUMBER_REGEX = r"^(?:4[0-9]{15}|5[1-5][0-9]{14}|2(22[1-9][0-9]{12}|2[3-9][0-9]{13}|[3-6][0-9]{14}|7[0-1][0-9]{13}|720[0-9]{12}))$"


def get_datetime_utc() -> datetime:
    return datetime.now(timezone.utc)


# Shared properties
class UserBase(SQLModel):
    __tablename__ = "users"
    email: EmailStr = Field(unique=True, index=True, max_length=255)
    is_active: bool = True
    is_superuser: bool = False
    full_name: str | None = Field(default=None, max_length=255)


# Properties to receive via API on creation
class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=128)


class UserRegister(SQLModel):
    email: EmailStr = Field(max_length=255)
    password: str = Field(min_length=8, max_length=128)
    full_name: str | None = Field(default=None, max_length=255)


# Properties to receive via API on update, all are optional
class UserUpdate(UserBase):
    email: EmailStr | None = Field(default=None, max_length=255)  # type: ignore
    password: str | None = Field(default=None, min_length=8, max_length=128)


class UserUpdateMe(SQLModel):
    full_name: str | None = Field(default=None, max_length=255)
    email: EmailStr | None = Field(default=None, max_length=255)


class UpdatePassword(SQLModel):
    current_password: str = Field(min_length=8, max_length=128)
    new_password: str = Field(min_length=8, max_length=128)


# Database model, database table inferred from class name
class User(UserBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    hashed_password: str
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )


# Properties to return via API, id is always required
class UserPublic(UserBase):
    id: uuid.UUID
    created_at: datetime | None = None


class UsersPublic(SQLModel):
    data: list[UserPublic]
    count: int


# Generic message
class Message(SQLModel):
    message: str


# JSON payload containing access token
class Token(SQLModel):
    access_token: str
    token_type: str = "bearer"


# Contents of JWT token
class TokenPayload(SQLModel):
    sub: str | None = None


class NewPassword(SQLModel):
    token: str
    new_password: str = Field(min_length=8, max_length=128)


class SchoolBase(SQLModel):
    __tablename__ = "schools"
    name: str = Field(max_length=255)
    address: str | None = Field(default=None, max_length=500)


class SchoolCreate(SchoolBase):
    pass


class SchoolUpdate(SQLModel):
    name: str | None = Field(default=None, max_length=255)
    address: str | None = Field(default=None, max_length=500)


class School(SchoolBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )


class SchoolPublic(SchoolBase):
    id: uuid.UUID
    created_at: datetime | None = None


class SchoolsPublic(SQLModel):
    data: list[SchoolPublic]
    count: int


class TripBase(SQLModel):
    __tablename__ = "trips"
    title: str = Field(max_length=255)
    description: str | None = Field(default=None, max_length=1000)
    location: str = Field(max_length=500)
    date: datetime
    cost: Decimal = Field(max_digits=10, decimal_places=2)
    max_students: int = Field(default=30, ge=1)


class TripCreate(TripBase):
    school_id: uuid.UUID


class TripUpdate(SQLModel):
    title: str | None = Field(default=None, max_length=255)
    description: str | None = Field(default=None, max_length=1000)
    location: str | None = Field(default=None, max_length=500)
    date: datetime | None = None
    cost: Decimal | None = Field(default=None, max_digits=10, decimal_places=2)
    max_students: int | None = Field(default=None, ge=1)


class Trip(TripBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    school_id: uuid.UUID = Field(
        foreign_key="schools.id", index=True, ondelete="CASCADE"
    )
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )

    school: School | None = Relationship()


class TripPublic(TripBase):
    id: uuid.UUID
    school_id: uuid.UUID
    registration_count: int | None = None
    created_at: datetime | None = None


class TripsPublic(SQLModel):
    data: list[TripPublic]
    count: int


class RegistrationStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"


class RegistrationBase(SQLModel):
    __tablename__ = "registrations"
    trip_id: uuid.UUID = Field(foreign_key="trips.id", index=True, ondelete="CASCADE")
    student_name: str = Field(max_length=255)
    parent_name: str = Field(max_length=255)
    parent_email: EmailStr = Field(max_length=255)


class RegistrationCreate(RegistrationBase):
    pass


class RegistrationUpdate(SQLModel):
    student_name: str | None = Field(default=None, max_length=255)
    parent_name: str | None = Field(default=None, max_length=255)
    parent_email: EmailStr | None = Field(default=None, max_length=255)
    status: RegistrationStatus | None = None


class Registration(RegistrationBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    status: RegistrationStatus = Field(default=RegistrationStatus.PENDING)
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )

    trip: Trip | None = Relationship()


class RegistrationPublic(RegistrationBase):
    id: uuid.UUID
    status: RegistrationStatus
    created_at: datetime | None = None
    trip: TripPublic | None = None


class RegistrationsPublic(SQLModel):
    data: list[RegistrationPublic]
    count: int


class PaymentStatus(str, Enum):
    PENDING = "pending"
    SUCCESS = "success"
    FAILED = "failed"


class PaymentBase(SQLModel):
    __tablename__ = "payments"
    registration_id: uuid.UUID = Field(
        foreign_key="registrations.id", index=True, ondelete="CASCADE"
    )
    amount: Decimal = Field(max_digits=10, decimal_places=2)


class PaymentCreate(PaymentBase):
    pass


class PaymentProcess(SQLModel):
    registration_id: uuid.UUID
    card_number: str = PydanticField(min_length=16, max_length=16)
    expiry_date: str = PydanticField(pattern=EXPIRY_DATE_REGEX)
    cvv: str = PydanticField(min_length=3, max_length=3)

    @field_validator("card_number")
    @classmethod
    def validate_card_number(cls, v: str) -> str:
        if not re.match(CARD_NUMBER_REGEX, v):
            raise ValueError(
                "Invalid credit card number. Only 16-digit Visa and Mastercard are supported."
            )
        return v

    @field_validator("expiry_date")
    @classmethod
    def validate_expiry_date(cls, v: str) -> str:
        if not re.match(EXPIRY_DATE_REGEX, v):
            raise ValueError("Invalid expiry date format. Use MM/YY.")

        month_str, year_str = v.split("/")
        month = int(month_str)
        # Assuming 20xx
        year = 2000 + int(year_str)

        now = datetime.now(timezone.utc)
        current_year = now.year
        current_month = now.month

        if year < current_year or (year == current_year and month < current_month):
            raise ValueError("Card has expired.")

        return v


class LegacyPaymentData(BaseModel):
    student_name: str = PydanticField(max_length=255)
    parent_name: str = PydanticField(max_length=255)
    amount: float
    card_number: str = PydanticField(min_length=16, max_length=16)
    expiry_date: str = PydanticField(pattern=EXPIRY_DATE_REGEX)
    cvv: str = PydanticField(min_length=3, max_length=3)
    school_id: str
    activity_id: str

    @field_validator("card_number")
    @classmethod
    def validate_card_number(cls, v: str) -> str:
        if not re.match(CARD_NUMBER_REGEX, v):
            raise ValueError(
                "Invalid credit card number. Only 16-digit Visa and Mastercard are supported."
            )
        return v


class Payment(PaymentBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    status: PaymentStatus = Field(default=PaymentStatus.PENDING)
    transaction_id: str | None = Field(default=None, max_length=255)
    error_message: str | None = Field(default=None, max_length=1000)
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )

    registration: Registration | None = Relationship()


class PaymentPublic(PaymentBase):
    id: uuid.UUID
    status: PaymentStatus
    transaction_id: str | None = None
    error_message: str | None = None
    created_at: datetime | None = None
