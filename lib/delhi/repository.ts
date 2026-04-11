import "server-only";

import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { healthCheckDb } from "@/lib/db/health";
import { delhiSeverities, delhiStatuses } from "@/lib/delhi/constants";
import type {
  CivicAuthorityOption,
  DelhiFilters,
  DelhiHomeData,
  DelhiJurisdictionLookup,
  DelhiReportCard,
  DelhiStats,
  LeaderSummary,
} from "@/lib/delhi/types";
import { sha256 } from "@/lib/utils/hash";

export type CreateDelhiReportInput = {
  title: string;
  description: string | null;
  addressText: string;
  landmark: string | null;
  latitude: number;
  longitude: number;
  severity: DelhiReportCard["severity"];
  wasteType: DelhiReportCard["wasteType"];
  photoUrl: string;
  thumbnailUrl: string | null;
};

export type DelhiAuthorityDetail = CivicAuthorityOption & {
  description: string | null;
};

export type DelhiWardDetail = {
  id: string;
  number: string;
  name: string;
  zone: string | null;
  authority: DelhiAuthorityDetail | null;
};

export type DelhiLeaderDetail = LeaderSummary & {
  role: "mla" | "mp" | "councillor" | "authority_official";
  constituencyName: string | null;
  constituencyId: string | null;
};

type ReportCardRow = {
  id: string;
  public_id: string;
  title: string;
  description: string | null;
  address_text: string;
  landmark: string | null;
  latitude: number;
  longitude: number;
  severity: DelhiReportCard["severity"];
  waste_type: DelhiReportCard["wasteType"];
  status: DelhiReportCard["status"];
  photo_url: string;
  thumbnail_url: string | null;
  reporter_count: number;
  created_at: Date | string;
  updated_at: Date | string;
  resolved_at: Date | string | null;
  authority_id: string | null;
  authority_slug: string | null;
  authority_name: string | null;
  authority_type: string | null;
  ward_id: string | null;
  ward_number: string | null;
  ward_name: string | null;
  zone_name: string | null;
  assembly_constituency_id: string | null;
  assembly_constituency_name: string | null;
  assembly_constituency_code: string | null;
  parliamentary_constituency_id: string | null;
  parliamentary_constituency_name: string | null;
  parliamentary_constituency_code: string | null;
  mla_leader_id: string | null;
  mla_name: string | null;
  mla_party_name: string | null;
  mla_party_short_name: string | null;
  mla_party_logo_url: string | null;
  mla_contact_phone: string | null;
  mla_contact_email: string | null;
  mla_official_url: string | null;
  mp_leader_id: string | null;
  mp_name: string | null;
  mp_party_name: string | null;
  mp_party_short_name: string | null;
  mp_party_logo_url: string | null;
  mp_contact_phone: string | null;
  mp_contact_email: string | null;
  mp_official_url: string | null;
};

type CountRow = {
  count: bigint | number;
};

const emptyStats: DelhiStats = {
  totalReports: 0,
  activeReports: 0,
  resolvedReports: 0,
  criticalReports: 0,
  severityDistribution: delhiSeverities.map((severity) => ({ severity, count: 0 })),
  statusDistribution: delhiStatuses.map((status) => ({ status, count: 0 })),
  topWards: [],
};

