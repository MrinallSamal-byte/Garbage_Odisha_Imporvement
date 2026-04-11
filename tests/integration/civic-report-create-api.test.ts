import sharp from "sharp";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const storageMocks = vi.hoisted(() => ({
  saveBuffer: vi.fn(async ({ storageKey }: { storageKey: string }) => ({
    storageKey,
    publicUrl: `/uploads/test/${storageKey.split("/").pop()}`,
  })),
  deleteObject: vi.fn(async () => undefined),
}));

const civicMocks = vi.hoisted(() => {
  const selectedWard = {
    id: "ward-30",
    number: 30,
    name: "Nayapalli West",
    zone: "Central",
    boundaryGeojson: {
      type: "Feature",
      properties: { id: "ward-30", number: 30, name: "Nayapalli West", zone: "Central" },
      geometry: {
        type: "MultiPolygon",
        coordinates: [
          [
            [
              [85.804, 20.307],
              [85.821, 20.307],
              [85.821, 20.296],
              [85.804, 20.296],
              [85.804, 20.307],
            ],
          ],
        ],
      },
    },
  };
  const createReport = vi.fn(async () => "created-bhubaneswar-report");

  return {
    createReport,
    selectedWard,
    repository: {
      listWasteTypes: vi.fn(async () => [
        {
          id: "waste-mixed",
          key: "mixed",
          label: "Mixed waste",
          description: null,
        },
      ]),
      listWards: vi.fn(async () => [selectedWard]),
      createReport,
    },
  };
});

vi.mock("@/lib/storage/storage-adapter", () => ({
  getStorageAdapter: () => storageMocks,
}));

vi.mock("@/lib/civic/repository", () => ({
  getCivicRepository: () => civicMocks.repository,
}));

import { POST as createReport } from "@/app/api/reports/create/route";

describe("Bhubaneswar report create API", () => {
  beforeEach(() => {
    storageMocks.saveBuffer.mockClear();
    storageMocks.deleteObject.mockClear();
    civicMocks.createReport.mockClear();
  });

  it("accepts wardId and creates a report with a ward fallback point when GPS is absent", async () => {
    const imageBuffer = await sharp({
      create: {
        width: 640,
        height: 480,
        channels: 3,
        background: { r: 170, g: 150, b: 120 },
      },
    })
      .jpeg()
      .toBuffer();

    const formData = new FormData();
    formData.append("photo", new File([imageBuffer], "bbsr-garbage.jpg", { type: "image/jpeg" }));
    formData.append("wardId", civicMocks.selectedWard.id);
    formData.append("addressText", "Near Nayapalli market gate, Bhubaneswar");
    formData.append("landmark", "Nayapalli market gate");
    formData.append("severity", "moderate");
    formData.append("wasteType", "mixed");

    const response = await createReport(
      new NextRequest("http://localhost:3000/api/reports/create", {
        method: "POST",
        body: formData,
      }),
    );

    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.reportId).toBe("created-bhubaneswar-report");
    expect(storageMocks.saveBuffer).toHaveBeenCalledTimes(2);

    expect(civicMocks.createReport).toHaveBeenCalledWith(
      expect.objectContaining({
        wardId: civicMocks.selectedWard.id,
        wasteTypeId: "waste-mixed",
        severity: "moderate",
        lat: expect.any(Number),
        lng: expect.any(Number),
      }),
    );
  });
});
