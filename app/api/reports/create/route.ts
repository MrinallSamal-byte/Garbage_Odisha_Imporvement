import { randomUUID } from "node:crypto";

import { extension } from "mime-types";
import { NextRequest } from "next/server";
import sharp from "sharp";

import { createDelhiReport } from "@/lib/delhi/repository";
import { delhiSeverities, delhiWasteTypes } from "@/lib/delhi/constants";
import { env } from "@/lib/env";
import { getStorageAdapter } from "@/lib/storage/storage-adapter";
import { AppError } from "@/lib/utils/errors";
import { fail, ok } from "@/lib/utils/http";
import { checkRateLimit } from "@/lib/utils/rate-limit";
import { assertSameOrigin, getClientIp } from "@/lib/utils/request";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function assertEnum<T extends string>(value: string, allowed: readonly T[], label: string): T {
  if (!allowed.includes(value as T)) {
    throw new AppError(`${label} is invalid.`, 400);
  }

  return value as T;
}

function buildReportTitle(addressText: string, landmark: string | null) {
  if (landmark) {
    return `Garbage near ${landmark}`;
  }

  const firstAddressPart = addressText.split(",")[0]?.trim();
  return firstAddressPart ? `Garbage near ${firstAddressPart}` : "Garbage report in Delhi";
}

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const ip = getClientIp(request);
    const rateLimit = checkRateLimit(
      `delhi-report-create:${ip}`,
      env.RATE_LIMIT_SUBMIT_PER_HOUR,
      60 * 60 * 1000,
    );

    if (!rateLimit.allowed) {
      throw new AppError("Submit rate limit exceeded. Please wait and try again.", 429);
    }

    const formData = await request.formData();
    const photo = formData.get("photo");

    if (!(photo instanceof File) || photo.size === 0) {
      throw new AppError("A report photo is required.", 400);
    }

    if (!photo.type.startsWith("image/")) {
      throw new AppError("Report photo must be an image.", 400);
    }

    const maxBytes = env.MAX_UPLOAD_MB * 1024 * 1024;
    if (photo.size > maxBytes) {
      throw new AppError(`Photo must be smaller than ${env.MAX_UPLOAD_MB} MB.`, 400);
    }

    const latitude = Number(getString(formData, "latitude"));
    const longitude = Number(getString(formData, "longitude"));
    const addressText = getString(formData, "addressText");
    const landmark = getString(formData, "landmark") || null;
    const description = getString(formData, "description") || null;
    const severity = assertEnum(getString(formData, "severity"), delhiSeverities, "Severity");
    const wasteType = assertEnum(getString(formData, "wasteType"), delhiWasteTypes, "Waste type");

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      throw new AppError("A valid GPS location is required.", 400);
    }

    if (!addressText) {
      throw new AppError("Landmark or address is required.", 400);
    }

    const sourceBuffer = Buffer.from(await photo.arrayBuffer());
    const normalized = await sharp(sourceBuffer)
      .rotate()
      .jpeg({ quality: 86, mozjpeg: true })
      .toBuffer();
    const thumbnail = await sharp(normalized)
      .resize({ width: 720, withoutEnlargement: true })
      .jpeg({ quality: 78, mozjpeg: true })
      .toBuffer();

    const id = randomUUID();
    const datePath = new Date().toISOString().slice(0, 10);
    const ext = extension(photo.type) || "jpg";
    const storage = getStorageAdapter();
    const original = await storage.saveBuffer({
      buffer: normalized,
      storageKey: `reports/${datePath}/${id}.${ext === "jpeg" ? "jpg" : ext}`,
      contentType: "image/jpeg",
    });
    const thumb = await storage.saveBuffer({
      buffer: thumbnail,
      storageKey: `reports/${datePath}/${id}-thumb.jpg`,
      contentType: "image/jpeg",
    });

    const report = await createDelhiReport({
      title: buildReportTitle(addressText, landmark),
      description,
      addressText,
      landmark,
      latitude,
      longitude,
      severity,
      wasteType,
      photoUrl: original.publicUrl,
      thumbnailUrl: thumb.publicUrl,
    });

    return ok({ reportId: report.id, publicId: report.public_id });
  } catch (error) {
    return fail(error);
  }
}