function toIsoString(value: Date | string | null) {
  if (!value) {
    return null;
  }

  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function mapLeader(prefix: "mla" | "mp", row: ReportCardRow): LeaderSummary | null {
  const id = row[`${prefix}_leader_id`];
  const name = row[`${prefix}_name`];

  if (!id || !name) {
    return null;
  }

  return {
    id,
    name,
    partyName: row[`${prefix}_party_name`],
    partyShortName: row[`${prefix}_party_short_name`],
    partyLogoUrl: row[`${prefix}_party_logo_url`],
    contactPhone: row[`${prefix}_contact_phone`],
    contactEmail: row[`${prefix}_contact_email`],
    officialUrl: row[`${prefix}_official_url`],
  };
}

function mapReportCard(row: ReportCardRow): DelhiReportCard {
  return {
    id: row.id,
    publicId: row.public_id,
    title: row.title,
    description: row.description,
    addressText: row.address_text,
    landmark: row.landmark,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    severity: row.severity,
    wasteType: row.waste_type,
    status: row.status,
    photoUrl: row.photo_url,
    thumbnailUrl: row.thumbnail_url,
    reporterCount: Number(row.reporter_count),
    createdAt: toIsoString(row.created_at) ?? new Date().toISOString(),
    updatedAt: toIsoString(row.updated_at) ?? new Date().toISOString(),
    resolvedAt: toIsoString(row.resolved_at),
    authority: {
      id: row.authority_id,
      slug: row.authority_slug,
      name: row.authority_name,
      type: row.authority_type,
    },
    ward: {
      id: row.ward_id,
      number: row.ward_number,
      name: row.ward_name,
      zone: row.zone_name,
    },
    assembly: {
      id: row.assembly_constituency_id,
      name: row.assembly_constituency_name,
      code: row.assembly_constituency_code,
    },
    parliament: {
      id: row.parliamentary_constituency_id,
      name: row.parliamentary_constituency_name,
      code: row.parliamentary_constituency_code,
    },
    mla: mapLeader("mla", row),
    mp: mapLeader("mp", row),
  };
}

function buildReportWhere(filters: DelhiFilters) {
  const clauses: Prisma.Sql[] = [];

  if (filters.severity !== "all") {
    clauses.push(Prisma.sql`severity = ${filters.severity}::report_severity`);
  }

  if (filters.status !== "all") {
    clauses.push(Prisma.sql`status = ${filters.status}::report_status`);
  }

  if (filters.wasteType !== "all") {
    clauses.push(Prisma.sql`waste_type = ${filters.wasteType}::waste_type`);
  }

  if (filters.authority) {
    clauses.push(Prisma.sql`authority_id = ${filters.authority}::uuid`);
  }

  if (filters.ward) {
    clauses.push(Prisma.sql`ward_id = ${filters.ward}::uuid`);
  }

  if (filters.mla) {
    clauses.push(Prisma.sql`mla_leader_id = ${filters.mla}::uuid`);
  }

  if (filters.mp) {
    clauses.push(Prisma.sql`mp_leader_id = ${filters.mp}::uuid`);
  }

  if (filters.q) {
    const like = `%${filters.q}%`;
    clauses.push(Prisma.sql`
      (
        title ILIKE ${like}
        OR address_text ILIKE ${like}
        OR COALESCE(landmark, '') ILIKE ${like}
        OR COALESCE(ward_name, '') ILIKE ${like}
        OR COALESCE(assembly_constituency_name, '') ILIKE ${like}
        OR COALESCE(parliamentary_constituency_name, '') ILIKE ${like}
        OR COALESCE(mla_name, '') ILIKE ${like}
        OR COALESCE(mp_name, '') ILIKE ${like}
      )
    `);
  }

  return clauses.length ? Prisma.sql`WHERE ${Prisma.join(clauses, " AND ")}` : Prisma.empty;
}

function buildSetupWarnings(error: unknown, healthWarnings: string[]) {
  const warnings = [...healthWarnings];
  const message = error instanceof Error ? error.message : String(error);

  if (!warnings.length || message) {
    warnings.push(
      "Delhi reporting tables are not readable yet. Apply the Delhi migration after PostGIS is available on the DigitalOcean PostgreSQL cluster.",
    );
  }

  return Array.from(new Set(warnings));
}

async function listAuthorities(): Promise<CivicAuthorityOption[]> {
  return prisma.$queryRaw<CivicAuthorityOption[]>(Prisma.sql`
    SELECT id::text, slug, name, type
    FROM public.civic_authorities
    ORDER BY name
  `);
}

async function listReportCards(filters: DelhiFilters) {
  const whereClause = buildReportWhere(filters);

  const rows = await prisma.$queryRaw<ReportCardRow[]>(Prisma.sql`
    SELECT *
    FROM public.report_cards
    ${whereClause}
    ORDER BY
      CASE severity
        WHEN 'critical'::report_severity THEN 1
        WHEN 'severe'::report_severity THEN 2
        WHEN 'moderate'::report_severity THEN 3
        ELSE 4
      END,
      created_at DESC
    LIMIT 250
  `);

  return rows.map(mapReportCard);
}

async function getStats(): Promise<DelhiStats> {
  const [totalRows, activeRows, resolvedRows, criticalRows, severityRows, statusRows, topWardRows] =
    await Promise.all([
      prisma.$queryRaw<CountRow[]>(Prisma.sql`SELECT COUNT(*)::bigint AS count FROM public.reports`),
      prisma.$queryRaw<CountRow[]>(
        Prisma.sql`SELECT COUNT(*)::bigint AS count FROM public.reports WHERE status <> 'resolved'::report_status`,
      ),
      prisma.$queryRaw<CountRow[]>(
        Prisma.sql`SELECT COUNT(*)::bigint AS count FROM public.reports WHERE status = 'resolved'::report_status`,
      ),
      prisma.$queryRaw<CountRow[]>(
        Prisma.sql`SELECT COUNT(*)::bigint AS count FROM public.reports WHERE severity = 'critical'::report_severity AND status <> 'resolved'::report_status`,
      ),
      prisma.$queryRaw<Array<{ severity: DelhiReportCard["severity"]; count: bigint }>>(Prisma.sql`
        SELECT severity, COUNT(*)::bigint AS count
        FROM public.reports
        GROUP BY severity
      `),
      prisma.$queryRaw<Array<{ status: DelhiReportCard["status"]; count: bigint }>>(Prisma.sql`
        SELECT status, COUNT(*)::bigint AS count
        FROM public.reports
        GROUP BY status
      `),
      prisma.$queryRaw<Array<{ ward_id: string; ward_label: string; count: bigint }>>(Prisma.sql`
        SELECT
          w.id::text AS ward_id,
          CONCAT('Ward ', w.ward_number, ' - ', w.ward_name) AS ward_label,
          COUNT(r.id)::bigint AS count
        FROM public.wards w
        JOIN public.reports r ON r.ward_id = w.id
        WHERE r.status <> 'resolved'::report_status
        GROUP BY w.id, w.ward_number, w.ward_name
        ORDER BY COUNT(r.id) DESC, w.ward_number ASC
        LIMIT 8
      `),
    ]);

  return {
    totalReports: Number(totalRows[0]?.count ?? 0),
    activeReports: Number(activeRows[0]?.count ?? 0),
    resolvedReports: Number(resolvedRows[0]?.count ?? 0),
    criticalReports: Number(criticalRows[0]?.count ?? 0),
    severityDistribution: delhiSeverities.map((severity) => ({
      severity,
      count: Number(severityRows.find((row) => row.severity === severity)?.count ?? 0),
    })),
    statusDistribution: delhiStatuses.map((status) => ({
      status,
      count: Number(statusRows.find((row) => row.status === status)?.count ?? 0),
    })),
    topWards: topWardRows.map((row) => ({
      wardId: row.ward_id,
      wardLabel: row.ward_label,
      count: Number(row.count),
    })),
  };
}

export async function getDelhiHomeData(filters: DelhiFilters): Promise<DelhiHomeData> {
  const health = await healthCheckDb();

  try {
    const [reports, stats, authorities] = await Promise.all([
      listReportCards(filters),
      getStats(),
      listAuthorities(),
    ]);

    return {
      reports,
      stats,
      authorities,
      warnings: health.warnings ?? [],
    };
  } catch (error) {
    return {
      reports: [],
      stats: emptyStats,
      authorities: [],
      warnings: buildSetupWarnings(error, health.warnings ?? []),
    };
  }
}

export async function getDelhiReportById(id: string) {
  const rows = await prisma.$queryRaw<ReportCardRow[]>(Prisma.sql`
    SELECT *
    FROM public.report_cards
    WHERE id = ${id}::uuid OR public_id = ${id}
    LIMIT 1
  `);

  return rows[0] ? mapReportCard(rows[0]) : null;
}

export async function lookupDelhiJurisdictionsByPoint(
  lat: number,
  lng: number,
): Promise<DelhiJurisdictionLookup> {
  const rows = await prisma.$queryRaw<
    Array<{
      authority_id: string | null;
      authority_slug: string | null;
      authority_name: string | null;
      authority_type: string | null;
      ward_id: string | null;
      ward_number: string | null;
      ward_name: string | null;
      zone_name: string | null;
      assembly_constituency_id: string | null;
      assembly_constituency_name: string | null;
      assembly_constituency_code: string | null;
      parliamentary_constituency_id: string | null;
      parliamentary_constituency_name: string | null;
      parliamentary_constituency_code: string | null;
      mla_leader_id: string | null;
      mla_name: string | null;
      mla_party_name: string | null;
      mla_party_short_name: string | null;
      mla_party_logo_url: string | null;
      mla_contact_phone: string | null;
      mla_contact_email: string | null;
      mla_official_url: string | null;
      mp_leader_id: string | null;
      mp_name: string | null;
      mp_party_name: string | null;
      mp_party_short_name: string | null;
      mp_party_logo_url: string | null;
      mp_contact_phone: string | null;
      mp_contact_email: string | null;
      mp_official_url: string | null;
    }>
  >(Prisma.sql`
    WITH lookup AS (
      SELECT *
      FROM public.lookup_delhi_jurisdictions_by_point(${lat}, ${lng})
    )
    SELECT
      ca.id::text AS authority_id,
      ca.slug AS authority_slug,
      ca.name AS authority_name,
      ca.type AS authority_type,
      w.id::text AS ward_id,
      w.ward_number,
      w.ward_name,
      w.zone_name,
      ac.id::text AS assembly_constituency_id,
      ac.name AS assembly_constituency_name,
      ac.code AS assembly_constituency_code,
      pc.id::text AS parliamentary_constituency_id,
      pc.name AS parliamentary_constituency_name,
      pc.code AS parliamentary_constituency_code,
      mla.id::text AS mla_leader_id,
      mla.full_name AS mla_name,
      mla_party.name AS mla_party_name,
      mla_party.short_name AS mla_party_short_name,
      mla_party.logo_url AS mla_party_logo_url,
      mla.contact_phone AS mla_contact_phone,
      mla.contact_email AS mla_contact_email,
      mla.official_url AS mla_official_url,
      mp.id::text AS mp_leader_id,
      mp.full_name AS mp_name,
      mp_party.name AS mp_party_name,
      mp_party.short_name AS mp_party_short_name,
      mp_party.logo_url AS mp_party_logo_url,
      mp.contact_phone AS mp_contact_phone,
      mp.contact_email AS mp_contact_email,
      mp.official_url AS mp_official_url
    FROM lookup l
    LEFT JOIN public.civic_authorities ca ON ca.id = l.authority_id
    LEFT JOIN public.wards w ON w.id = l.ward_id
    LEFT JOIN public.assembly_constituencies ac ON ac.id = l.assembly_constituency_id
    LEFT JOIN public.parliamentary_constituencies pc ON pc.id = l.parliamentary_constituency_id
    LEFT JOIN public.leaders mla ON mla.id = l.mla_leader_id
    LEFT JOIN public.parties mla_party ON mla_party.id = mla.party_id
    LEFT JOIN public.leaders mp ON mp.id = l.mp_leader_id
    LEFT JOIN public.parties mp_party ON mp_party.id = mp.party_id
    LIMIT 1
  `);

  const row = rows[0];

  if (!row) {
    return {
      authority: null,
      ward: null,
      assembly: null,
      parliament: null,
      mla: null,
      mp: null,
      warnings: ["No Delhi jurisdiction matched this point."],
    };
  }

  return {
    authority: row.authority_id
      ? {
          id: row.authority_id,
          slug: row.authority_slug ?? "",
          name: row.authority_name ?? "Unknown authority",
          type: row.authority_type ?? "unknown",
        }
      : null,
    ward: row.ward_id
      ? {
          id: row.ward_id,
          number: row.ward_number,
          name: row.ward_name,
          zone: row.zone_name,
        }
      : null,
    assembly: {
      id: row.assembly_constituency_id,
      name: row.assembly_constituency_name,
      code: row.assembly_constituency_code,
    },
    parliament: {
      id: row.parliamentary_constituency_id,
      name: row.parliamentary_constituency_name,
      code: row.parliamentary_constituency_code,
    },
    mla: row.mla_leader_id
      ? {
          id: row.mla_leader_id,
          name: row.mla_name ?? "Unknown MLA",
          partyName: row.mla_party_name,
          partyShortName: row.mla_party_short_name,
          partyLogoUrl: row.mla_party_logo_url,
          contactPhone: row.mla_contact_phone,
          contactEmail: row.mla_contact_email,
          officialUrl: row.mla_official_url,
        }
      : null,
    mp: row.mp_leader_id
      ? {
          id: row.mp_leader_id,
          name: row.mp_name ?? "Unknown MP",
          partyName: row.mp_party_name,
          partyShortName: row.mp_party_short_name,
          partyLogoUrl: row.mp_party_logo_url,
          contactPhone: row.mp_contact_phone,
          contactEmail: row.mp_contact_email,
          officialUrl: row.mp_official_url,
        }
      : null,
    warnings: [],
  };
}

export async function confirmDelhiReport(reportId: string, sessionFingerprint: string, ipAddress: string | null) {
  const ipHash = ipAddress ? sha256(ipAddress) : null;

  const rows = await prisma.$queryRaw<Array<{ reporter_count: number; inserted_count: number }>>(Prisma.sql`
    WITH inserted AS (
      INSERT INTO public.confirmations (report_id, session_fingerprint, ip_hash)
      VALUES (${reportId}::uuid, ${sessionFingerprint}, ${ipHash})
      ON CONFLICT DO NOTHING
      RETURNING 1
    ),
    updated AS (
      UPDATE public.reports
      SET reporter_count = reporter_count + (SELECT COUNT(*)::integer FROM inserted)
      WHERE id = ${reportId}::uuid
      RETURNING reporter_count
    )
    SELECT
      COALESCE((SELECT reporter_count FROM updated), 0) AS reporter_count,
      (SELECT COUNT(*)::integer FROM inserted) AS inserted_count
  `);

  const row = rows[0];

  if (!row || row.reporter_count === 0) {
    throw new Error("Report not found.");
  }

  return {
    reporterCount: Number(row.reporter_count),
    confirmed: Number(row.inserted_count) > 0,
  };
}

export async function createDelhiReport(input: CreateDelhiReportInput) {
  const rows = await prisma.$queryRaw<Array<{ id: string; public_id: string }>>(Prisma.sql`
    WITH lookup AS (
      SELECT *
      FROM public.lookup_delhi_jurisdictions_by_point(${input.latitude}, ${input.longitude})
    ),
    inserted AS (
      INSERT INTO public.reports (
        title,
        description,
        address_text,
        landmark,
        latitude,
        longitude,
        authority_id,
        ward_id,
        assembly_constituency_id,
        parliamentary_constituency_id,
        mla_leader_id,
        mp_leader_id,
        severity,
        waste_type,
        status,
        photo_url,
        thumbnail_url,
        reporter_count
      )
      SELECT
        ${input.title},
        ${input.description},
        ${input.addressText},
        ${input.landmark},
        ${input.latitude},
        ${input.longitude},
        authority_id,
        ward_id,
        assembly_constituency_id,
        parliamentary_constituency_id,
        mla_leader_id,
        mp_leader_id,
        ${input.severity}::report_severity,
        ${input.wasteType}::waste_type,
        'unresolved'::report_status,
        ${input.photoUrl},
        ${input.thumbnailUrl},
        1
      FROM lookup
      RETURNING id, public_id
    ),
    history AS (
      INSERT INTO public.report_status_history (report_id, from_status, to_status, note)
      SELECT id, NULL, 'unresolved'::report_status, 'Anonymous citizen report submitted.'
      FROM inserted
      RETURNING id
    )
    SELECT id::text, public_id
    FROM inserted
  `);

  const row = rows[0];

  if (!row) {
    throw new Error("Could not create report. The point may be outside configured Delhi jurisdiction boundaries.");
  }

  return row;
}

export async function getDelhiAuthorityById(id: string): Promise<DelhiAuthorityDetail | null> {
  const rows = await prisma.$queryRaw<Array<DelhiAuthorityDetail>>(Prisma.sql`
    SELECT id::text, slug, name, type, description
    FROM public.civic_authorities
    WHERE id::text = ${id} OR slug = ${id}
    LIMIT 1
  `);

  return rows[0] ?? null;
}

export async function getDelhiWardById(id: string): Promise<DelhiWardDetail | null> {
  const rows = await prisma.$queryRaw<
    Array<{
      id: string;
      number: string;
      name: string;
      zone: string | null;
      authority_id: string | null;
      authority_slug: string | null;
      authority_name: string | null;
      authority_type: string | null;
      authority_description: string | null;
    }>
  >(Prisma.sql`
    SELECT
      w.id::text,
      w.ward_number AS number,
      w.ward_name AS name,
      w.zone_name AS zone,
      ca.id::text AS authority_id,
      ca.slug AS authority_slug,
      ca.name AS authority_name,
      ca.type AS authority_type,
      ca.description AS authority_description
    FROM public.wards w
    LEFT JOIN public.civic_authorities ca ON ca.id = w.authority_id
    WHERE w.id::text = ${id} OR w.ward_number = ${id}
    LIMIT 1
  `);

  const row = rows[0];

  if (!row) {
    return null;
  }

  return {
    id: row.id,
    number: row.number,
    name: row.name,
    zone: row.zone,
    authority: row.authority_id
      ? {
          id: row.authority_id,
          slug: row.authority_slug ?? "",
          name: row.authority_name ?? "Unknown authority",
          type: row.authority_type ?? "unknown",
          description: row.authority_description,
        }
      : null,
  };
}

export async function getDelhiLeaderById(id: string, role: "mla" | "mp"): Promise<DelhiLeaderDetail | null> {
  const rows = await prisma.$queryRaw<
    Array<{
      id: string;
      role: DelhiLeaderDetail["role"];
      name: string;
      party_name: string | null;
      party_short_name: string | null;
      party_logo_url: string | null;
      contact_phone: string | null;
      contact_email: string | null;
      official_url: string | null;
      constituency_id: string | null;
      constituency_name: string | null;
    }>
  >(Prisma.sql`
    SELECT
      l.id::text,
      l.role,
      l.full_name AS name,
      p.name AS party_name,
      p.short_name AS party_short_name,
      p.logo_url AS party_logo_url,
      l.contact_phone,
      l.contact_email,
      l.official_url,
      CASE
        WHEN l.role = 'mla'::leader_role THEN ac.id::text
        WHEN l.role = 'mp'::leader_role THEN pc.id::text
        ELSE NULL
      END AS constituency_id,
      CASE
        WHEN l.role = 'mla'::leader_role THEN ac.name
        WHEN l.role = 'mp'::leader_role THEN pc.name
        ELSE NULL
      END AS constituency_name
    FROM public.leaders l
    LEFT JOIN public.parties p ON p.id = l.party_id
    LEFT JOIN public.mla_assignments ma
      ON ma.leader_id = l.id
      AND (ma.end_date IS NULL OR ma.end_date >= CURRENT_DATE)
    LEFT JOIN public.assembly_constituencies ac ON ac.id = ma.assembly_constituency_id
    LEFT JOIN public.mp_assignments mpa
      ON mpa.leader_id = l.id
      AND (mpa.end_date IS NULL OR mpa.end_date >= CURRENT_DATE)
    LEFT JOIN public.parliamentary_constituencies pc ON pc.id = mpa.parliamentary_constituency_id
    WHERE l.id::text = ${id} AND l.role = ${role}::leader_role
    ORDER BY ma.start_date DESC NULLS LAST, mpa.start_date DESC NULLS LAST
    LIMIT 1
  `);

  const row = rows[0];

  if (!row) {
    return null;
  }

  return {
    id: row.id,
    role: row.role,
    name: row.name,
    partyName: row.party_name,
    partyShortName: row.party_short_name,
    partyLogoUrl: row.party_logo_url,
    contactPhone: row.contact_phone,
    contactEmail: row.contact_email,
    officialUrl: row.official_url,
    constituencyId: row.constituency_id,
    constituencyName: row.constituency_name,
  };
}
