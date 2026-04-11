#!/bin/sh
set -e

if [ "${APP_MODE}" = "real" ]; then
  if [ "${SKIP_DATABASE_MIGRATIONS}" = "true" ]; then
    echo "SKIP_DATABASE_MIGRATIONS=true — skipping database migrations."
    echo "Starting Next.js server..."
    exec node server.js
  fi

  echo "Checking PostGIS availability before migrations..."
  POSTGIS_AVAILABLE="$(node - <<'NODE'
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.$queryRawUnsafe(
    "SELECT EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'postgis') AS available"
  );
  console.log(rows[0] && rows[0].available ? "true" : "false");
}

main()
  .catch((error) => {
    console.error(error && error.message ? error.message : error);
    process.exitCode = 2;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
NODE
)"

  if [ "${POSTGIS_AVAILABLE}" != "true" ]; then
    echo "PostGIS is not available on the connected DigitalOcean PostgreSQL cluster."
    echo "Skipping migrations so the app can start in degraded setup mode."
    echo "Make this same primary DigitalOcean database PostGIS-capable, then redeploy to apply migrations."
    echo "Starting Next.js server..."
    exec node server.js
  fi

  echo "Running database migrations..."
  node_modules/.bin/prisma migrate deploy --schema=prisma/schema.prisma
  echo "Migrations complete."
else
  echo "APP_MODE=${APP_MODE:-mock} — skipping migrations."
fi

echo "Starting Next.js server..."
exec node server.js
