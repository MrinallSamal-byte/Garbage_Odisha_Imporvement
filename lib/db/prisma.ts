import { PrismaClient } from "@prisma/client";

declare global {
  var __safa_prisma: PrismaClient | undefined;
}

export const prisma =
  global.__safa_prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.__safa_prisma = prisma;
}
