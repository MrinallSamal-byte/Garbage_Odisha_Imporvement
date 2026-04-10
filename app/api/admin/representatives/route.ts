import { randomUUID } from "crypto";
import { NextRequest } from "next/server";

import { requireAdminSession } from "@/lib/auth/admin-session";
import { representativeUpsertSchema } from "@/lib/validation/schemas";
import { fail, ok } from "@/lib/utils/http";
import { assertSameOrigin } from "@/lib/utils/request";
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
    assertSameOrigin(request);
    await requireAdminSession();
    const body = representativeUpsertSchema.parse(await request.json());
    const now = new Date().toISOString();
    const representativeType = body.representativeType;
    const constituencyType = representativeType === "MLA" ? "ASSEMBLY" : "PARLIAMENT";
    const assemblyConstituencyId =
      representativeType === "MLA" ? body.assemblyConstituencyId ?? null : null;
    const parliamentConstituencyId =
      representativeType === "MP" ? body.parliamentConstituencyId ?? null : null;

    const representative = await getRepresentativeRepository().upsertRepresentative({
      id: randomUUID(),
      representativeType,
      name: body.name,
      constituencyType,
      assemblyConstituencyId,
      parliamentConstituencyId,
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
