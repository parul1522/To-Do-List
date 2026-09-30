import uuid
from datetime import UTC, datetime, timedelta

from httpx import AsyncClient
from sqlalchemy import func, select

from app.cli import purge_tokens
from app.db.session import SessionLocal
from app.models.refresh_token import RefreshToken
from tests.conftest import API, register


async def _count() -> int:
    async with SessionLocal() as session:
        return (await session.execute(select(func.count()).select_from(RefreshToken))).scalar_one()


async def test_purge_tokens_keeps_live_and_recent_tokens(client: AsyncClient) -> None:
    body = await register(client)
    user_id = uuid.UUID(body["user"]["id"])
    long_ago = datetime.now(UTC) - timedelta(days=30)
    async with SessionLocal() as session:
        session.add_all(
            [
                RefreshToken(id=uuid.uuid4(), user_id=user_id, family_id=uuid.uuid4(), expires_at=long_ago),
                RefreshToken(
                    id=uuid.uuid4(),
                    user_id=user_id,
                    family_id=uuid.uuid4(),
                    expires_at=datetime.now(UTC) + timedelta(days=1),
                    revoked_at=long_ago,
                ),
            ]
        )
        await session.commit()
    assert await _count() == 3

    assert await purge_tokens(grace_days=7) == 2
    assert await _count() == 1
    # The live session from registration still works.
    refreshed = await client.post(
        f"{API}/auth/refresh", json={"refresh_token": body["tokens"]["refresh_token"]}
    )
    assert refreshed.status_code == 200
