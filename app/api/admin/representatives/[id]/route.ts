import { NextRequest } from "next/server";

import { requireAdminSession } from "@/lib/auth/admin-session";
import { representativeUpsertSchema } from "@/lib/validation/schemas";
import { fail, ok } from "@/lib/utils/http";
import { getRepresentativeRepository } from "@/server/repositories/repository-factory";

type Params = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    await requireAdminSession();
    const { id } = await params;
    const body = representativeUpsertSchema.parse(await request.json());
    const existing = await getRepresentativeRepository().getRepresentativeById(id);

    if (!existing) {
      return ok({ representative: null }, { status: 404 });
    }

    const now = new Date().toISOString();
    const representative = await getRepresentativeRepository().upsertRepresentative({
      ...existing,
      representativeType: body.representativeType,
      name: body.name,
      partyName: body.partyName,
      isStateRulingParty: body.isStateRulingParty,
      isCentralRulingParty: body.isCentralRulingParty,
      assemblyConstituencyId: body.assemblyConstituencyId ?? null,
      parliamentConstituencyId: body.parliamentConstituencyId ?? null,
      officialRoleTitle: body.officialRoleTitle ?? null,
      contactEmail: body.contactEmail ?? null,
      contactPhone: body.contactPhone ?? null,
      websiteUrl: body.websiteUrl ?? null,
      oppositionLabel: body.oppositionLabel ?? null,
      photoUrl: body.photoUrl ?? null,
      active: body.active,
      termStart: body.termStart ?? null,
      termEnd: body.termEnd ?? null,
      updatedAt: now,
      lastVerifiedAt: now,
    });

    return ok({ representative });
  } catch (error) {
    return fail(error);
  }
}
