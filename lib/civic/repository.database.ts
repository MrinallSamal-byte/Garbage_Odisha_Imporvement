import "server-only";

import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { buildReportTitle, buildPartyAcronym, getDaysOpen, parseBoundaryGeojson, toIsoString } from "@/lib/civic/helpers";
import type {
  GeoLookupResult,
  OfficialBoundary,
  ReportListItem,
  ReportQueryFilters,
  StatsSummary,
  WasteTypeRecord,
  WardBoundary,
} from "@/lib/civic/types";
import type { CivicRepository, CreateReportRecordInput, ResolveReportInput } from "@/lib/civic/repository";

type WardRow = {
  id: string;
  number: number;
  name: string;
  zone: string;
  boundary_geojson: unknown;
};

type OfficialRow = {
  id: string;
  name: string;
  party: string;
  party_logo_url: string;
  constituency_name: string;
  contact_email: string | null;
  contact_phone: string | null;
  profile_url: string | null;
  boundary_geojson: unknown;
};

type WasteTypeRow = {
  id: string;
  key: string;
  label: string;
  description: string | null;
};

type ReportCardRow = {
  id: string;
  reporter_id: string | null;
  ward_id: string;
  mla_id: string;
  mp_id: string;
  waste_type_id: string;
  title: string;
  address: string;
  landmark: string | null;
  photo_url: string;
  verification_photo_url: string | null;
  lat: number;
  lng: number;
  severity: ReportListItem["report"]["severity"];
  status: ReportListItem["report"]["status"];
  reporter_count: number;
  created_at: Date | string;
  updated_at: Date | string;
  resolved_at: Date | string | null;
  ward_number: number;
  ward_name: string;
  ward_zone: string;
  ward_boundary_geojson: unknown;
  mla_name: string;
  mla_party: string;
  mla_party_logo_url: string;
  mla_constituency_name: string;
  mla_contact_email: string | null;
  mla_contact_phone: string | null;
  mla_profile_url: string | null;
  mla_boundary_geojson: unknown;
  mp_name: string;
  mp_party: string;
  mp_party_logo_url: string;
  mp_constituency_name: string;
  mp_contact_email: string | null;
  mp_contact_phone: string | null;
  mp_profile_url: string | null;
  mp_boundary_geojson: unknown;
  waste_type_key: WasteTypeRecord["key"];
  waste_type_label: string;
  waste_type_description: string | null;
};

function mapWard(row: WardRow): WardBoundary {
  return {
    id: row.id,
    number: row.number,
    name: row.name,
    zone: row.zone,
    boundaryGeojson: {
      type: "Feature",
      properties: {
        id: row.id,
        number: row.number,
        name: row.name,
        zone: row.zone,
      },
      geometry: parseBoundaryGeojson(row.boundary_geojson as never),
    },
  };
}

function mapOfficial(row: OfficialRow): OfficialBoundary {
  return {
    id: row.id,
    name: row.name,
    party: row.party,
    partyAcronym: buildPartyAcronym(row.party),
    partyLogoUrl: row.party_logo_url,
    constituencyName: row.constituency_name,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    profileUrl: row.profile_url,
    boundaryGeojson: {
      type: "Feature",
      properties: {
        id: row.id,
        name: row.name,
        party: row.party,
        constituency_name: row.constituency_name,
      },
      geometry: parseBoundaryGeojson(row.boundary_geojson as never),
    },
  };
}

function mapWasteType(row: WasteTypeRow): WasteTypeRecord {
  return {
    id: row.id,
    key: row.key as WasteTypeRecord["key"],
    label: row.label,
    description: row.description,
  };
}

