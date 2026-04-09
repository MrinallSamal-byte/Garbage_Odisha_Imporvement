import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  __safa_prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.__safa_prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__safa_prisma = prisma;
}
