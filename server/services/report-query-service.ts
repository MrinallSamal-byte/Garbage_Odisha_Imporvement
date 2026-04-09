import { getReportRepository, getRepresentativeRepository } from "@/server/repositories/repository-factory";
import type { DashboardStats } from "@/types/domain";

export const emptyDashboardStats: DashboardStats = {
  totalReports: 0,
  unresolvedReports: 0,
  resolvedReports: 0,
  averageTrustScore: 0,
  highSeverityReports: 0,
};

export async function getDashboardData(filters?: Parameters<ReturnType<typeof getReportRepository>["listPublicReports"]>[0]) {
  const reportRepository = getReportRepository();
  const [stats, reports] = await Promise.all([
    reportRepository.getDashboardStats(),
    reportRepository.listPublicReports(filters),
  ]);

  return { stats, reports };
}

export async function getRepresentativeProfileData(representativeId: string) {
  const representativeRepository = getRepresentativeRepository();
  const reportRepository = getReportRepository();

  const [representative, reports] = await Promise.all([
    representativeRepository.getRepresentativeById(representativeId),
    reportRepository.getRepresentativeReportItems(representativeId),
  ]);

  if (!representative) {
    return null;
  }

  return {
    representative,
    reports,
    unresolvedCount: reports.filter((item) =>
      ["REPORTED", "VERIFIED", "FORWARDED", "IN_PROGRESS"].includes(item.report.status),
    ).length,
    resolvedCount: reports.filter((item) => item.report.status === "RESOLVED").length,
  };
}
