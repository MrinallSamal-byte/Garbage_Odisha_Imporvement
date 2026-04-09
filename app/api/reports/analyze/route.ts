import { NextRequest } from "next/server";

import { env } from "@/lib/env";
import { checkRateLimit } from "@/lib/utils/rate-limit";
import { assertSameOrigin, getClientIp, getSessionFingerprint } from "@/lib/utils/request";
import { fail, ok } from "@/lib/utils/http";
import { AppError } from "@/lib/utils/errors";
import { analyzeRequestSchema } from "@/lib/validation/schemas";
import { analyzeIncomingReport } from "@/server/services/report-analysis-service";
import { processImageFile } from "@/server/workflows/media-processing";

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const ip = getClientIp(request);
    const rateLimit = checkRateLimit(
      `analyze:${ip}`,
      env.RATE_LIMIT_ANALYZE_PER_HOUR,
      60 * 60 * 1000,
    );

    if (!rateLimit.allowed) {
      throw new AppError("Analyze rate limit exceeded. Please wait and try again.", 429);
    }

    const formData = await request.formData();
    const image = formData.get("image");

    if (!(image instanceof File)) {
      throw new AppError("Image file is required.", 400);
    }

    const parsed = analyzeRequestSchema.parse({
      latitude: formData.get("latitude"),
      longitude: formData.get("longitude"),
      gpsAccuracyMeters: formData.get("gpsAccuracyMeters"),
      captureTimestamp: formData.get("captureTimestamp"),
      description: formData.get("description"),
      sourceType: formData.get("sourceType") ?? "LIVE_CAPTURE",
    });

    const processedImage = await processImageFile(image);
    const result = await analyzeIncomingReport(
      {
        latitude: parsed.latitude,
        longitude: parsed.longitude,
        gpsAccuracyMeters: parsed.gpsAccuracyMeters,
        captureTimestamp: parsed.captureTimestamp,
        description: parsed.description,
        sourceType: parsed.sourceType,
        sessionFingerprintHash: getSessionFingerprint(request),
      },
      processedImage,
    );

    return ok(result);
  } catch (error) {
    return fail(error);
  }
}
