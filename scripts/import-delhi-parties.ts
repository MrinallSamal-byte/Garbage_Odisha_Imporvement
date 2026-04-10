import { readFile } from "node:fs/promises";
import path from "node:path";

import { Prisma } from "@prisma/client";

import { prisma } from "../lib/db/prisma";

type PartySeed = {
  name: string;
  short_name: string;
  logo_url: string;
  color_hex: string | null;
};

async function main() {
  const filePath = path.join(process.cwd(), "data", "delhi", "parties.json");
  const parties = JSON.parse(await readFile(filePath, "utf8")) as PartySeed[];

  for (const party of parties) {
    await prisma.$executeRaw(
      Prisma.sql`
        INSERT INTO public.parties (name, short_name, logo_url, color_hex)
        VALUES (${party.name}, ${party.short_name}, ${party.logo_url}, ${party.color_hex})
        ON CONFLICT (short_name) DO UPDATE
        SET
          name = EXCLUDED.name,
          logo_url = EXCLUDED.logo_url,
          color_hex = EXCLUDED.color_hex
      `,
    );
  }

  console.log(`Imported ${parties.length} party records.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