function mapReportCard(row: ReportCardRow): ReportListItem {
  return {
    report: {
      id: row.id,
      reporterId: row.reporter_id,
      wardId: row.ward_id,
      mlaId: row.mla_id,
      mpId: row.mp_id,
      wasteTypeId: row.waste_type_id,
      title: row.title,
      address: row.address,
      landmark: row.landmark,
      photoUrl: row.photo_url,
      verificationPhotoUrl: row.verification_photo_url,
      lat: row.lat,
      lng: row.lng,
      severity: row.severity,
      status: row.status,
      reporterCount: row.reporter_count,
      createdAt: toIsoString(row.created_at) ?? new Date().toISOString(),
      updatedAt: toIsoString(row.updated_at) ?? new Date().toISOString(),
      resolvedAt: toIsoString(row.resolved_at),
    },
    ward: {
      id: row.ward_id,
      number: row.ward_number,
      name: row.ward_name,
      zone: row.ward_zone,
      boundaryGeojson: {
        type: "Feature",
        properties: {
          id: row.ward_id,
          number: row.ward_number,
          name: row.ward_name,
          zone: row.ward_zone,
        },
        geometry: parseBoundaryGeojson(row.ward_boundary_geojson as never),
      },
    },
    mla: {
      id: row.mla_id,
      name: row.mla_name,
      party: row.mla_party,
      partyAcronym: buildPartyAcronym(row.mla_party),
      partyLogoUrl: row.mla_party_logo_url,
      constituencyName: row.mla_constituency_name,
      contactEmail: row.mla_contact_email,
      contactPhone: row.mla_contact_phone,
      profileUrl: row.mla_profile_url,
      boundaryGeojson: {
        type: "Feature",
        properties: {
          id: row.mla_id,
          name: row.mla_name,
          party: row.mla_party,
          constituency_name: row.mla_constituency_name,
        },
        geometry: parseBoundaryGeojson(row.mla_boundary_geojson as never),
      },
    },
    mp: {
      id: row.mp_id,
      name: row.mp_name,
      party: row.mp_party,
      partyAcronym: buildPartyAcronym(row.mp_party),
      partyLogoUrl: row.mp_party_logo_url,
      constituencyName: row.mp_constituency_name,
      contactEmail: row.mp_contact_email,
      contactPhone: row.mp_contact_phone,
      profileUrl: row.mp_profile_url,
      boundaryGeojson: {
        type: "Feature",
        properties: {
          id: row.mp_id,
          name: row.mp_name,
          party: row.mp_party,
          constituency_name: row.mp_constituency_name,
        },
        geometry: parseBoundaryGeojson(row.mp_boundary_geojson as never),
      },
    },
    wasteType: {
      id: row.waste_type_id,
      key: row.waste_type_key,
      label: row.waste_type_label,
      description: row.waste_type_description,
    },
  };
}

function buildWhereClause(filters?: ReportQueryFilters) {
  const clauses: Prisma.Sql[] = [];

  if (filters?.severity && filters.severity !== "all") {
    clauses.push(Prisma.sql`severity = ${filters.severity}::report_severity`);
  }

  if (filters?.status && filters.status !== "all") {
    clauses.push(Prisma.sql`status = ${filters.status}::report_status`);
  }

  if (!clauses.length) {
    return Prisma.empty;
  }

  return Prisma.sql`WHERE ${Prisma.join(clauses, " AND ")}`;
}

async function findWardById(id: string) {
  const rows = await prisma.$queryRaw<WardRow[]>(
    Prisma.sql`SELECT id::text, number, name, zone, boundary_geojson FROM public.wards WHERE id = ${id}::uuid LIMIT 1`,
  );

  return rows[0] ? mapWard(rows[0]) : null;
}

async function findOfficialsByWardId(wardId: string) {
  const [mlaRows, mpRows] = await Promise.all([
    prisma.$queryRaw<OfficialRow[]>(
      Prisma.sql`
        SELECT m.id::text, m.name, m.party, m.party_logo_url, m.constituency_name, m.contact_email, m.contact_phone, m.profile_url, m.boundary_geojson
        FROM public.mlas m
        JOIN public.wards w ON w.id = ${wardId}::uuid
        WHERE ST_Covers(m.geometry, ST_PointOnSurface(w.geometry))
        ORDER BY m.constituency_name
        LIMIT 1
      `,
    ),
    prisma.$queryRaw<OfficialRow[]>(
      Prisma.sql`
        SELECT m.id::text, m.name, m.party, m.party_logo_url, m.constituency_name, m.contact_email, m.contact_phone, m.profile_url, m.boundary_geojson
        FROM public.mps m
        JOIN public.wards w ON w.id = ${wardId}::uuid
        WHERE ST_Covers(m.geometry, ST_PointOnSurface(w.geometry))
        ORDER BY m.constituency_name
        LIMIT 1
      `,
    ),
  ]);

  return {
    mla: mlaRows[0] ? mapOfficial(mlaRows[0]) : null,
    mp: mpRows[0] ? mapOfficial(mpRows[0]) : null,
  };
}

