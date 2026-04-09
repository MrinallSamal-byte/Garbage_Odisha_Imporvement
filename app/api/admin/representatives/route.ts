import { randomUUID } from "crypto";
import { NextRequest } from "next/server";

import { requireAdminSession } from "@/lib/auth/admin-session";
import { representativeUpsertSchema } from "@/lib/validation/schemas";
import { fail, ok } from "@/lib/utils/http";
import { getRepresentativeRepository } from "@/server/repositories/repository-factory";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    void request;
    await requireAdminSession();
    const representatives = await getRepresentativeRepository().listRepresentatives();
    return ok({ items: representatives });
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdminSession();
    const body = representativeUpsertSchema.parse(await request.json());
    const now = new Date().toISOString();
    const representative = await getRepresentativeRepository().upsertRepresentative({
      id: randomUUID(),
      representativeType: body.representativeType,
      name: body.name,
      constituencyType: body.representativeType === "MLA" ? "ASSEMBLY" : "PARLIAMENT",
      assemblyConstituencyId: body.assemblyConstituencyId ?? null,
      parliamentConstituencyId: body.parliamentConstituencyId ?? null,
      partyName: body.partyName,
      isStateRulingParty: body.isStateRulingParty,
      isCentralRulingParty: body.isCentralRulingParty,
      oppositionLabel: body.oppositionLabel ?? null,
      photoUrl: body.photoUrl ?? null,
      officialRoleTitle: body.officialRoleTitle ?? null,
      contactEmail: body.contactEmail ?? null,
      contactPhone: body.contactPhone ?? null,
      websiteUrl: body.websiteUrl ?? null,
      socialLinksJson: null,
      termStart: body.termStart ?? null,
      termEnd: body.termEnd ?? null,
      active: body.active,
      lastVerifiedAt: now,
      createdAt: now,
      updatedAt: now,
    });
    return ok({ representative }, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}
