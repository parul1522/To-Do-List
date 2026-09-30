import uuid
from datetime import datetime
from typing import Annotated

from pydantic import AfterValidator, BaseModel, EmailStr, Field, HttpUrl, StringConstraints

from app.schemas.common import APIModel
from app.utils.validation import validate_password_strength

Name = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=120)]
Password = Annotated[str, Field(min_length=8, max_length=128), AfterValidator(validate_password_strength)]


class UserRead(APIModel):
    id: uuid.UUID
    name: str
    email: EmailStr
    avatar_url: str | None
    created_at: datetime
    updated_at: datetime


class UserUpdate(BaseModel):
    name: Name | None = None
    # ``None`` clears the avatar; omitting the field leaves it untouched.
    avatar_url: HttpUrl | None = None


class PasswordChange(BaseModel):
    current_password: str = Field(min_length=1, max_length=128)
    new_password: Password


class AccountDelete(BaseModel):
    password: str = Field(min_length=1, max_length=128)