export class DatabaseCivicRepository implements CivicRepository {
  async listWards() {
    const rows = await prisma.$queryRaw<WardRow[]>(
      Prisma.sql`SELECT id::text, number, name, zone, boundary_geojson FROM public.wards ORDER BY number ASC`,
    );

    return rows.map(mapWard);
  }

  async listWasteTypes() {
    const rows = await prisma.$queryRaw<WasteTypeRow[]>(
      Prisma.sql`SELECT id::text, key, label, description FROM public.waste_types ORDER BY label ASC`,
    );

    return rows.map(mapWasteType);
  }

  async listReports(filters?: ReportQueryFilters) {
    const whereClause = buildWhereClause(filters);
    const rows = await prisma.$queryRaw<ReportCardRow[]>(
      Prisma.sql`
        SELECT *
        FROM public.report_cards
        ${whereClause}
        ORDER BY created_at DESC
      `,
    );

    return rows.map(mapReportCard);
  }

  async getReportDetail(id: string) {
    const rows = await prisma.$queryRaw<ReportCardRow[]>(
      Prisma.sql`SELECT * FROM public.report_cards WHERE id = ${id}::uuid LIMIT 1`,
    );

    const item = rows[0] ? mapReportCard(rows[0]) : null;
    if (!item) {
      return null;
    }

    return {
      ...item,
      daysOpen: getDaysOpen(item.report.createdAt, item.report.resolvedAt),
    };
  }

  async lookupByPoint(lat: number, lng: number): Promise<GeoLookupResult> {
    const pointSql = Prisma.sql`ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)`;

    const [wardRows, mlaRows, mpRows] = await Promise.all([
      prisma.$queryRaw<WardRow[]>(
        Prisma.sql`
          SELECT id::text, number, name, zone, boundary_geojson
          FROM public.wards
          WHERE ST_Covers(geometry, ${pointSql})
          ORDER BY number
          LIMIT 1
        `,
      ),
      prisma.$queryRaw<OfficialRow[]>(
        Prisma.sql`
          SELECT id::text, name, party, party_logo_url, constituency_name, contact_email, contact_phone, profile_url, boundary_geojson
          FROM public.mlas
          WHERE ST_Covers(geometry, ${pointSql})
          ORDER BY constituency_name
          LIMIT 1
        `,
      ),
      prisma.$queryRaw<OfficialRow[]>(
        Prisma.sql`
          SELECT id::text, name, party, party_logo_url, constituency_name, contact_email, contact_phone, profile_url, boundary_geojson
          FROM public.mps
          WHERE ST_Covers(geometry, ${pointSql})
          ORDER BY constituency_name
          LIMIT 1
        `,
      ),
    ]);

    return {
      ward: wardRows[0] ? mapWard(wardRows[0]) : null,
      mla: mlaRows[0] ? mapOfficial(mlaRows[0]) : null,
      mp: mpRows[0] ? mapOfficial(mpRows[0]) : null,
    };
  }

  async createReport(input: CreateReportRecordInput) {
    const directLookup = await this.lookupByPoint(input.lat, input.lng);
    const selectedWard = input.wardId ? await findWardById(input.wardId) : null;
    const fallbackOfficials = input.wardId ? await findOfficialsByWardId(input.wardId) : { mla: null, mp: null };

    const ward = directLookup.ward ?? selectedWard;
    const mla = directLookup.mla ?? fallbackOfficials.mla;
    const mp = directLookup.mp ?? fallbackOfficials.mp;

    if (!ward || !mla || !mp) {
      throw new Error("Could not determine the responsible ward, MLA, or MP for this location.");
    }

    const rows = await prisma.$queryRaw<Array<{ id: string }>>(
      Prisma.sql`
        INSERT INTO public.reports (
          reporter_id,
          ward_id,
          mla_id,
          mp_id,
          waste_type_id,
          title,
          address,
          landmark,
          photo_url,
          lat,
          lng,
          severity,
          status,
          reporter_count
        )
        VALUES (
          ${input.reporterId ?? null}::uuid,
          ${ward.id}::uuid,
          ${mla.id}::uuid,
          ${mp.id}::uuid,
          ${input.wasteTypeId}::uuid,
          ${buildReportTitle(input.landmark, ward.number)},
          ${input.address},
          ${input.landmark},
          ${input.photoUrl},
          ${input.lat},
          ${input.lng},
          ${input.severity}::report_severity,
          'unresolved'::report_status,
          1
        )
        RETURNING id::text
      `,
    );

    return rows[0].id;
  }

