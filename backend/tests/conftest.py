"""Test fixtures.

Tests run against a real PostgreSQL database (``TEST_DATABASE_URL``) so they
exercise the same SQL, constraints and migrations as production. The schema is
built by running the Alembic migrations once per session; every test starts
from empty tables.
"""

import os
import subprocess
import sys
from collections.abc import AsyncIterator
from pathlib import Path

os.environ["ENVIRONMENT"] = "test"
os.environ["DATABASE_URL"] = os.environ.get(
    "TEST_DATABASE_URL",
    "postgresql+asyncpg://secondbrain:secondbrain@localhost:5432/secondbrain_test",
)
os.environ["DB_USE_NULL_POOL"] = "true"
os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key-that-is-at-least-32-characters-long")
os.environ["RATE_LIMIT_ENABLED"] = "false"

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text

from app.core.rate_limit import reset_rate_limits
from app.db.base import Base
from app.db.session import engine
from app.main import app

BACKEND_DIR = Path(__file__).resolve().parent.parent
API = "/api/v1"


@pytest.fixture(scope="session", autouse=True)
def migrated_database() -> None:
    env = {**os.environ}
    for args in (["downgrade", "base"], ["upgrade", "head"]):
        subprocess.run(
            [sys.executable, "-m", "alembic", *args],
            cwd=BACKEND_DIR,
            env=env,
            check=True,
            capture_output=True,
        )


@pytest.fixture(autouse=True)
async def clean_tables() -> AsyncIterator[None]:
    reset_rate_limits()
    yield
    tables = ", ".join(f'"{t.name}"' for t in Base.metadata.sorted_tables)
    async with engine.begin() as conn:
        await conn.execute(text(f"TRUNCATE {tables} RESTART IDENTITY CASCADE"))


@pytest.fixture
async def client() -> AsyncIterator[AsyncClient]:
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c


async def register(
    client: AsyncClient,
    email: str = "ada@example.com",
    password: str = "correct-horse-9",
    name: str = "Ada Lovelace",
) -> dict:
    response = await client.post(
        f"{API}/auth/register", json={"name": name, "email": email, "password": password}
    )
    assert response.status_code == 201, response.text
    return response.json()


def bearer(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}
