import uuid
from datetime import UTC, datetime, timedelta

import jwt
import pytest

from app.core.config import settings
from app.core.security import (
    TokenError,
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.utils.validation import validate_password_strength


def test_password_hash_roundtrip() -> None:
    hashed = hash_password("s3cret-pass")
    assert hashed.startswith("$argon2id$")
    assert verify_password("s3cret-pass", hashed)
    assert not verify_password("wrong-pass1", hashed)


def test_verify_password_handles_missing_and_garbage_hash() -> None:
    assert not verify_password("anything1", None)
    assert not verify_password("anything1", "not-a-hash")


def test_access_token_roundtrip() -> None:
    user_id = uuid.uuid4()
    token, _ = create_access_token(user_id)
    payload = decode_token(token, "access")
    assert payload.subject == user_id
    assert payload.token_type == "access"


def test_refresh_token_cannot_be_used_as_access_token() -> None:
    token, _ = create_refresh_token(uuid.uuid4(), uuid.uuid4(), uuid.uuid4())
    with pytest.raises(TokenError):
        decode_token(token, "access")


def test_access_token_cannot_be_used_as_refresh_token() -> None:
    token, _ = create_access_token(uuid.uuid4())
    with pytest.raises(TokenError):
        decode_token(token, "refresh")


def test_expired_token_rejected() -> None:
    now = datetime.now(UTC)
    token = jwt.encode(
        {
            "sub": str(uuid.uuid4()),
            "type": "access",
            "jti": str(uuid.uuid4()),
            "iat": now - timedelta(hours=2),
            "exp": now - timedelta(hours=1),
            "iss": settings.jwt_issuer,
        },
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm,
    )
    with pytest.raises(TokenError, match="expired"):
        decode_token(token, "access")


def test_token_signed_with_other_key_rejected() -> None:
    now = datetime.now(UTC)
    token = jwt.encode(
        {
            "sub": str(uuid.uuid4()),
            "type": "access",
            "jti": str(uuid.uuid4()),
            "iat": now,
            "exp": now + timedelta(minutes=5),
            "iss": settings.jwt_issuer,
        },
        "another-secret-key-that-is-long-enough-to-sign",
        algorithm="HS256",
    )
    with pytest.raises(TokenError):
        decode_token(token, "access")


def test_unsigned_token_rejected() -> None:
    token = jwt.encode({"sub": str(uuid.uuid4()), "type": "access"}, key=None, algorithm="none")
    with pytest.raises(TokenError):
        decode_token(token, "access")


@pytest.mark.parametrize("password", ["onlyletters", "12345678", " padded1a"])
def test_weak_passwords_rejected(password: str) -> None:
    with pytest.raises(ValueError):
        validate_password_strength(password)
