import { env } from "@/lib/env";
import { createAdminSession } from "@/lib/auth/admin-session";
import { readMockState } from "@/lib/mock/runtime-store";
import { AppError } from "@/lib/utils/errors";
import type { Representative } from "@/types/domain";
import { getReportRepository, getRepresentativeRepository } from "@/server/repositories/repository-factory";

export async function loginAdmin(email: string, password: string) {
  if (email !== env.ADMIN_EMAIL || password !== env.ADMIN_PASSWORD) {
    throw new AppError("Invalid admin credentials.", 401);
  }

  const state = await readMockState();
  const user =
    state.users.find((entry) => entry.email === email && (entry.role === "ADMIN" || entry.role === "MODERATOR")) ??
    null;

  if (!user) {
    throw new AppError("Admin user record is missing from the seeded data.", 500);
  }

  await createAdminSession({
    userId: user.id,
    email: user.email ?? email,
    role: user.role === "ADMIN" ? "ADMIN" : "MODERATOR",
  });

  return user;
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
