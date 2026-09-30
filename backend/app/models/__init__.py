"""Import every model here so Alembic autogenerate sees the full metadata."""

from app.models.refresh_token import RefreshToken
from app.models.user import User

__all__ = ["RefreshToken", "User"]
