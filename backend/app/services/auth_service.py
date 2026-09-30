"""Registration, login and token lifecycle."""

import uuid
from datetime import UTC, datetime

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import AuthenticationError, ConflictError
from app.core.security import (
    TokenError,
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    password_needs_rehash,
    verify_password,
)
from app.models.refresh_token import RefreshToken
from app.models.user import User
from app.repositories.refresh_token_repository import RefreshTokenRepository
from app.repositories.user_repository import UserRepository
from app.schemas.auth import LoginRequest, RegisterRequest, TokenPair
from app.utils.validation import normalize_email

INVALID_CREDENTIALS = "Incorrect email or password"
INVALID_REFRESH = "Session expired. Please sign in again."


class AuthService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.users = UserRepository(session)
        self.tokens = RefreshTokenRepository(session)

    async def register(self, data: RegisterRequest, user_agent: str | None = None) -> tuple[User, TokenPair]:
        email = normalize_email(data.email)
        if await self.users.get_by_email(email):
            raise ConflictError("An account with this email already exists", code="email_taken")

        user = User(name=data.name, email=email, password_hash=hash_password(data.password))
        try:
            await self.users.add(user)
        except IntegrityError as exc:  # concurrent registration with the same email
            await self.session.rollback()
            raise ConflictError("An account with this email already exists", code="email_taken") from exc

        pair = await self._issue_pair(user.id, family_id=uuid.uuid4(), user_agent=user_agent)
        await self.session.commit()
        await self.session.refresh(user)
        return user, pair

    async def login(self, data: LoginRequest, user_agent: str | None = None) -> tuple[User, TokenPair]:
        user = await self.users.get_by_email(normalize_email(data.email))
        if not verify_password(data.password, user.password_hash if user else None) or user is None:
            raise AuthenticationError(INVALID_CREDENTIALS, code="invalid_credentials")
        if not user.is_active:
            raise AuthenticationError("This account has been disabled", code="account_disabled")

        if password_needs_rehash(user.password_hash):
            user.password_hash = hash_password(data.password)

        pair = await self._issue_pair(user.id, family_id=uuid.uuid4(), user_agent=user_agent)
        await self.session.commit()
        return user, pair

    async def refresh(self, refresh_token: str, user_agent: str | None = None) -> TokenPair:
        try:
            payload = decode_token(refresh_token, "refresh")
        except TokenError as exc:
            raise AuthenticationError(INVALID_REFRESH, code="invalid_refresh_token") from exc

        record = await self.tokens.get_for_update(payload.jti)
        if record is None or record.user_id != payload.subject:
            raise AuthenticationError(INVALID_REFRESH, code="invalid_refresh_token")

        if record.is_revoked:
            # A rotated token was replayed: assume theft and kill the session family.
            await self.tokens.revoke_family(record.family_id)
            await self.session.commit()
            raise AuthenticationError(INVALID_REFRESH, code="refresh_token_reused")

        user = await self.users.get_by_id(record.user_id)
        if user is None or not user.is_active:
            raise AuthenticationError(INVALID_REFRESH, code="invalid_refresh_token")

        pair, new_id = await self._issue_pair_with_id(user.id, record.family_id, user_agent)
        record.revoked_at = datetime.now(UTC)
        record.replaced_by_id = new_id
        await self.session.commit()
        return pair

    async def logout(self, refresh_token: str) -> None:
        """Revoke the session family of the given refresh token. Idempotent."""
        try:
            payload = decode_token(refresh_token, "refresh")
        except TokenError:
            return
        if payload.family_id is not None:
            await self.tokens.revoke_family(payload.family_id)
            await self.session.commit()

    async def logout_everywhere(self, user_id: uuid.UUID) -> None:
        await self.tokens.revoke_all_for_user(user_id)
        await self.session.commit()

    async def issue_session(self, user_id: uuid.UUID, user_agent: str | None = None) -> TokenPair:
        """Start a fresh session family (used after a password change). Caller commits."""
        return await self._issue_pair(user_id, family_id=uuid.uuid4(), user_agent=user_agent)

    async def _issue_pair(
        self, user_id: uuid.UUID, family_id: uuid.UUID, user_agent: str | None
    ) -> TokenPair:
        pair, _ = await self._issue_pair_with_id(user_id, family_id, user_agent)
        return pair

    async def _issue_pair_with_id(
        self, user_id: uuid.UUID, family_id: uuid.UUID, user_agent: str | None
    ) -> tuple[TokenPair, uuid.UUID]:
        jti = uuid.uuid4()
        access_token, _ = create_access_token(user_id)
        refresh_token, refresh_expires_at = create_refresh_token(user_id, jti, family_id)
        await self.tokens.add(
            RefreshToken(
                id=jti,
                user_id=user_id,
                family_id=family_id,
                expires_at=refresh_expires_at,
                user_agent=(user_agent or "")[:255] or None,
            )
        )
        pair = TokenPair(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=settings.access_token_expire_minutes * 60,
        )
        return pair, jti
