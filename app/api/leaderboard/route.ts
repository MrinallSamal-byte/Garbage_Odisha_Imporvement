import { NextResponse } from "next/server";

import { getReportRepository } from "@/server/repositories/repository-factory";

export const dynamic = "force-dynamic";

const UNRESOLVED_STATUSES = new Set(["REPORTED", "VERIFIED", "FORWARDED", "IN_PROGRESS"]);

export async function GET() {
  const repo = getReportRepository();
  const all = await repo.listPublicReports();

  const districtMap = new Map<
    string,
    {
      name: string;
      total: number;
      resolved: number;
      unresolved: number;
      critical: number;
      resolutionTimes: number[];
    }
  >();

  for (const item of all) {
    const district = item.district?.name ?? "Unknown";
    if (!districtMap.has(district)) {
      districtMap.set(district, {
        name: district,
        total: 0,
        resolved: 0,
        unresolved: 0,
        critical: 0,
        resolutionTimes: [],
      });
    }
    const entry = districtMap.get(district)!;
    entry.total++;

    if (item.report.status === "RESOLVED") {
      entry.resolved++;
      const created = Date.parse(item.report.createdAt);
      const updated = Date.parse(item.report.updatedAt);
      const hours = (updated - created) / (1000 * 60 * 60);
      if (hours > 0) entry.resolutionTimes.push(hours);
    } else if (UNRESOLVED_STATUSES.has(item.report.status)) {
      entry.unresolved++;
    }

    if (item.report.severity === "CRITICAL" || item.report.severity === "HIGH") {
      entry.critical++;
    }
  }

  const rows = Array.from(districtMap.values()).map((entry) => {
    const resolutionRate =
      entry.total > 0 ? Math.round((entry.resolved / entry.total) * 100) : 0;
    const avgResolutionHours =
      entry.resolutionTimes.length > 0
        ? Math.round(
            entry.resolutionTimes.reduce((a, b) => a + b, 0) / entry.resolutionTimes.length,
          )
        : null;
    return {
      district: entry.name,
      total: entry.total,
      resolved: entry.resolved,
      unresolved: entry.unresolved,
      critical: entry.critical,
      resolutionRate,
      avgResolutionHours,
    };
  });

  rows.sort((a, b) => b.resolutionRate - a.resolutionRate || a.unresolved - b.unresolved);

  return NextResponse.json({ rows, generatedAt: new Date().toISOString() });
}
