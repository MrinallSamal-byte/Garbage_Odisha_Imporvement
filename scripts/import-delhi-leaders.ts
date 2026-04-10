import { readFile } from "node:fs/promises";
import path from "node:path";

import { Prisma } from "@prisma/client";
import { parse } from "csv-parse/sync";

import { prisma } from "../lib/db/prisma";

type AssemblyRow = {
  assembly_constituency_name: string;
  leader_name: string;
  party_short_name: string;
  contact_phone?: string;
  contact_email?: string;
  official_url?: string;
};

type ParliamentRow = {
  parliamentary_constituency_name: string;
  leader_name: string;
  party_short_name: string;
  contact_phone?: string;
  contact_email?: string;
  official_url?: string;
};

async function readCsv<T>(fileName: string): Promise<T[]> {
  const filePath = path.join(process.cwd(), "data", "delhi", fileName);
  const raw = await readFile(filePath, "utf8");
  return parse(raw, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as T[];
}

async function findPartyId(shortName: string) {
  const rows = await prisma.$queryRaw<Array<{ id: string }>>(
    Prisma.sql`SELECT id::text FROM public.parties WHERE short_name = ${shortName} LIMIT 1`,
  );

  return rows[0]?.id ?? null;
}

async function upsertLeader(input: {
  role: "mla" | "mp";
  fullName: string;
  partyId: string | null;
  contactPhone?: string;
  contactEmail?: string;
  officialUrl?: string;
}) {
  const rows = await prisma.$queryRaw<Array<{ id: string }>>(
    Prisma.sql`
      INSERT INTO public.leaders (role, full_name, party_id, contact_phone, contact_email, official_url)
      VALUES (
        ${input.role}::leader_role,
        ${input.fullName},
        ${input.partyId ? Prisma.sql`${input.partyId}::uuid` : Prisma.sql`NULL`},
        ${input.contactPhone ?? null},
        ${input.contactEmail ?? null},
        ${input.officialUrl ?? null}
      )
      ON CONFLICT DO NOTHING
      RETURNING id::text
    `,
  );

  if (rows[0]?.id) {
    return rows[0].id;
  }

  const existing = await prisma.$queryRaw<Array<{ id: string }>>(
    Prisma.sql`
      SELECT id::text
      FROM public.leaders
      WHERE role = ${input.role}::leader_role
        AND full_name = ${input.fullName}
      LIMIT 1
    `,
  );

  if (!existing[0]) {
    throw new Error(`Could not upsert leader ${input.fullName}`);
  }

  await prisma.$executeRaw(
    Prisma.sql`
      UPDATE public.leaders
      SET
        party_id = ${input.partyId ? Prisma.sql`${input.partyId}::uuid` : Prisma.sql`NULL`},
        contact_phone = ${input.contactPhone ?? null},
        contact_email = ${input.contactEmail ?? null},
        official_url = ${input.officialUrl ?? null}
      WHERE id = ${existing[0].id}::uuid
    `,
  );

  return existing[0].id;
}

async function main() {
  const [assemblyRows, parliamentRows] = await Promise.all([
    readCsv<AssemblyRow>("assembly-leaders.csv").catch(() => []),
    readCsv<ParliamentRow>("parliament-leaders.csv").catch(() => []),
  ]);

  if (!assemblyRows.length && !parliamentRows.length) {
    console.warn(
      "No leader CSV files found at data/delhi/assembly-leaders.csv or data/delhi/parliament-leaders.csv. Copy the provided templates and fill them with current official data before running this import.",
    );
    return;
  }

  for (const row of assemblyRows) {
    const partyId = await findPartyId(row.party_short_name);
    const leaderId = await upsertLeader({
      role: "mla",
      fullName: row.leader_name,
      partyId,
      contactPhone: row.contact_phone,
      contactEmail: row.contact_email,
      officialUrl: row.official_url,
    });

    await prisma.$executeRaw(
      Prisma.sql`
        INSERT INTO public.mla_assignments (leader_id, assembly_constituency_id)
        SELECT ${leaderId}::uuid, ac.id
        FROM public.assembly_constituencies ac
        WHERE ac.name = ${row.assembly_constituency_name}
        ON CONFLICT DO NOTHING
      `,
    );
  }

  for (const row of parliamentRows) {
    const partyId = await findPartyId(row.party_short_name);
    const leaderId = await upsertLeader({
      role: "mp",
      fullName: row.leader_name,
      partyId,
      contactPhone: row.contact_phone,
      contactEmail: row.contact_email,
      officialUrl: row.official_url,
    });

    await prisma.$executeRaw(
      Prisma.sql`
        INSERT INTO public.mp_assignments (leader_id, parliamentary_constituency_id)
        SELECT ${leaderId}::uuid, pc.id
        FROM public.parliamentary_constituencies pc
        WHERE pc.name = ${row.parliamentary_constituency_name}
        ON CONFLICT DO NOTHING
      `,
    );
  }

  console.log(
    `Imported ${assemblyRows.length} MLA assignments and ${parliamentRows.length} MP assignments.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
