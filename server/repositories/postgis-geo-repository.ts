import { Prisma } from "@prisma/client";
import type { Feature, MultiPolygon } from "geojson";

import { prisma } from "@/lib/db/prisma";
import type { ConstituencyRecord, District, OdishaBoundaryRecord } from "@/types/domain";

import type { GeoRepository } from "./geo-repository";

type SpatialRow = {
  id: string;
  code?: string | null;
  name: string;
  district_name?: string | null;
  metadata_json?: Record<string, unknown> | null;
  geometry: Feature<MultiPolygon> | string;
  created_at?: Date | string;
  updated_at?: Date | string;
};

function parseGeometry(geometry: Feature<MultiPolygon> | string): Feature<MultiPolygon> {
  return typeof geometry === "string" ? (JSON.parse(geometry) as Feature<MultiPolygon>) : geometry;
}

function mapConstituencyRow(row: SpatialRow): ConstituencyRecord {
  const createdAt =
    row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at ?? new Date().toISOString();
  const updatedAt =
    row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at ?? new Date().toISOString();

  return {
    id: row.id,
    code: row.code ?? "",
    name: row.name,
    districtName: row.district_name ?? null,
    geometry: parseGeometry(row.geometry),
    metadataJson: (row.metadata_json as Record<string, unknown> | null) ?? {},
    createdAt,
    updatedAt,
  };
}

function mapDistrictRow(row: SpatialRow): District {
  return {
    id: row.id,
    code: row.code ?? "",
    name: row.name,
    geometry: parseGeometry(row.geometry),
    createdAt:
      row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at ?? new Date().toISOString(),
    updatedAt:
      row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at ?? new Date().toISOString(),
  };
}

function mapBoundaryRow(row: SpatialRow): OdishaBoundaryRecord {
  return {
    id: row.id,
    name: row.name,
    geometry: parseGeometry(row.geometry),
  };
}

async function runConstituencySpatialQuery(tableName: string, lat: number, lng: number) {
  const pointSql = Prisma.sql`ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)`;

  return prisma.$queryRaw<SpatialRow[]>(Prisma.sql`
    SELECT
      id,
      code,
      name,
      district_name,
      metadata_json,
      ST_AsGeoJSON(geometry)::json AS geometry,
      created_at,
      updated_at
    FROM ${Prisma.raw(`"${tableName}"`)}
    WHERE ST_Covers(geometry, ${pointSql})
  `);
}

export class PostgisGeoRepository implements GeoRepository {
  async findOdishaBoundaryContainingPoint(lat: number, lng: number): Promise<OdishaBoundaryRecord[]> {
    const pointSql = Prisma.sql`ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)`;
    const rows = await prisma.$queryRaw<SpatialRow[]>(Prisma.sql`
      SELECT id, name, ST_AsGeoJSON(geometry)::json AS geometry
      FROM "odisha_boundary"
      WHERE ST_Covers(geometry, ${pointSql})
    `);

    return rows.map(mapBoundaryRow);
  }

  async findDistrictsByPoint(lat: number, lng: number): Promise<District[]> {
    const pointSql = Prisma.sql`ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)`;
    const rows = await prisma.$queryRaw<SpatialRow[]>(Prisma.sql`
      SELECT
        id,
        code,
        name,
        ST_AsGeoJSON(geometry)::json AS geometry,
        created_at,
        updated_at
      FROM "districts"
      WHERE ST_Covers(geometry, ${pointSql})
    `);
    return rows.map(mapDistrictRow);
  }

  async findAssemblyConstituenciesByPoint(lat: number, lng: number): Promise<ConstituencyRecord[]> {
    const rows = await runConstituencySpatialQuery("assembly_constituencies", lat, lng);
    return rows.map(mapConstituencyRow);
  }

  async findParliamentConstituenciesByPoint(
    lat: number,
    lng: number,
  ): Promise<ConstituencyRecord[]> {
    const rows = await runConstituencySpatialQuery("parliament_constituencies", lat, lng);
    return rows.map(mapConstituencyRow);
  }
}
