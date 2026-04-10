#!/bin/sh
set -e

if [ "${APP_MODE}" = "real" ]; then
  echo "Running database migrations..."
  node_modules/.bin/prisma migrate deploy --schema=prisma/schema.prisma
  echo "Migrations complete."
else
  echo "APP_MODE=${APP_MODE:-mock} — skipping migrations."
fi

echo "Starting Next.js server..."
exec node server.js