  async incrementReporterCount(id: string) {
    const rows = await prisma.$queryRaw<Array<{ reporter_count: number }>>(
      Prisma.sql`
        UPDATE public.reports
        SET reporter_count = reporter_count + 1
        WHERE id = ${id}::uuid
        RETURNING reporter_count
      `,
    );

    if (!rows[0]) {
      throw new Error("Report not found.");
    }

    return rows[0].reporter_count;
  }

  async resolveReport(input: ResolveReportInput) {
    await prisma.$executeRaw(
      Prisma.sql`
        UPDATE public.reports
        SET
          status = 'resolved'::report_status,
          verification_photo_url = ${input.verificationPhotoUrl},
          resolved_at = NOW()
        WHERE id = ${input.reportId}::uuid
      `,
    );
  }

  async getStats(): Promise<StatsSummary> {
    const [activeRows, severityRows, topWardRows, trendRows] = await Promise.all([
      prisma.$queryRaw<Array<{ total: bigint }>>(
        Prisma.sql`SELECT COUNT(*)::bigint AS total FROM public.reports WHERE status <> 'resolved'::report_status`,
      ),
      prisma.$queryRaw<Array<{ severity: ReportListItem["report"]["severity"]; count: bigint }>>(
        Prisma.sql`
          SELECT severity, COUNT(*)::bigint AS count
          FROM public.reports
          WHERE status <> 'resolved'::report_status
          GROUP BY severity
          ORDER BY severity
        `,
      ),
      prisma.$queryRaw<Array<{ ward_id: string; ward_label: string; count: bigint }>>(
        Prisma.sql`
          SELECT
            w.id::text AS ward_id,
            CONCAT('Ward #', w.number, ' · ', w.name) AS ward_label,
            COUNT(r.id)::bigint AS count
          FROM public.wards w
          LEFT JOIN public.reports r
            ON r.ward_id = w.id
            AND r.status <> 'resolved'::report_status
          GROUP BY w.id, w.number, w.name
          HAVING COUNT(r.id) > 0
          ORDER BY COUNT(r.id) DESC, w.number ASC
          LIMIT 5
        `,
      ),
      prisma.$queryRaw<Array<{ day: Date | string; count: bigint }>>(
        Prisma.sql`
          SELECT date_trunc('day', created_at) AS day, COUNT(*)::bigint AS count
          FROM public.reports
          WHERE created_at >= NOW() - INTERVAL '14 days'
          GROUP BY 1
          ORDER BY 1
        `,
      ),
    ]);

    return {
      totalActiveDumps: Number(activeRows[0]?.total ?? BigInt(0)),
      severityDistribution: ["minor", "moderate", "severe", "critical"].map((severity) => ({
        severity: severity as ReportListItem["report"]["severity"],
        count: Number(
          severityRows.find((row) => row.severity === severity)?.count ?? BigInt(0),
        ),
      })),
      topWards: topWardRows.map((row) => ({
        wardId: row.ward_id,
        wardLabel: row.ward_label,
        count: Number(row.count),
      })),
      trend: trendRows.map((row) => ({
        date: (toIsoString(row.day) ?? new Date().toISOString()).slice(0, 10),
        count: Number(row.count),
      })),
    };
  }

  async getOfficialContactCards() {
    const [mlaRows, mpRows] = await Promise.all([
      prisma.$queryRaw<OfficialRow[]>(
        Prisma.sql`
          SELECT id::text, name, party, party_logo_url, constituency_name, contact_email, contact_phone, profile_url, boundary_geojson
          FROM public.mlas
          ORDER BY constituency_name
        `,
      ),
      prisma.$queryRaw<OfficialRow[]>(
        Prisma.sql`
          SELECT id::text, name, party, party_logo_url, constituency_name, contact_email, contact_phone, profile_url, boundary_geojson
          FROM public.mps
          ORDER BY constituency_name
        `,
      ),
    ]);

    return {
      mlas: mlaRows.map(mapOfficial),
      mps: mpRows.map(mapOfficial),
    };
  }
}
