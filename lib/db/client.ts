import "server-only";

import { prisma } from "@/lib/db/prisma";
import { healthCheckDb, withDbRetry } from "@/lib/db/health";

export function getDbClient() {
  return prisma;
}

export { healthCheckDb, withDbRetry };
