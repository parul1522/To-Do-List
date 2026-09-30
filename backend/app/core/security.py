"""Password hashing and JWT helpers.

Passwords are hashed with Argon2id (memory-hard, OWASP recommended).
Access and refresh tokens are signed JWTs distinguished by a ``type`` claim so
one can never be used in place of the other.
"""

import uuid
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from typing import Any, Literal

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError, VerifyMismatchError

from app.core.config import settings

TokenType = Literal["access", "refresh"]

_hasher = PasswordHasher()
# Used to equalise response time when a login targets an unknown email, so
# attackers cannot enumerate accounts by timing.
_DUMMY_HASH = _hasher.hash("timing-equaliser-not-a-real-password")


class TokenError(Exception):
    """Raised when a JWT is missing, malformed, expired or of the wrong type."""


@dataclass(frozen=True, slots=True)
class TokenPayload:
    subject: uuid.UUID
    token_type: TokenType
    jti: uuid.UUID
    expires_at: datetime
    family_id: uuid.UUID | None = None


def hash_password(password: str) -> str:
    return _hasher.hash(password)


def verify_password(password: str, password_hash: str | None) -> bool:
    if password_hash is None:
        _safe_verify(_DUMMY_HASH, password)
        return False
    return _safe_verify(password_hash, password)


def _safe_verify(password_hash: str, password: str) -> bool:
    try:
        return _hasher.verify(password_hash, password)
    except (VerifyMismatchError, VerificationError, InvalidHashError):
        return False


def password_needs_rehash(password_hash: str) -> bool:
    return _hasher.check_needs_rehash(password_hash)


def _encode(claims: dict[str, Any]) -> str:
    return jwt.encode(claims, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def create_access_token(user_id: uuid.UUID) -> tuple[str, datetime]:
    now = datetime.now(UTC)
    expires_at = now + timedelta(minutes=settings.access_token_expire_minutes)
    token = _encode(
        {
            "sub": str(user_id),
            "type": "access",
            "jti": str(uuid.uuid4()),
            "iat": now,
            "exp": expires_at,
            "iss": settings.jwt_issuer,
        }
    )
    return token, expires_at


def create_refresh_token(user_id: uuid.UUID, jti: uuid.UUID, family_id: uuid.UUID) -> tuple[str, datetime]:
    now = datetime.now(UTC)
    expires_at = now + timedelta(days=settings.refresh_token_expire_days)
    token = _encode(
        {
            "sub": str(user_id),
            "type": "refresh",
            "jti": str(jti),
            "fam": str(family_id),
            "iat": now,
            "exp": expires_at,
            "iss": settings.jwt_issuer,
        }
    )
    return token, expires_at


def decode_token(token: str, expected_type: TokenType) -> TokenPayload:
    try:
        claims = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm],
            issuer=settings.jwt_issuer,
            options={"require": ["sub", "type", "jti", "exp", "iat", "iss"]},
        )
    except jwt.ExpiredSignatureError as exc:
        raise TokenError("Token has expired") from exc
    except jwt.PyJWTError as exc:
        raise TokenError("Invalid token") from exc

    if claims.get("type") != expected_type:
        raise TokenError("Invalid token type")

    try:
        subject = uuid.UUID(claims["sub"])
        jti = uuid.UUID(claims["jti"])
        family_id = uuid.UUID(claims["fam"]) if expected_type == "refresh" else None
    except (KeyError, ValueError) as exc:
        raise TokenError("Invalid token claims") from exc

    return TokenPayload(
        subject=subject,
        token_type=expected_type,
        jti=jti,
        expires_at=datetime.fromtimestamp(claims["exp"], tz=UTC),
        family_id=family_id,
    )
