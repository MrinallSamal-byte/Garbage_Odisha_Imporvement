import "server-only";

import path from "path";

import { buildMockSeedState } from "@/lib/mock/seed-data";
import type { MockDatabaseState } from "@/types/domain";
import { fileExists, readJsonFile, writeJsonFile } from "@/lib/utils/files";

const runtimePath = path.join(process.cwd(), "data/mock/runtime-store.json");

export async function readMockState() {
  if (!(await fileExists(runtimePath))) {
    await resetMockState();
  }

  return readJsonFile<MockDatabaseState>(runtimePath);
}

export async function writeMockState(state: MockDatabaseState) {
  await writeJsonFile(runtimePath, state);
}

export async function resetMockState() {
  const seed = buildMockSeedState();
  await writeMockState(seed);
  return seed;
}
