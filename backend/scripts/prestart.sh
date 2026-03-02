#! /usr/bin/env bash

set -e
set -x

# Run migrations
alembic upgrade head

# Run seed script
python app/seed.py

# Required for docker compose as it's served as an entrypoint
exec "$@"
