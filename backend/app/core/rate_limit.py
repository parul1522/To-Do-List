"""Lightweight in-process sliding-window rate limiter.

Good enough for a single API instance and for protecting auth endpoints from
brute force. When the API is scaled horizontally, swap ``_store`` for a Redis
backed implementation with the same interface.
"""

import asyncio
import time
from collections import defaultdict, deque

from fastapi import Request

from app.core.config import settings
from app.core.exceptions import RateLimitError


class SlidingWindowStore:
    def __init__(self) -> None:
        self._hits: dict[str, deque[float]] = defaultdict(deque)
        self._lock = asyncio.Lock()

    async def hit(self, key: str, limit: int, window_seconds: float) -> float | None:
        """Record a hit. Returns seconds until retry if the limit is exceeded."""
        now = time.monotonic()
        async with self._lock:
            bucket = self._hits[key]
            while bucket and bucket[0] <= now - window_seconds:
                bucket.popleft()
            if len(bucket) >= limit:
                return max(bucket[0] + window_seconds - now, 0.0)
            bucket.append(now)
            if len(self._hits) > 50_000:
                self._evict_empty(now, window_seconds)
            return None

    def _evict_empty(self, now: float, window_seconds: float) -> None:
        stale = [k for k, b in self._hits.items() if not b or b[-1] <= now - window_seconds]
        for key in stale:
            del self._hits[key]

    def reset(self) -> None:
        self._hits.clear()


_store = SlidingWindowStore()


def client_ip(request: Request) -> str:
    if settings.trust_proxy_headers:
        forwarded = request.headers.get("x-forwarded-for")
        if forwarded:
            return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


class RateLimit:
    """FastAPI dependency: ``Depends(RateLimit("auth", limit=10, window_seconds=60))``."""

    def __init__(self, scope: str, limit: int, window_seconds: float = 60.0) -> None:
        self.scope = scope
        self.limit = limit
        self.window_seconds = window_seconds

    async def __call__(self, request: Request) -> None:
        if not settings.rate_limit_enabled:
            return
        retry_after = await _store.hit(f"{self.scope}:{client_ip(request)}", self.limit, self.window_seconds)
        if retry_after is not None:
            raise RateLimitError(
                "Too many requests. Please try again shortly.",
                headers={"Retry-After": str(int(retry_after) + 1)},
            )


def reset_rate_limits() -> None:
    _store.reset()
