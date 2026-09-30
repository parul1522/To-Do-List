import uuid
from datetime import UTC, datetime

from sqlalchemy import delete, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.refresh_token import RefreshToken


class RefreshTokenRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def add(self, token: RefreshToken) -> RefreshToken:
        self.session.add(token)
        await self.session.flush()
        return token

    async def get_for_update(self, token_id: uuid.UUID) -> RefreshToken | None:
        # Row lock prevents two concurrent refreshes from both rotating the
        # same token.
        result = await self.session.execute(
            select(RefreshToken).where(RefreshToken.id == token_id).with_for_update()
        )
        return result.scalar_one_or_none()

    async def revoke_family(self, family_id: uuid.UUID) -> None:
        await self.session.execute(
            update(RefreshToken)
            .where(RefreshToken.family_id == family_id, RefreshToken.revoked_at.is_(None))
            .values(revoked_at=datetime.now(UTC))
        )

    async def revoke_all_for_user(self, user_id: uuid.UUID) -> None:
        await self.session.execute(
            update(RefreshToken)
            .where(RefreshToken.user_id == user_id, RefreshToken.revoked_at.is_(None))
            .values(revoked_at=datetime.now(UTC))
        )

    async def purge_stale(self, older_than: datetime) -> int:
        """Delete tokens that expired or were revoked before ``older_than``."""
        result = await self.session.execute(
            delete(RefreshToken).where(
                or_(RefreshToken.expires_at < older_than, RefreshToken.revoked_at < older_than)
            )
        )
        return result.rowcount or 0
