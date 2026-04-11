import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMocks = vi.hoisted(() => ({
  executeRaw: vi.fn(),
  queryRaw: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    $executeRaw: prismaMocks.executeRaw,
    $queryRaw: prismaMocks.queryRaw,
  },
}));

import { DatabaseStorageAdapter, readDatabaseStoredMedia } from "@/lib/storage/providers/database-storage";

describe("DatabaseStorageAdapter", () => {
  beforeEach(() => {
    prismaMocks.executeRaw.mockReset();
    prismaMocks.queryRaw.mockReset();
    prismaMocks.executeRaw.mockResolvedValue(1);
  });

  it("stores media bytes and returns an API-backed public URL", async () => {
    const adapter = new DatabaseStorageAdapter();
    const result = await adapter.saveBuffer({
      buffer: Buffer.from("image-bytes"),
      storageKey: "reports/2026-04-11/example image.jpg",
      contentType: "image/jpeg",
    });

    expect(prismaMocks.executeRaw).toHaveBeenCalled();
    expect(result).toEqual({
      storageKey: "reports/2026-04-11/example image.jpg",
      publicUrl: "/api/uploads/reports/2026-04-11/example%20image.jpg",
    });
  });

  it("throws a 404 when requested media is missing", async () => {
    prismaMocks.queryRaw.mockResolvedValue([]);

    await expect(readDatabaseStoredMedia("missing.jpg")).rejects.toMatchObject({
      message: "Stored media not found.",
      statusCode: 404,
    });
  });
});
