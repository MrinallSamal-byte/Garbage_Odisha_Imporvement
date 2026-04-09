import { readFile } from "fs/promises";
import path from "path";

import { PrismaClient } from "@prisma/client";
import type { Feature, FeatureCollection, MultiPolygon } from "geojson";

import { env } from "@/lib/env";
import representativesJson from "@/data/mock/representatives.json";
import { resetMockState } from "@/lib/mock/runtime-store";

type NamedFeature = Feature<MultiPolygon, Record<string, unknown>>;

const prisma = new PrismaClient();

function resolveInputPath(cliPath: string | undefined, fallbackPath: string) {
  return cliPath ? path.resolve(process.cwd(), cliPath) : path.resolve(process.cwd(), fallbackPath);
}

async function readGeoJson(filePath: string) {
  const contents = await readFile(filePath, "utf8");
  return JSON.parse(contents) as FeatureCollection<MultiPolygon, Record<string, unknown>>;
}

export async function seedMockRuntime() {
  const state = await resetMockState();
  console.log(`Mock state reset with ${state.reports.length} reports and ${state.representatives.length} representatives.`);
}

export async function importOdishaBoundaryFromFile(cliPath?: string) {
  const filePath = resolveInputPath(cliPath, "data/mock/odisha-boundary.geojson");
  const collection = await readGeoJson(filePath);
  const boundary = collection.features[0];

  if (!boundary?.properties?.id || !boundary.properties.name) {
    throw new Error("Boundary GeoJSON must include properties.id and properties.name.");
  }

  if (env.APP_MODE === "mock") {
    console.log(`Validated mock boundary file at ${filePath}. Switch APP_MODE=real to load PostGIS.`);
    return;
  }

  await prisma.$executeRawUnsafe(
    `
      INSERT INTO "odisha_boundary" ("id", "name", "geometry")
      VALUES ($1, $2, ST_SetSRID(ST_GeomFromGeoJSON($3), 4326))
      ON CONFLICT ("id")
      DO UPDATE SET "name" = EXCLUDED."name", "geometry" = EXCLUDED."geometry"
    `,
    String(boundary.properties.id),
    String(boundary.properties.name),
    JSON.stringify(boundary.geometry),
  );

  console.log(`Imported Odisha boundary from ${filePath}.`);
}

async function importConstituencyCollection(
  filePath: string,
  tableName: "assembly_constituencies" | "parliament_constituencies",
) {
  const collection = await readGeoJson(filePath);

  for (const feature of collection.features) {
    const props = feature.properties ?? {};
    if (!props.id || !props.code || !props.name) {
      throw new Error(`${tableName} import requires each feature to include id, code, and name.`);
    }

    await prisma.$executeRawUnsafe(
      `
        INSERT INTO "${tableName}" (
          "id",
          "code",
          "name",
          "district_name",
          "geometry",
          "metadata_json",
          "created_at",
          "updated_at"
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          ST_SetSRID(ST_GeomFromGeoJSON($5), 4326),
          $6::jsonb,
          NOW(),
          NOW()
        )
        ON CONFLICT ("id")
        DO UPDATE SET
          "code" = EXCLUDED."code",
          "name" = EXCLUDED."name",
          "district_name" = EXCLUDED."district_name",
          "geometry" = EXCLUDED."geometry",
          "metadata_json" = EXCLUDED."metadata_json",
          "updated_at" = NOW()
      `,
      String(props.id),
      String(props.code),
      String(props.name),
      props.district_name ? String(props.district_name) : null,
      JSON.stringify(feature.geometry),
      JSON.stringify(props),
    );
  }
}

export async function importAssemblyFromFile(cliPath?: string) {
  const filePath = resolveInputPath(cliPath, "data/mock/assembly-constituencies.geojson");

  if (env.APP_MODE === "mock") {
    await readGeoJson(filePath);
    console.log(`Validated mock assembly GeoJSON at ${filePath}. Switch APP_MODE=real to load PostGIS.`);
    return;
  }

  await importConstituencyCollection(filePath, "assembly_constituencies");
  console.log(`Imported assembly constituencies from ${filePath}.`);
}

export async function importParliamentFromFile(cliPath?: string) {
  const filePath = resolveInputPath(cliPath, "data/mock/parliament-constituencies.geojson");

  if (env.APP_MODE === "mock") {
    await readGeoJson(filePath);
    console.log(`Validated mock parliament GeoJSON at ${filePath}. Switch APP_MODE=real to load PostGIS.`);
    return;
  }

  await importConstituencyCollection(filePath, "parliament_constituencies");
  console.log(`Imported parliament constituencies from ${filePath}.`);
}

