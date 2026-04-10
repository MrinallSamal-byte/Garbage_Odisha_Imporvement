import { getReportRepository, getRepresentativeRepository } from "@/server/repositories/repository-factory";
import type { DashboardStats, ReportFilters } from "@/types/domain";

export const emptyDashboardStats: DashboardStats = {
  totalReports: 0,
  unresolvedReports: 0,
  resolvedReports: 0,
  averageTrustScore: 0,
  highSeverityReports: 0,
};

export async function getDashboardData(filters?: ReportFilters) {
  const reportRepository = getReportRepository();
  const [stats, allReports] = await Promise.all([
    reportRepository.getDashboardStats(),
    reportRepository.listPublicReports(filters),
  ]);
  const availableDistricts = Array.from(
    new Set(allReports.map((item) => item.district?.name).filter(Boolean)),
  ) as string[];

  const page = filters?.page ?? 1;
  const pageSize = filters?.pageSize ?? 20;
  const total = allReports.length;
  const start = (page - 1) * pageSize;
  const reports = allReports.slice(start, start + pageSize);

  return { stats, reports, total, availableDistricts };
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
