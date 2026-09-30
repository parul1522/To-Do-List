from typing import Literal

from pydantic import BaseModel, EmailStr, Field

from app.schemas.user import Name, Password, UserRead


class RegisterRequest(BaseModel):
    name: Name
    email: EmailStr
    password: Password


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class RefreshRequest(BaseModel):
    refresh_token: str = Field(min_length=1, max_length=4096)


class LogoutRequest(RefreshRequest):
    pass


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: Literal["bearer"] = "bearer"  # noqa: S105
    # Seconds until the access token expires, so clients can refresh early.
    expires_in: int


class AuthResponse(BaseModel):
    user: UserRead
    tokens: TokenPair