export async function importDistrictsFromFile(cliPath?: string) {
  const filePath = resolveInputPath(cliPath, "data/mock/districts.geojson");
  const collection = await readGeoJson(filePath);

  if (env.APP_MODE === "mock") {
    console.log(`Validated mock district GeoJSON at ${filePath}. Switch APP_MODE=real to load PostGIS.`);
    return;
  }

  for (const feature of collection.features as NamedFeature[]) {
    const props = feature.properties ?? {};
    if (!props.id || !props.code || !props.name) {
      throw new Error("District import requires each feature to include id, code, and name.");
    }

    await prisma.$executeRawUnsafe(
      `
        INSERT INTO "districts" ("id", "name", "code", "geometry", "created_at", "updated_at")
        VALUES ($1, $2, $3, ST_SetSRID(ST_GeomFromGeoJSON($4), 4326), NOW(), NOW())
        ON CONFLICT ("id")
        DO UPDATE SET "name" = EXCLUDED."name", "code" = EXCLUDED."code", "geometry" = EXCLUDED."geometry", "updated_at" = NOW()
      `,
      String(props.id),
      String(props.name),
      String(props.code),
      JSON.stringify(feature.geometry),
    );
  }

  console.log(`Imported districts from ${filePath}.`);
}

export async function seedRepresentativeRecords() {
  if (env.APP_MODE === "mock") {
    const state = await resetMockState();
    console.log(`Mock representative seed refreshed with ${state.representatives.length} records.`);
    return;
  }

  await prisma.user.upsert({
    where: { email: env.ADMIN_EMAIL },
    create: {
      name: "SafaOdisha Admin",
      email: env.ADMIN_EMAIL,
      role: "ADMIN",
      isActive: true,
    },
    update: {
      name: "SafaOdisha Admin",
      role: "ADMIN",
      isActive: true,
    },
  });

  for (const party of [
    {
      name: "Biju Janata Dal",
      abbreviation: "BJD",
      levelScope: "STATE",
      isStateRulingPartyDefault: true,
      isCentralRulingPartyDefault: false,
    },
    {
      name: "Bharatiya Janata Party",
      abbreviation: "BJP",
      levelScope: "BOTH",
      isStateRulingPartyDefault: false,
      isCentralRulingPartyDefault: true,
    },
    {
      name: "Indian National Congress",
      abbreviation: "INC",
      levelScope: "NATIONAL",
      isStateRulingPartyDefault: false,
      isCentralRulingPartyDefault: false,
    },
  ] as const) {
    await prisma.party.upsert({
      where: { name: party.name },
      create: {
        ...party,
        active: true,
      },
      update: {
        ...party,
        active: true,
      },
    });
  }

  for (const representative of representativesJson) {
    await prisma.representative.upsert({
      where: { id: representative.id },
      create: {
        id: representative.id,
        representativeType: representative.representativeType as "MLA" | "MP",
        name: representative.name,
        constituencyType: representative.constituencyType as "ASSEMBLY" | "PARLIAMENT",
        assemblyConstituencyId: representative.assemblyConstituencyId,
        parliamentConstituencyId: representative.parliamentConstituencyId,
        partyName: representative.partyName,
        isStateRulingParty: representative.isStateRulingParty,
        isCentralRulingParty: representative.isCentralRulingParty,
        oppositionLabel: representative.oppositionLabel,
        photoUrl: representative.photoUrl,
        officialRoleTitle: representative.officialRoleTitle,
        contactEmail: representative.contactEmail,
        contactPhone: representative.contactPhone,
        websiteUrl: representative.websiteUrl,
        socialLinksJson: representative.socialLinksJson ?? undefined,
        termStart: representative.termStart ? new Date(representative.termStart) : null,
        termEnd: representative.termEnd ? new Date(representative.termEnd) : null,
        active: representative.active,
        lastVerifiedAt: representative.lastVerifiedAt ? new Date(representative.lastVerifiedAt) : null,
      },
      update: {
        representativeType: representative.representativeType as "MLA" | "MP",
        name: representative.name,
        constituencyType: representative.constituencyType as "ASSEMBLY" | "PARLIAMENT",
        assemblyConstituencyId: representative.assemblyConstituencyId,
        parliamentConstituencyId: representative.parliamentConstituencyId,
        partyName: representative.partyName,
        isStateRulingParty: representative.isStateRulingParty,
        isCentralRulingParty: representative.isCentralRulingParty,
        oppositionLabel: representative.oppositionLabel,
        photoUrl: representative.photoUrl,
        officialRoleTitle: representative.officialRoleTitle,
        contactEmail: representative.contactEmail,
        contactPhone: representative.contactPhone,
        websiteUrl: representative.websiteUrl,
        socialLinksJson: representative.socialLinksJson ?? undefined,
        termStart: representative.termStart ? new Date(representative.termStart) : null,
        termEnd: representative.termEnd ? new Date(representative.termEnd) : null,
        active: representative.active,
        lastVerifiedAt: representative.lastVerifiedAt ? new Date(representative.lastVerifiedAt) : null,
      },
    });
  }

  console.log(`Seeded ${representativesJson.length} representative records.`);
}

export async function disconnectImporter() {
  await prisma.$disconnect();
}
