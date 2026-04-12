import politicalMappingJson from "@/features/political-representatives/data/bhubaneswar-political-area-mapping.seed.json";
import type { PoliticalAreaMapping } from "@/features/political-representatives/shared/types";
import { prisma } from "@/lib/db/prisma";
import { env } from "@/lib/env";

export async function seedPoliticalAreaMapping() {
  const mapping = politicalMappingJson as PoliticalAreaMapping;
  const city = mapping.meta.city;
  const state = mapping.meta.state;
  const version = mapping.meta.generated_on;

  if (env.APP_MODE === "mock") {
    console.log(
      `Validated ${city}, ${state} political mapping seed version ${version}. Switch APP_MODE=real to load PostgreSQL.`,
    );
    return;
  }

  await prisma.$transaction([
    prisma.$executeRawUnsafe(
      `
        UPDATE public.political_area_mappings
        SET is_active = false, updated_at = NOW()
        WHERE lower(city) = lower($1)
          AND lower(state) = lower($2)
          AND version <> $3
      `,
      city,
      state,
      version,
    ),
    prisma.$executeRawUnsafe(
      `
        INSERT INTO public.political_area_mappings (
          city,
          state,
          data_json,
          version,
          is_active,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3::jsonb, $4, true, NOW(), NOW())
        ON CONFLICT (city, state, version)
        DO UPDATE SET
          data_json = EXCLUDED.data_json,
          is_active = true,
          updated_at = NOW()
      `,
      city,
      state,
      JSON.stringify(mapping),
      version,
    ),
  ]);

  console.log(`Seeded active ${city}, ${state} political mapping version ${version}.`);
}
