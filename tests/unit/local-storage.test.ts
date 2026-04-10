import { afterEach, describe, expect, it, vi } from "vitest";

describe("LocalStorageAdapter", () => {
  afterEach(() => {
    vi.resetModules();
    vi.doUnmock("@/lib/env");
  });

  it("derives public URLs from the configured public subdirectory", async () => {
    vi.doMock("@/lib/env", () => ({
      env: {
        LOCAL_UPLOAD_DIR: "public/media",
      },
    }));

    const { LocalStorageAdapter } = await import("@/lib/storage/providers/local-storage");
    const adapter = new LocalStorageAdapter();

    expect(adapter.getPublicUrl("reports/example.jpg")).toBe("/media/reports/example.jpg");
  });

  it("rejects local upload directories outside public", async () => {
    vi.doMock("@/lib/env", () => ({
      env: {
        LOCAL_UPLOAD_DIR: "tmp/uploads",
      },
    }));

    const { LocalStorageAdapter } = await import("@/lib/storage/providers/local-storage");

    expect(() => new LocalStorageAdapter()).toThrow(
      "LOCAL_UPLOAD_DIR must be inside the public directory when using local storage.",
    );
  });
});
