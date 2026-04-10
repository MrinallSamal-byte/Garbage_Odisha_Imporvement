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

  // Strip pagination fields before passing to the repository — neither the mock
  // nor the Prisma repository use page/pageSize; they return all matching records
  // and pagination is applied here in memory. Passing them through would be
  // confusing and could break future repository implementations that do respect them.
  const { page: _page, pageSize: _pageSize, ...repoFilters } = filters ?? {};
  const page = filters?.page ?? 1;
  const pageSize = filters?.pageSize ?? 20;

  const [stats, allReports] = await Promise.all([
    reportRepository.getDashboardStats(),
    reportRepository.listPublicReports(Object.keys(repoFilters).length > 0 ? repoFilters : undefined),
  ]);

  const total = allReports.length;
  const start = (page - 1) * pageSize;
  const reports = allReports.slice(start, start + pageSize);

  // Compute distinct district names from ALL matching reports (pre-pagination)
  // so the dashboard filter dropdown always shows the full set regardless of
  // which page the user is on.
  const allDistricts = Array.from(
    new Set(
      allReports
        .map((item) => item.district?.name)
        .filter((n): n is string => Boolean(n)),
    ),
  ).sort();

  return { stats, reports, total, allDistricts };
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
