#!/bin/sh
set -e

# Apply pending migrations before serving unless explicitly disabled
# (e.g. when a separate release job owns migrations).
if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
  alembic upgrade head
fi

exec "$@"
