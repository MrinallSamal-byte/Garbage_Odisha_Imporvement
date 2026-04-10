import { prisma } from "@/lib/db/prisma";

type DbExtensionStatus = {
  available: boolean;
  installed: boolean;
  version: string | null;
};

export type HealthCheckResult = {
  ok: boolean;
  latencyMs: number;
  message: string;
  serverVersion?: string;
  extensions?: {
    postgis: DbExtensionStatus;
    pgcrypto: DbExtensionStatus;
    uuidOssp: DbExtensionStatus;
  };
  warnings?: string[];
};

export async function withDbRetry<T>(operation: () => Promise<T>, attempts = 3, delayMs = 300) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt === attempts) {
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
    }
  }

  throw lastError;
}

export async function healthCheckDb(): Promise<HealthCheckResult> {
  const startedAt = Date.now();

  try {
    const [versionRows, extensionRows] = await withDbRetry(() =>
      Promise.all([
        prisma.$queryRaw<Array<{ version: string }>>`SELECT version()`,
        prisma.$queryRaw<
          Array<{ name: string; default_version: string | null; installed_version: string | null }>
        >`
          SELECT name, default_version, installed_version
          FROM pg_available_extensions
          WHERE name IN ('postgis', 'pgcrypto', 'uuid-ossp')
        `,
      ]),
    );

    const extensionMap = new Map(extensionRows.map((row) => [row.name, row]));
    const postgis = extensionMap.get("postgis");
    const pgcrypto = extensionMap.get("pgcrypto");
    const uuidOssp = extensionMap.get("uuid-ossp");
    const warnings: string[] = [];

    if (!postgis) {
      warnings.push("PostGIS is not available on the connected DigitalOcean PostgreSQL cluster.");
    } else if (!postgis.installed_version) {
      warnings.push("PostGIS is available but not installed in the current database.");
    }

    return {
      ok: true,
      latencyMs: Date.now() - startedAt,
      message: warnings.length
        ? "DigitalOcean PostgreSQL connection is healthy, but GIS prerequisites are incomplete."
        : "DigitalOcean PostgreSQL connection is healthy.",
      serverVersion: versionRows[0]?.version,
      extensions: {
        postgis: {
          available: Boolean(postgis),
          installed: Boolean(postgis?.installed_version),
          version: postgis?.installed_version ?? postgis?.default_version ?? null,
        },
        pgcrypto: {
          available: Boolean(pgcrypto),
          installed: Boolean(pgcrypto?.installed_version),
          version: pgcrypto?.installed_version ?? pgcrypto?.default_version ?? null,
        },
        uuidOssp: {
          available: Boolean(uuidOssp),
          installed: Boolean(uuidOssp?.installed_version),
          version: uuidOssp?.installed_version ?? uuidOssp?.default_version ?? null,
        },
      },
      warnings,
    };
  } catch (error) {
    return {
      ok: false,
      latencyMs: Date.now() - startedAt,
      message: error instanceof Error ? error.message : "Database health check failed.",
    };
  }
}
