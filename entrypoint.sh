#!/bin/sh
set -e

if [ "${APP_MODE}" = "real" ]; then
  echo "Running database migrations..."
  node_modules/.bin/prisma migrate deploy
  echo "Migrations complete."
else
  echo "APP_MODE=${APP_MODE} — skipping migrations (mock mode)."
fi

echo "Starting Next.js server..."
exec node server.js
