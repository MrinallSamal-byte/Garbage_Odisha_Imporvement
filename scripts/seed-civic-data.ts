import { readFile } from "node:fs/promises";
import path from "node:path";

import { Prisma } from "@prisma/client";

import { prisma } from "../lib/db/prisma";

type GeoJsonCollection = {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    properties: Record<string, string | number | null>;
    geometry: {
      type: "MultiPolygon";
      coordinates: number[][][][][];
    };
  }>;
};

type SeedReport = {
  id: string;
  title: string;
  address: string;
  landmark: string | null;
  lat: number;
  lng: number;
  severity: "minor" | "moderate" | "severe" | "critical";
  status: "unresolved" | "in_progress" | "resolved";
  reporter_count: number;
  photo_url: string;
  verification_photo_url: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
};

async function readJsonFile<T>(fileName: string): Promise<T> {
  const absolutePath = path.join(process.cwd(), "data", "civic", fileName);
  const raw = await readFile(absolutePath, "utf8");
  return JSON.parse(raw) as T;
}

async function upsertWardCollection(collection: GeoJsonCollection) {
  for (const feature of collection.features) {
    const properties = feature.properties;

    await prisma.$executeRaw(
      Prisma.sql`
        INSERT INTO public.wards (id, number, name, zone, boundary_geojson)
        VALUES (
          ${String(properties.id)}::uuid,
          ${Number(properties.number)},
          ${String(properties.name)},
          ${String(properties.zone)},
          ${JSON.stringify(feature.geometry)}::jsonb
        )
        ON CONFLICT (id) DO UPDATE
        SET
          number = EXCLUDED.number,
          name = EXCLUDED.name,
          zone = EXCLUDED.zone,
          boundary_geojson = EXCLUDED.boundary_geojson
      `,
    );
  }
}

async function upsertOfficials(tableName: "mlas" | "mps", collection: GeoJsonCollection) {
  for (const feature of collection.features) {
    const properties = feature.properties;

    await prisma.$executeRaw(
      Prisma.sql`
        INSERT INTO public.${Prisma.raw(tableName)} (
          id,
          name,
          party,
          party_logo_url,
          constituency_name,
          contact_email,
          contact_phone,
          profile_url,
          boundary_geojson
        )
        VALUES (
          ${String(properties.id)}::uuid,
          ${String(properties.name)},
          ${String(properties.party)},
          ${String(properties.party_logo_url)},
          ${String(properties.constituency_name)},
          ${properties.contact_email ? String(properties.contact_email) : null},
          ${properties.contact_phone ? String(properties.contact_phone) : null},
          ${properties.profile_url ? String(properties.profile_url) : null},
          ${JSON.stringify(feature.geometry)}::jsonb
        )
        ON CONFLICT (id) DO UPDATE
        SET
          name = EXCLUDED.name,
          party = EXCLUDED.party,
          party_logo_url = EXCLUDED.party_logo_url,
          constituency_name = EXCLUDED.constituency_name,
          contact_email = EXCLUDED.contact_email,
          contact_phone = EXCLUDED.contact_phone,
          profile_url = EXCLUDED.profile_url,
          boundary_geojson = EXCLUDED.boundary_geojson
      `,
    );
  }
}

async function seedReports(reports: SeedReport[]) {
  const wasteTypeRows = await prisma.$queryRaw<Array<{ id: string; key: string }>>(
    Prisma.sql`SELECT id::text AS id, key FROM public.waste_types`,
  );

  const wasteTypeByKey = new Map(wasteTypeRows.map((row) => [row.key, row.id]));

  for (const [index, report] of reports.entries()) {
    const wasteTypeKey = index === 2 ? "mixed" : index === 3 ? "construction_debris" : "household";
    const wasteTypeId = wasteTypeByKey.get(wasteTypeKey);

    if (!wasteTypeId) {
      throw new Error(`Missing waste type for ${wasteTypeKey}`);
    }

    const lookup = await prisma.$queryRaw<
      Array<{ ward_id: string | null; mla_id: string | null; mp_id: string | null }>
    >(
      Prisma.sql`SELECT ward_id::text, mla_id::text, mp_id::text FROM public.lookup_civic_boundaries(${report.lat}, ${report.lng})`,
    );

    const match = lookup[0];
    if (!match?.ward_id || !match.mla_id || !match.mp_id) {
      throw new Error(`Could not resolve ward / MLA / MP for seed report ${report.id}`);
    }

    await prisma.$executeRaw(
      Prisma.sql`
        INSERT INTO public.reports (
          id,
          reporter_id,
          ward_id,
          mla_id,
          mp_id,
          waste_type_id,
          title,
          address,
          landmark,
          photo_url,
          verification_photo_url,
          lat,
          lng,
          severity,
          status,
          reporter_count,
          created_at,
          updated_at,
          resolved_at
        )
        VALUES (
          ${report.id}::uuid,
          NULL,
          ${match.ward_id}::uuid,
          ${match.mla_id}::uuid,
          ${match.mp_id}::uuid,
          ${wasteTypeId}::uuid,
          ${report.title},
          ${report.address},
          ${report.landmark},
          ${report.photo_url},
          ${report.verification_photo_url},
          ${report.lat},
          ${report.lng},
          ${report.severity}::report_severity,
          ${report.status}::report_status,
          ${report.reporter_count},
          ${report.created_at}::timestamptz,
          ${report.updated_at}::timestamptz,
          ${report.resolved_at ? Prisma.sql`${report.resolved_at}::timestamptz` : Prisma.sql`NULL`}
        )
        ON CONFLICT (id) DO UPDATE
        SET
          ward_id = EXCLUDED.ward_id,
          mla_id = EXCLUDED.mla_id,
          mp_id = EXCLUDED.mp_id,
          waste_type_id = EXCLUDED.waste_type_id,
          title = EXCLUDED.title,
          address = EXCLUDED.address,
          landmark = EXCLUDED.landmark,
          photo_url = EXCLUDED.photo_url,
          verification_photo_url = EXCLUDED.verification_photo_url,
          lat = EXCLUDED.lat,
          lng = EXCLUDED.lng,
          severity = EXCLUDED.severity,
          status = EXCLUDED.status,
          reporter_count = EXCLUDED.reporter_count,
          created_at = EXCLUDED.created_at,
          updated_at = EXCLUDED.updated_at,
          resolved_at = EXCLUDED.resolved_at
      `,
    );
  }
}

async function main() {
  const [wards, mlas, mps, reports] = await Promise.all([
    readJsonFile<GeoJsonCollection>("wards.geojson"),
    readJsonFile<GeoJsonCollection>("mlas.geojson"),
    readJsonFile<GeoJsonCollection>("mps.geojson"),
    readJsonFile<SeedReport[]>("reports.json"),
  ]);

  await upsertWardCollection(wards);
  await upsertOfficials("mlas", mlas);
  await upsertOfficials("mps", mps);
  await seedReports(reports);

  console.log("Civic reporting data seeded.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
