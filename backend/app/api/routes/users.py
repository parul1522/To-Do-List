from fastapi import APIRouter, status

from app.api.deps import CurrentUser, DBSession, UserAgent
from app.schemas.auth import TokenPair
from app.schemas.common import ErrorResponse
from app.schemas.user import AccountDelete, PasswordChange, UserRead, UserUpdate
from app.services.user_service import UserService

router = APIRouter(prefix="/users", tags=["users"], responses={401: {"model": ErrorResponse}})


@router.get("/me", response_model=UserRead)
async def read_me(user: CurrentUser) -> UserRead:
    return UserRead.model_validate(user)


@router.patch("/me", response_model=UserRead)
async def update_me(data: UserUpdate, user: CurrentUser, session: DBSession) -> UserRead:
    updated = await UserService(session).update_profile(user, data)
    return UserRead.model_validate(updated)


@router.post("/me/password", response_model=TokenPair)
async def change_password(
    data: PasswordChange, user: CurrentUser, session: DBSession, ua: UserAgent
) -> TokenPair:
    """Change password. All other sessions are revoked; a fresh token pair is returned."""
    return await UserService(session).change_password(user, data, ua)


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
async def delete_me(data: AccountDelete, user: CurrentUser, session: DBSession) -> None:
    await UserService(session).delete_account(user, data)
