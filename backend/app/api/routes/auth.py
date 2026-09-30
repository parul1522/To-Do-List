from fastapi import APIRouter, Depends, status

from app.api.deps import CurrentUser, DBSession, UserAgent
from app.core.config import settings
from app.core.rate_limit import RateLimit
from app.schemas.auth import (
    AuthResponse,
    LoginRequest,
    LogoutRequest,
    RefreshRequest,
    RegisterRequest,
    TokenPair,
)
from app.schemas.common import ErrorResponse
from app.schemas.user import UserRead
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])

_auth_limit = RateLimit("auth", limit=settings.rate_limit_auth_per_minute, window_seconds=60)
_refresh_limit = RateLimit("refresh", limit=settings.rate_limit_auth_per_minute * 3, window_seconds=60)

_errors = {401: {"model": ErrorResponse}, 429: {"model": ErrorResponse}}


@router.post(
    "/register",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(_auth_limit)],
    responses={409: {"model": ErrorResponse}, 429: {"model": ErrorResponse}},
)
async def register(data: RegisterRequest, session: DBSession, ua: UserAgent) -> AuthResponse:
    user, tokens = await AuthService(session).register(data, ua)
    return AuthResponse(user=UserRead.model_validate(user), tokens=tokens)


@router.post("/login", response_model=AuthResponse, dependencies=[Depends(_auth_limit)], responses=_errors)
async def login(data: LoginRequest, session: DBSession, ua: UserAgent) -> AuthResponse:
    user, tokens = await AuthService(session).login(data, ua)
    return AuthResponse(user=UserRead.model_validate(user), tokens=tokens)


@router.post("/refresh", response_model=TokenPair, dependencies=[Depends(_refresh_limit)], responses=_errors)
async def refresh(data: RefreshRequest, session: DBSession, ua: UserAgent) -> TokenPair:
    return await AuthService(session).refresh(data.refresh_token, ua)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(data: LogoutRequest, session: DBSession) -> None:
    """Revoke this device's session. Always succeeds so clients can sign out offline-first."""
    await AuthService(session).logout(data.refresh_token)


@router.post("/logout-all", status_code=status.HTTP_204_NO_CONTENT, responses=_errors)
async def logout_all(user: CurrentUser, session: DBSession) -> None:
    await AuthService(session).logout_everywhere(user.id)
