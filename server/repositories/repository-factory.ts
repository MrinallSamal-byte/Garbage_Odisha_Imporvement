import { env } from "@/lib/env";

import type { GeoRepository } from "./geo-repository";
import { MockGeoRepository } from "./mock-geo-repository";
import { MockRepresentativeRepository } from "./mock-representative-repository";
import { MockReportRepository } from "./mock-report-repository";
import { PostgisGeoRepository } from "./postgis-geo-repository";
import { PrismaReportRepository } from "./prisma-report-repository";
import { PrismaRepresentativeRepository } from "./prisma-representative-repository";
import type { ReportRepository } from "./report-repository";
import type { RepresentativeRepository } from "./representative-repository";

let geoRepository: GeoRepository | null = null;
let representativeRepository: RepresentativeRepository | null = null;
let reportRepository: ReportRepository | null = null;

export function getGeoRepository(): GeoRepository {
  if (!geoRepository) {
    geoRepository = env.APP_MODE === "real" ? new PostgisGeoRepository() : new MockGeoRepository();
  }

  return geoRepository;
}

export function getRepresentativeRepository(): RepresentativeRepository {
  if (!representativeRepository) {
    representativeRepository =
      env.APP_MODE === "real"
        ? new PrismaRepresentativeRepository()
        : new MockRepresentativeRepository();
  }

  return representativeRepository;
}

export function getReportRepository(): ReportRepository {
  if (!reportRepository) {
    reportRepository = env.APP_MODE === "real" ? new PrismaReportRepository() : new MockReportRepository();
  }

  return reportRepository!;
}
