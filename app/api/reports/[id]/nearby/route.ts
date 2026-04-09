import { NextRequest } from "next/server";

import { fail, ok } from "@/lib/utils/http";
import { haversineDistanceMeters } from "@/lib/utils/geo";
import { getReportRepository } from "@/server/repositories/repository-factory";
import { serializeReportListItem } from "@/server/services/report-presentation-service";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const repo = getReportRepository();
    const detail = await repo.getReportDetail(id);

    if (!detail) {
      return ok({ items: [] });
    }

    const all = await repo.listPublicReports();
    const nearby = all
      .filter((item) => item.report.id !== id)
      .map((item) => ({
        item,
        distanceMeters: haversineDistanceMeters(
          detail.report.latitude,
          detail.report.longitude,
          item.report.latitude,
          item.report.longitude,
        ),
      }))
      .filter(({ distanceMeters }) => distanceMeters <= 2000)
      .sort((a, b) => a.distanceMeters - b.distanceMeters)
      .slice(0, 5);

    return ok({
      items: nearby.map(({ item, distanceMeters }) => ({
        ...serializeReportListItem(item),
        distanceMeters: Math.round(distanceMeters),
      })),
    });
  } catch (error) {
    return fail(error);
  }
}
