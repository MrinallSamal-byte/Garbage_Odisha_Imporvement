import { env } from "@/lib/env";
import { createAdminSession } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/db/prisma";
import { readMockState } from "@/lib/mock/runtime-store";
import { AppError } from "@/lib/utils/errors";
import type { Representative } from "@/types/domain";
import { getReportRepository, getRepresentativeRepository } from "@/server/repositories/repository-factory";

export async function loginAdmin(email: string, password: string) {
  if (email !== env.ADMIN_EMAIL || password !== env.ADMIN_PASSWORD) {
    throw new AppError("Invalid admin credentials.", 401);
  }

  const user =
    env.APP_MODE === "real"
      ? await prisma.user.upsert({
          where: { email },
          create: {
            name: "SafaOdisha Admin",
            email,
            role: "ADMIN",
            isActive: true,
          },
          update: {
            name: "SafaOdisha Admin",
            role: "ADMIN",
            isActive: true,
          },
        })
      : (() => undefined)();

  if (user) {
    await createAdminSession({
      userId: user.id,
      email: user.email ?? email,
      role: user.role === "MODERATOR" ? "MODERATOR" : "ADMIN",
    });

    return user;
  }

  const state = await readMockState();
  const mockUser =
    state.users.find((entry) => entry.email === email && (entry.role === "ADMIN" || entry.role === "MODERATOR")) ??
    null;

  if (!mockUser) {
    throw new AppError("Admin user record is missing from the seeded data.", 500);
  }

  await createAdminSession({
    userId: mockUser.id,
    email: mockUser.email ?? email,
    role: mockUser.role === "ADMIN" ? "ADMIN" : "MODERATOR",
  });

  return mockUser;
}

export async function getAdminOverview() {
  const reportRepository = getReportRepository();
  const representativeRepository = getRepresentativeRepository();

  const [reports, stats, representatives] = await Promise.all([
    reportRepository.listAdminReports(),
    reportRepository.getDashboardStats(),
    representativeRepository.listRepresentatives(),
  ]);

  return {
    reports,
    stats,
    representatives,
  };
}

export async function upsertRepresentativeRecord(input: Representative) {
  const representativeRepository = getRepresentativeRepository();
  return representativeRepository.upsertRepresentative(input);
}
