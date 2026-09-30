from httpx import AsyncClient

from tests.conftest import API, bearer, register


async def test_me_requires_authentication(client: AsyncClient) -> None:
    response = await client.get(f"{API}/users/me")
    assert response.status_code == 401
    assert response.headers["www-authenticate"] == "Bearer"
    assert response.json()["error"]["code"] == "unauthorized"


async def test_me_rejects_malformed_token(client: AsyncClient) -> None:
    response = await client.get(f"{API}/users/me", headers=bearer("not.a.jwt"))
    assert response.status_code == 401


async def test_me_rejects_refresh_token(client: AsyncClient) -> None:
    tokens = (await register(client))["tokens"]
    response = await client.get(f"{API}/users/me", headers=bearer(tokens["refresh_token"]))
    assert response.status_code == 401


async def test_me_returns_only_own_profile(client: AsyncClient) -> None:
    ada = await register(client)
    grace = await register(client, email="grace@example.com", name="Grace Hopper")
    me = await client.get(f"{API}/users/me", headers=bearer(grace["tokens"]["access_token"]))
    assert me.json()["id"] == grace["user"]["id"]
    assert me.json()["id"] != ada["user"]["id"]


async def test_update_profile(client: AsyncClient) -> None:
    access = (await register(client))["tokens"]["access_token"]
    response = await client.patch(
        f"{API}/users/me",
        headers=bearer(access),
        json={"name": "  Countess Ada  ", "avatar_url": "https://cdn.example.com/a.png"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["name"] == "Countess Ada"
    assert body["avatar_url"] == "https://cdn.example.com/a.png"

    cleared = await client.patch(f"{API}/users/me", headers=bearer(access), json={"avatar_url": None})
    assert cleared.json()["avatar_url"] is None
    assert cleared.json()["name"] == "Countess Ada"


async def test_update_profile_rejects_bad_avatar_url(client: AsyncClient) -> None:
    access = (await register(client))["tokens"]["access_token"]
    response = await client.patch(
        f"{API}/users/me", headers=bearer(access), json={"avatar_url": "javascript:alert(1)"}
    )
    assert response.status_code == 422


async def test_change_password_revokes_other_sessions(client: AsyncClient) -> None:
    first = (await register(client))["tokens"]
    response = await client.post(
        f"{API}/users/me/password",
        headers=bearer(first["access_token"]),
        json={"current_password": "correct-horse-9", "new_password": "brand-new-pass-7"},
    )
    assert response.status_code == 200
    new_tokens = response.json()

    stale = await client.post(f"{API}/auth/refresh", json={"refresh_token": first["refresh_token"]})
    assert stale.status_code == 401
    fresh = await client.post(f"{API}/auth/refresh", json={"refresh_token": new_tokens["refresh_token"]})
    assert fresh.status_code == 200

    old_login = await client.post(
        f"{API}/auth/login", json={"email": "ada@example.com", "password": "correct-horse-9"}
    )
    assert old_login.status_code == 401
    new_login = await client.post(
        f"{API}/auth/login", json={"email": "ada@example.com", "password": "brand-new-pass-7"}
    )
    assert new_login.status_code == 200


async def test_change_password_wrong_current_is_400_not_401(client: AsyncClient) -> None:
    access = (await register(client))["tokens"]["access_token"]
    response = await client.post(
        f"{API}/users/me/password",
        headers=bearer(access),
        json={"current_password": "wrong-pass-1", "new_password": "brand-new-pass-7"},
    )
    assert response.status_code == 400
    assert response.json()["error"]["code"] == "invalid_password"


async def test_delete_account(client: AsyncClient) -> None:
    tokens = (await register(client))["tokens"]
    wrong = await client.request(
        "DELETE", f"{API}/users/me", headers=bearer(tokens["access_token"]), json={"password": "nope-1234"}
    )
    assert wrong.status_code == 400

    response = await client.request(
        "DELETE",
        f"{API}/users/me",
        headers=bearer(tokens["access_token"]),
        json={"password": "correct-horse-9"},
    )
    assert response.status_code == 204

    me = await client.get(f"{API}/users/me", headers=bearer(tokens["access_token"]))
    assert me.status_code == 401
    refresh = await client.post(f"{API}/auth/refresh", json={"refresh_token": tokens["refresh_token"]})
    assert refresh.status_code == 401
