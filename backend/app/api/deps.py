"""Shared FastAPI dependencies."""

from typing import Annotated

from fastapi import Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AuthenticationError
from app.core.security import TokenError, decode_token
from app.db.session import get_session
from app.models.user import User
from app.repositories.user_repository import UserRepository

DBSession = Annotated[AsyncSession, Depends(get_session)]

_bearer = HTTPBearer(auto_error=False, description="Access token from /auth/login")


async def get_current_user(
    session: DBSession,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)],
) -> User:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise AuthenticationError("Not authenticated")
    try:
        payload = decode_token(credentials.credentials, "access")
    except TokenError as exc:
        raise AuthenticationError(str(exc), code="invalid_token") from exc

    user = await UserRepository(session).get_by_id(payload.subject)
    if user is None or not user.is_active:
        raise AuthenticationError("User no longer exists", code="invalid_token")
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def user_agent(request: Request) -> str | None:
    return request.headers.get("user-agent")


UserAgent = Annotated[str | None, Depends(user_agent)]
