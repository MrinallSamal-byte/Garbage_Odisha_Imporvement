import { beforeEach, describe, expect, it } from "vitest";

import { resetMockState } from "@/lib/mock/runtime-store";
import { getReportRepository } from "@/server/repositories/repository-factory";

describe("admin status flow", () => {
  beforeEach(async () => {
    await resetMockState();
  });

  it("updates status and writes timeline history", async () => {
    const repository = getReportRepository();
    const detail = await repository.updateStatus(
      "66666666-6666-4666-8666-111111111111",
      "IN_PROGRESS",
      "Forwarded to the local sanitation team.",
      "11111111-1111-4111-8111-111111111111",
    );

    expect(detail.report.status).toBe("IN_PROGRESS");
    expect(detail.timeline.at(-1)?.newStatus).toBe("IN_PROGRESS");
  });
});
