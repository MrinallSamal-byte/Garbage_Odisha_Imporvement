import { readMockState, writeMockState } from "@/lib/mock/runtime-store";
import type { Representative } from "@/types/domain";

import type { RepresentativeRepository } from "./representative-repository";

function isActiveRepresentative(representative: Representative) {
  if (!representative.active) {
    return false;
  }

  const now = Date.now();
  const termStart = representative.termStart ? Date.parse(representative.termStart) : Number.MIN_SAFE_INTEGER;
  const termEnd = representative.termEnd ? Date.parse(representative.termEnd) : Number.MAX_SAFE_INTEGER;

  return termStart <= now && termEnd >= now;
}

export class MockRepresentativeRepository implements RepresentativeRepository {
  async listRepresentatives() {
    const state = await readMockState();
    return state.representatives;
  }

  async getRepresentativeById(id: string) {
    const state = await readMockState();
    return state.representatives.find((representative) => representative.id === id) ?? null;
  }

  async getActiveMlaByAssemblyConstituencyId(assemblyConstituencyId: string) {
    const state = await readMockState();
    return (
      state.representatives.find(
        (representative) =>
          representative.representativeType === "MLA" &&
          representative.assemblyConstituencyId === assemblyConstituencyId &&
          isActiveRepresentative(representative),
      ) ?? null
    );
  }

  async getActiveMpByParliamentConstituencyId(parliamentConstituencyId: string) {
    const state = await readMockState();
    return (
      state.representatives.find(
        (representative) =>
          representative.representativeType === "MP" &&
          representative.parliamentConstituencyId === parliamentConstituencyId &&
          isActiveRepresentative(representative),
      ) ?? null
    );
  }

  async upsertRepresentative(input: Representative) {
    const state = await readMockState();
    const existingIndex = state.representatives.findIndex((representative) => representative.id === input.id);

    if (existingIndex >= 0) {
      state.representatives[existingIndex] = input;
    } else {
      state.representatives.push(input);
    }

    await writeMockState(state);
    return input;
  }
}
