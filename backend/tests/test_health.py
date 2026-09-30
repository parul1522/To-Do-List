from httpx import AsyncClient

from tests.conftest import API


async def test_liveness(client: AsyncClient) -> None:
    response = await client.get(f"{API}/health")
    assert response.status_code == 200
    assert response.headers["x-content-type-options"] == "nosniff"


async def test_readiness_checks_database(client: AsyncClient) -> None:
    response = await client.get(f"{API}/health/ready")
    assert response.status_code == 200
    assert response.json()["database"] == "up"


async def test_unknown_route_uses_error_envelope(client: AsyncClient) -> None:
    response = await client.get(f"{API}/does-not-exist")
    assert response.status_code == 404
    assert response.json()["error"]["code"] == "not_found"
