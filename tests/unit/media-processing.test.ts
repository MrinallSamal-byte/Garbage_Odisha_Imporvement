import { describe, expect, it } from "vitest";

import { AppError } from "@/lib/utils/errors";
import { processImageFile } from "@/server/workflows/media-processing";

const tinyPngBase64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aP6sAAAAASUVORK5CYII=";

describe("processImageFile", () => {
  it("accepts a valid PNG upload and normalizes it to JPEG", async () => {
    const file = new File([Buffer.from(tinyPngBase64, "base64")], "capture.png", {
      type: "image/png",
    });

    const result = await processImageFile(file);

    expect(result.mimeType).toBe("image/jpeg");
    expect(result.width).toBe(1);
    expect(result.height).toBe(1);
    expect(result.normalizedFilename).toBe("capture.jpg");
    expect(result.buffer.byteLength).toBeGreaterThan(0);
  });

  it("rejects non-image uploads before attempting image processing", async () => {
    const file = new File([Buffer.from("not-an-image")], "payload.txt", {
      type: "text/plain",
    });

    await expect(processImageFile(file)).rejects.toMatchObject<AppError>({
      message: "Only JPEG, PNG, and WEBP uploads are supported.",
      statusCode: 415,
    });
  });
});
