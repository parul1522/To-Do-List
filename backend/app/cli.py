"""Operational commands.

    python -m app.cli purge-tokens [--grace-days 7]

Schedule ``purge-tokens`` daily (cron, Kubernetes CronJob, etc.) to delete
refresh tokens that expired or were revoked more than ``grace-days`` ago. The
grace period keeps recently revoked rows around so reuse detection still
recognises a replayed token.
"""

import argparse
import asyncio
from datetime import UTC, datetime, timedelta

from app.db.session import SessionLocal, engine
from app.repositories.refresh_token_repository import RefreshTokenRepository


async def purge_tokens(grace_days: int) -> int:
    cutoff = datetime.now(UTC) - timedelta(days=grace_days)
    async with SessionLocal() as session:
        deleted = await RefreshTokenRepository(session).purge_stale(cutoff)
        await session.commit()
    return deleted


def main() -> None:
    parser = argparse.ArgumentParser(prog="python -m app.cli")
    commands = parser.add_subparsers(dest="command", required=True)
    purge = commands.add_parser("purge-tokens", help="Delete stale refresh tokens")
    purge.add_argument("--grace-days", type=int, default=7)
    args = parser.parse_args()

    async def run() -> None:
        try:
            if args.command == "purge-tokens":
                deleted = await purge_tokens(args.grace_days)
                print(f"Deleted {deleted} stale refresh token(s)")
        finally:
            await engine.dispose()

    asyncio.run(run())


if __name__ == "__main__":
    main()
