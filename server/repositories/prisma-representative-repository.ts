import type { Representative as PrismaRepresentative } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import type { Representative } from "@/types/domain";

import type { RepresentativeRepository } from "./representative-repository";

function mapRepresentative(record: PrismaRepresentative): Representative {
  return {
    id: record.id,
    representativeType: record.representativeType,
    name: record.name,
    constituencyType: record.constituencyType,
    assemblyConstituencyId: record.assemblyConstituencyId,
    parliamentConstituencyId: record.parliamentConstituencyId,
    partyName: record.partyName,
    isStateRulingParty: record.isStateRulingParty,
    isCentralRulingParty: record.isCentralRulingParty,
    oppositionLabel: record.oppositionLabel,
    photoUrl: record.photoUrl,
    officialRoleTitle: record.officialRoleTitle,
    contactEmail: record.contactEmail,
    contactPhone: record.contactPhone,
    websiteUrl: record.websiteUrl,
    socialLinksJson:
      (record.socialLinksJson as Record<string, string> | null | undefined) ?? null,
    termStart: record.termStart?.toISOString() ?? null,
    termEnd: record.termEnd?.toISOString() ?? null,
    active: record.active,
    lastVerifiedAt: record.lastVerifiedAt?.toISOString() ?? null,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export class PrismaRepresentativeRepository implements RepresentativeRepository {
  async listRepresentatives() {
    return (await prisma.representative.findMany({ orderBy: { name: "asc" } })).map(mapRepresentative);
  }

  async getRepresentativeById(id: string) {
    const record = await prisma.representative.findUnique({ where: { id } });
    return record ? mapRepresentative(record) : null;
  }

  async getActiveMlaByAssemblyConstituencyId(assemblyConstituencyId: string) {
    const record = await prisma.representative.findFirst({
      where: {
        representativeType: "MLA",
        assemblyConstituencyId,
        active: true,
      },
      orderBy: [{ lastVerifiedAt: "desc" }, { updatedAt: "desc" }],
    });

    return record ? mapRepresentative(record) : null;
  }

  async getActiveMpByParliamentConstituencyId(parliamentConstituencyId: string) {
    const record = await prisma.representative.findFirst({
      where: {
        representativeType: "MP",
        parliamentConstituencyId,
        active: true,
      },
      orderBy: [{ lastVerifiedAt: "desc" }, { updatedAt: "desc" }],
    });

    return record ? mapRepresentative(record) : null;
  }

  async upsertRepresentative(input: Representative) {
    const record = await prisma.representative.upsert({
      where: { id: input.id },
      create: {
        id: input.id,
        representativeType: input.representativeType,
        name: input.name,
        constituencyType: input.constituencyType,
        assemblyConstituencyId: input.assemblyConstituencyId,
        parliamentConstituencyId: input.parliamentConstituencyId,
        partyName: input.partyName,
        isStateRulingParty: input.isStateRulingParty,
        isCentralRulingParty: input.isCentralRulingParty,
        oppositionLabel: input.oppositionLabel,
        photoUrl: input.photoUrl,
        officialRoleTitle: input.officialRoleTitle,
        contactEmail: input.contactEmail,
        contactPhone: input.contactPhone,
        websiteUrl: input.websiteUrl,
        socialLinksJson: input.socialLinksJson ?? undefined,
        termStart: input.termStart ? new Date(input.termStart) : null,
        termEnd: input.termEnd ? new Date(input.termEnd) : null,
        active: input.active,
        lastVerifiedAt: input.lastVerifiedAt ? new Date(input.lastVerifiedAt) : null,
      },
      update: {
        representativeType: input.representativeType,
        name: input.name,
        constituencyType: input.constituencyType,
        assemblyConstituencyId: input.assemblyConstituencyId,
        parliamentConstituencyId: input.parliamentConstituencyId,
        partyName: input.partyName,
        isStateRulingParty: input.isStateRulingParty,
        isCentralRulingParty: input.isCentralRulingParty,
        oppositionLabel: input.oppositionLabel,
        photoUrl: input.photoUrl,
        officialRoleTitle: input.officialRoleTitle,
        contactEmail: input.contactEmail,
        contactPhone: input.contactPhone,
        websiteUrl: input.websiteUrl,
        socialLinksJson: input.socialLinksJson ?? undefined,
        termStart: input.termStart ? new Date(input.termStart) : null,
        termEnd: input.termEnd ? new Date(input.termEnd) : null,
        active: input.active,
        lastVerifiedAt: input.lastVerifiedAt ? new Date(input.lastVerifiedAt) : null,
      },
    });

    return mapRepresentative(record);
  }
}
