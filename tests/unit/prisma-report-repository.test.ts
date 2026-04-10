import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMocks = vi.hoisted(() => ({
  createMany: vi.fn(),
  count: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    reportVote: {
      createMany: prismaMocks.createMany,
      count: prismaMocks.count,
    },
  },
}));

import { PrismaReportRepository } from "@/server/repositories/prisma-report-repository";

describe("PrismaReportRepository.addVote", () => {
  beforeEach(() => {
    prismaMocks.createMany.mockReset();
    prismaMocks.count.mockReset();
  });

  it("returns created=false when the vote already exists", async () => {
    prismaMocks.createMany.mockResolvedValue({ count: 0 });
    prismaMocks.count.mockResolvedValue(2);

    const repository = new PrismaReportRepository();
    const result = await repository.addVote("report-1", "session-1");

    expect(result).toEqual({ count: 2, created: false });
  });

  it("returns created=true when a new vote is inserted", async () => {
    prismaMocks.createMany.mockResolvedValue({ count: 1 });
    prismaMocks.count.mockResolvedValue(3);

    const repository = new PrismaReportRepository();
    const result = await repository.addVote("report-1", "session-2");

    expect(result).toEqual({ count: 3, created: true });
  });
});
