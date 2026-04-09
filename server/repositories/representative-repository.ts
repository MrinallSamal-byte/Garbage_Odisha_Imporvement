import type { Representative } from "@/types/domain";

export interface RepresentativeRepository {
  listRepresentatives(): Promise<Representative[]>;
  getRepresentativeById(id: string): Promise<Representative | null>;
  getActiveMlaByAssemblyConstituencyId(assemblyConstituencyId: string): Promise<Representative | null>;
  getActiveMpByParliamentConstituencyId(parliamentConstituencyId: string): Promise<Representative | null>;
  upsertRepresentative(input: Representative): Promise<Representative>;
}
