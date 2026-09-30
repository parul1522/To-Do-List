import pytest
from httpx import AsyncClient

from app.core import rate_limit
from tests.conftest import API, bearer, register


async def login_tokens(client: AsyncClient) -> dict:
    credentials = {"email": "ada@example.com", "password": "correct-horse-9"}
    return (await client.post(f"{API}/auth/login", json=credentials)).json()["tokens"]


async def test_register_returns_user_and_tokens(client: AsyncClient) -> None:
    body = await register(client)
    assert body["user"]["email"] == "ada@example.com"
    assert body["user"]["name"] == "Ada Lovelace"
    assert "password_hash" not in body["user"]
    assert body["tokens"]["token_type"] == "bearer"
    assert body["tokens"]["expires_in"] > 0


async def test_register_normalizes_email_and_rejects_duplicates(client: AsyncClient) -> None:
    await register(client, email="Ada@Example.com")
    response = await client.post(
        f"{API}/auth/register",
        json={"name": "Imposter", "email": "ADA@example.com", "password": "another-pass-1"},
    )
    assert response.status_code == 409
    assert response.json()["error"]["code"] == "email_taken"


@pytest.mark.parametrize(
    "payload",
    [
        {"name": "A", "email": "not-an-email", "password": "valid-pass-1"},
        {"name": "A", "email": "a@example.com", "password": "short1"},
        {"name": "A", "email": "a@example.com", "password": "no-digits-here"},
        {"name": "   ", "email": "a@example.com", "password": "valid-pass-1"},
        {"email": "a@example.com", "password": "valid-pass-1"},
    ],
)
async def test_register_validation(client: AsyncClient, payload: dict) -> None:
    response = await client.post(f"{API}/auth/register", json=payload)
    assert response.status_code == 422
    error = response.json()["error"]
    assert error["code"] == "validation_error"
    assert error["details"]


async def test_login_success_is_case_insensitive(client: AsyncClient) -> None:
    await register(client)
    response = await client.post(
        f"{API}/auth/login", json={"email": "ADA@example.com", "password": "correct-horse-9"}
    )
    assert response.status_code == 200
    assert response.json()["user"]["email"] == "ada@example.com"


async def test_login_wrong_password_and_unknown_email_look_identical(client: AsyncClient) -> None:
    await register(client)
    wrong = await client.post(f"{API}/auth/login", json={"email": "ada@example.com", "password": "nope-123"})
    unknown = await client.post(
        f"{API}/auth/login", json={"email": "ghost@example.com", "password": "nope-123"}
    )
    assert wrong.status_code == unknown.status_code == 401
    assert wrong.json() == unknown.json()


async def test_refresh_rotates_tokens(client: AsyncClient) -> None:
    tokens = (await register(client))["tokens"]
    response = await client.post(f"{API}/auth/refresh", json={"refresh_token": tokens["refresh_token"]})
    assert response.status_code == 200
    new_tokens = response.json()
    assert new_tokens["refresh_token"] != tokens["refresh_token"]
    me = await client.get(f"{API}/users/me", headers=bearer(new_tokens["access_token"]))
    assert me.status_code == 200


async def test_refresh_token_reuse_revokes_whole_family(client: AsyncClient) -> None:
    original = (await register(client))["tokens"]["refresh_token"]
    rotated = (await client.post(f"{API}/auth/refresh", json={"refresh_token": original})).json()

    replay = await client.post(f"{API}/auth/refresh", json={"refresh_token": original})
    assert replay.status_code == 401
    assert replay.json()["error"]["code"] == "refresh_token_reused"

    # The legitimate successor is revoked too, forcing re-authentication.
    follow_up = await client.post(f"{API}/auth/refresh", json={"refresh_token": rotated["refresh_token"]})
    assert follow_up.status_code == 401


async def test_refresh_rejects_access_token(client: AsyncClient) -> None:
    tokens = (await register(client))["tokens"]
    response = await client.post(f"{API}/auth/refresh", json={"refresh_token": tokens["access_token"]})
    assert response.status_code == 401


async def test_logout_revokes_refresh_token(client: AsyncClient) -> None:
    tokens = (await register(client))["tokens"]
    response = await client.post(f"{API}/auth/logout", json={"refresh_token": tokens["refresh_token"]})
    assert response.status_code == 204
    again = await client.post(f"{API}/auth/refresh", json={"refresh_token": tokens["refresh_token"]})
    assert again.status_code == 401


async def test_logout_with_garbage_token_is_noop(client: AsyncClient) -> None:
    response = await client.post(f"{API}/auth/logout", json={"refresh_token": "garbage"})
    assert response.status_code == 204


async def test_logout_one_device_keeps_other_sessions(client: AsyncClient) -> None:
    phone = (await register(client))["tokens"]
    laptop = await login_tokens(client)
    await client.post(f"{API}/auth/logout", json={"refresh_token": phone["refresh_token"]})
    still_ok = await client.post(f"{API}/auth/refresh", json={"refresh_token": laptop["refresh_token"]})
    assert still_ok.status_code == 200


async def test_logout_all_revokes_every_session(client: AsyncClient) -> None:
    phone = (await register(client))["tokens"]
    laptop = await login_tokens(client)
    response = await client.post(f"{API}/auth/logout-all", headers=bearer(phone["access_token"]))
    assert response.status_code == 204
    for tokens in (phone, laptop):
        r = await client.post(f"{API}/auth/refresh", json={"refresh_token": tokens["refresh_token"]})
        assert r.status_code == 401


async def test_auth_rate_limit(client: AsyncClient, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(rate_limit.settings, "rate_limit_enabled", True)
    limit = rate_limit.settings.rate_limit_auth_per_minute
    statuses = []
    for _ in range(limit + 1):
        r = await client.post(f"{API}/auth/login", json={"email": "x@example.com", "password": "whatever1"})
        statuses.append(r.status_code)
    assert statuses[:limit] == [401] * limit
    assert statuses[-1] == 429
    assert "retry-after" in {k.lower() for k in r.headers}
