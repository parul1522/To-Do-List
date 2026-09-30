"""Profile and account management for the signed-in user."""

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AppError
from app.core.security import hash_password, verify_password
from app.models.user import User
from app.repositories.refresh_token_repository import RefreshTokenRepository
from app.repositories.user_repository import UserRepository
from app.schemas.auth import TokenPair
from app.schemas.user import AccountDelete, PasswordChange, UserUpdate
from app.services.auth_service import AuthService


class UserService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.users = UserRepository(session)
        self.tokens = RefreshTokenRepository(session)

    async def update_profile(self, user: User, data: UserUpdate) -> User:
        fields = data.model_fields_set
        if "name" in fields:
            if data.name is None:
                raise AppError("Name cannot be empty", code="validation_error")
            user.name = data.name
        if "avatar_url" in fields:
            user.avatar_url = str(data.avatar_url) if data.avatar_url else None
        await self.session.commit()
        await self.session.refresh(user)
        return user

    async def change_password(self, user: User, data: PasswordChange, user_agent: str | None) -> TokenPair:
        """Change the password, sign out every other device and return a new session."""
        # Wrong-password errors are 400, not 401: clients treat 401 as an expired
        # session and would otherwise sign the user out.
        if not verify_password(data.current_password, user.password_hash):
            raise AppError("Current password is incorrect", code="invalid_password")
        if data.current_password == data.new_password:
            raise AppError("New password must differ from the current one", code="password_unchanged")

        user.password_hash = hash_password(data.new_password)
        await self.tokens.revoke_all_for_user(user.id)
        pair = await AuthService(self.session).issue_session(user.id, user_agent)
        await self.session.commit()
        return pair

    async def delete_account(self, user: User, data: AccountDelete) -> None:
        if not verify_password(data.password, user.password_hash):
            raise AppError("Password is incorrect", code="invalid_password")
        # Foreign keys cascade to every user-owned row.
        await self.users.delete(user)
        await self.session.commit()
