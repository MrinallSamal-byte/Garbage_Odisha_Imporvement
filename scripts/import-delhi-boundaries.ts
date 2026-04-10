import { Prisma } from "@prisma/client";

import { prisma } from "../lib/db/prisma";

const DELHI_WARDS_URL =
  "https://raw.githubusercontent.com/datameet/Municipal_Spatial_Data/master/Delhi/Delhi_Wards.geojson";
const DELHI_ASSEMBLY_URL =
  "https://bharatnetprogress.nic.in/nicclouddb/rest/services/NCR/NCR_Geo_Portal_23_01_2025/MapServer/24/query?where=ST_NAME%3D%27DELHI%27&outFields=ST_NAME%2CAC_NO%2CAC_NAME%2CPC_NO%2CPC_NAME%2CAC_ID%2CDT_CODE%2CDIST_NAME&returnGeometry=true&f=geojson";
const DELHI_PARLIAMENT_URL =
  "https://bharatnetprogress.nic.in/nicclouddb/rest/services/NCR/NCR_Geo_Portal_23_01_2025/MapServer/23/query?where=ST_NAME%3D%27DELHI%27%20AND%20PC_NO%20IN%20(1%2C2%2C3%2C4%2C5%2C6%2C7)&outFields=ST_NAME%2CPC_NO%2CPC_NAME%2CPC_ID&returnGeometry=true&f=geojson";

type GeoJsonCollection = {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    properties: Record<string, string | number | null>;
    geometry: {
      type: "Polygon" | "MultiPolygon";
      coordinates: number[][][][] | number[][][][][];
    };
  }>;
};

const authoritySeed = [
  {
    slug: "mcd",
    name: "Municipal Corporation of Delhi",
    type: "municipal_corporation",
    description: "Primary municipal corporation handling most ward-level civic sanitation complaints in Delhi.",
  },
  {
    slug: "ndmc",
    name: "New Delhi Municipal Council",
    type: "municipal_council",
    description: "Special civic authority for the NDMC area in central New Delhi.",
  },
  {
    slug: "delhi-cantonment-board",
    name: "Delhi Cantonment Board",
    type: "cantonment_board",
    description: "Civic authority for the Delhi Cantonment area.",
  },
] as const;

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }

  return (await response.json()) as T;
}

function inferAuthoritySlug(wardNumber: string) {
  if (wardNumber.startsWith("NDMC_")) {
    return "ndmc";
  }

  if (wardNumber.startsWith("CANT_")) {
    return "delhi-cantonment-board";
  }

  return "mcd";
}

function normalizeMultiPolygonGeometry(geometry: GeoJsonCollection["features"][number]["geometry"]) {
  if (geometry.type === "MultiPolygon") {
    return geometry;
  }

  return {
    type: "MultiPolygon" as const,
    coordinates: [geometry.coordinates as number[][][][]],
  };
}

async function upsertAuthorities() {
  for (const authority of authoritySeed) {
    await prisma.$executeRaw(
      Prisma.sql`
        INSERT INTO public.civic_authorities (slug, name, type, description)
        VALUES (${authority.slug}, ${authority.name}, ${authority.type}, ${authority.description})
        ON CONFLICT (slug) DO UPDATE
        SET
          name = EXCLUDED.name,
          type = EXCLUDED.type,
          description = EXCLUDED.description
      `,
    );
  }
}

async function importWards(collection: GeoJsonCollection) {
  const authorities = await prisma.$queryRaw<Array<{ id: string; slug: string }>>(
    Prisma.sql`SELECT id::text, slug FROM public.civic_authorities`,
  );
  const authorityIdBySlug = new Map(authorities.map((row) => [row.slug, row.id]));

  for (const feature of collection.features) {
    const wardNumber = String(feature.properties.Ward_No ?? "");
    const wardName = String(feature.properties.Ward_Name ?? wardNumber);
    const authorityId = authorityIdBySlug.get(inferAuthoritySlug(wardNumber));

    if (!authorityId) {
      throw new Error(`Missing authority mapping for ward ${wardNumber}`);
    }

    await prisma.$executeRaw(
      Prisma.sql`
        INSERT INTO public.wards (
          authority_id,
          ward_number,
          ward_name,
          zone_name,
          boundary_geojson
        )
        VALUES (
          ${authorityId}::uuid,
          ${wardNumber},
          ${wardName},
          NULL,
          ${JSON.stringify(normalizeMultiPolygonGeometry(feature.geometry))}::jsonb
        )
        ON CONFLICT (authority_id, ward_number) DO UPDATE
        SET
          ward_name = EXCLUDED.ward_name,
          zone_name = EXCLUDED.zone_name,
          boundary_geojson = EXCLUDED.boundary_geojson
      `,
    );
  }
}

