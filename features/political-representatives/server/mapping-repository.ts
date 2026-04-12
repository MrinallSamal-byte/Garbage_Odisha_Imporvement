import "server-only";

import { Prisma } from "@prisma/client";

import seedMapping from "@/features/political-representatives/data/bhubaneswar-political-area-mapping.seed.json";
import { prisma } from "@/lib/db/prisma";
import { env } from "@/lib/env";
import type { PoliticalAreaMapping } from "@/features/political-representatives/shared/types";

export interface PoliticalAreaMappingRepository {
  getActiveMapping(city: string, state: string): Promise<PoliticalAreaMapping | null>;
}

export class FilePoliticalAreaMappingRepository implements PoliticalAreaMappingRepository {
  async getActiveMapping(city: string, state: string) {
    const mapping = seedMapping as PoliticalAreaMapping;

    if (
      mapping.meta.city.toLowerCase() !== city.toLowerCase() ||
      mapping.meta.state.toLowerCase() !== state.toLowerCase()
    ) {
      return null;
    }

    return mapping;
  }
}

type MappingRow = {
  data_json: PoliticalAreaMapping;
};

export class PrismaPoliticalAreaMappingRepository implements PoliticalAreaMappingRepository {
  async getActiveMapping(city: string, state: string) {
    try {
      const rows = await prisma.$queryRaw<MappingRow[]>(Prisma.sql`
        SELECT data_json
        FROM public.political_area_mappings
        WHERE lower(city) = lower(${city})
          AND lower(state) = lower(${state})
          AND is_active = true
        ORDER BY updated_at DESC
        LIMIT 1
      `);

      return rows[0]?.data_json ?? null;
    } catch (error) {
      const missingMappingTable =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2010" &&
        typeof error.meta?.code === "string" &&
        error.meta.code === "42P01";

      if (missingMappingTable && process.env.NODE_ENV !== "production") {
        console.warn(
          "political_area_mappings table is missing; using seed JSON fallback for local development.",
        );
        return new FilePoliticalAreaMappingRepository().getActiveMapping(city, state);
      }

      throw error;
    }
  }
}

let repository: PoliticalAreaMappingRepository | null = null;

export function getPoliticalAreaMappingRepository() {
  if (!repository) {
    repository =
      env.APP_MODE === "real"
        ? new PrismaPoliticalAreaMappingRepository()
        : new FilePoliticalAreaMappingRepository();
  }

  return repository;
}