async function importAssemblies(collection: GeoJsonCollection) {
  for (const feature of collection.features) {
    const acNumber = Number(feature.properties.AC_NO);
    const acName = String(feature.properties.AC_NAME ?? `AC ${acNumber}`);
    const code = feature.properties.AC_ID ? String(feature.properties.AC_ID) : `AC-${acNumber}`;
    const districtName = feature.properties.DIST_NAME ? String(feature.properties.DIST_NAME) : null;

    await prisma.$executeRaw(
      Prisma.sql`
        INSERT INTO public.assembly_constituencies (name, code, district_name, boundary_geojson)
        VALUES (
          ${acName},
          ${code},
          ${districtName},
          ${JSON.stringify(normalizeMultiPolygonGeometry(feature.geometry))}::jsonb
        )
        ON CONFLICT (name) DO UPDATE
        SET
          code = EXCLUDED.code,
          district_name = EXCLUDED.district_name,
          boundary_geojson = EXCLUDED.boundary_geojson
      `,
    );
  }
}

async function importParliamentary(collection: GeoJsonCollection) {
  for (const feature of collection.features) {
    const pcNumber = Number(feature.properties.PC_NO);
    const pcName = String(feature.properties.PC_NAME ?? `PC ${pcNumber}`);
    const code = feature.properties.PC_ID ? String(feature.properties.PC_ID) : `PC-${pcNumber}`;

    await prisma.$executeRaw(
      Prisma.sql`
        INSERT INTO public.parliamentary_constituencies (name, code, boundary_geojson)
        VALUES (
          ${pcName},
          ${code},
          ${JSON.stringify(normalizeMultiPolygonGeometry(feature.geometry))}::jsonb
        )
        ON CONFLICT (name) DO UPDATE
        SET
          code = EXCLUDED.code,
          boundary_geojson = EXCLUDED.boundary_geojson
      `,
    );
  }
}

async function refreshAuthorityBoundaries() {
  await prisma.$executeRaw(
    Prisma.sql`
      UPDATE public.civic_authorities a
      SET
        geom = merged.geom,
        boundary_geojson = ST_AsGeoJSON(merged.geom)::jsonb
      FROM (
        SELECT authority_id, ST_Multi(ST_Union(geom))::geometry(MultiPolygon, 4326) AS geom
        FROM public.wards
        GROUP BY authority_id
      ) merged
      WHERE merged.authority_id = a.id
    `,
  );
}

async function main() {
  console.log("Fetching Delhi ward, assembly, and parliamentary boundaries...");

  const [wardCollection, assemblyCollection, parliamentCollection] = await Promise.all([
    fetchJson<GeoJsonCollection>(DELHI_WARDS_URL),
    fetchJson<GeoJsonCollection>(DELHI_ASSEMBLY_URL),
    fetchJson<GeoJsonCollection>(DELHI_PARLIAMENT_URL),
  ]);

  await upsertAuthorities();
  await importWards(wardCollection);
  await importAssemblies(assemblyCollection);
  await importParliamentary(parliamentCollection);
  await refreshAuthorityBoundaries();

  const wardCount = wardCollection.features.length;
  const assemblyCount = assemblyCollection.features.length;
  const parliamentCount = parliamentCollection.features.length;

  console.log(
    `Delhi boundaries imported: ${wardCount} ward-equivalents, ${assemblyCount} assembly constituencies, ${parliamentCount} parliamentary constituencies.`,
  );

  if (assemblyCount !== 70) {
    console.warn(
      `Expected 70 Delhi assembly constituencies but imported ${assemblyCount}. Review the source feed before production launch.`,
    );
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
