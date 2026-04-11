import { randomUUID } from "node:crypto";

import { centroid } from "@turf/turf";
import { NextRequest } from "next/server";
import sharp from "sharp";

import { reportSeverities, wasteTypeKeys } from "@/lib/civic/constants";
import { getCivicRepository } from "@/lib/civic/repository";
import type { WasteTypeKey, WardBoundary } from "@/lib/civic/types";
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

function getOptionalNumber(formData: FormData, key: string) {
  const raw = getString(formData, key);
  if (!raw) return null;

  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function assertEnum<T extends string>(value: string, allowed: readonly T[], label: string): T {
  if (!allowed.includes(value as T)) {
    throw new AppError(`${label} is invalid.`, 400);
  }

  return value as T;
}

function normalizeWasteType(value: string): WasteTypeKey {
  const aliases: Record<string, WasteTypeKey> = {
    household_waste: "household",
    household: "household",
    construction_debris: "construction_debris",
    mixed_waste: "mixed",
    mixed: "mixed",
    e_waste: "e_waste",
    biomedical: "biomedical",
  };

  return assertEnum(aliases[value] ?? value, wasteTypeKeys, "Waste type");
}

function buildReportTitle(addressText: string, landmark: string | null) {
  if (landmark) {
    return `Garbage near ${landmark}`;
  }

  const firstAddressPart = addressText.split(",")[0]?.trim();
  return firstAddressPart ? `Garbage near ${firstAddressPart}` : "Garbage report in Bhubaneswar";
}

function getWardFallbackPoint(ward: WardBoundary) {
  const center = centroid(ward.boundaryGeojson as never);
  const [lng, lat] = center.geometry.coordinates;
  return { lat, lng };
}

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const ip = getClientIp(request);
    const rateLimit = checkRateLimit(
      `bhubaneswar-report-create:${ip}`,
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

    const repository = getCivicRepository();
    const wardId = getString(formData, "wardId") || null;
    const addressText = getString(formData, "addressText");
    const landmark = getString(formData, "landmark") || null;
    const severity = assertEnum(getString(formData, "severity"), reportSeverities, "Severity");
    const wasteType = normalizeWasteType(getString(formData, "wasteType"));
    const wasteTypes = await repository.listWasteTypes();
    const wasteTypeRecord = wasteTypes.find((item) => item.key === wasteType);

    if (!wasteTypeRecord) {
      throw new AppError("Waste type is not configured.", 500);
    }

    if (!wardId) {
      throw new AppError("Select a Bhubaneswar ward.", 400);
    }

    if (!addressText && !landmark) {
      throw new AppError("Landmark or address is required.", 400);
    }

    const selectedWard = (await repository.listWards()).find((ward) => ward.id === wardId);
    if (!selectedWard) {
      throw new AppError("Selected Bhubaneswar ward is invalid.", 400);
    }

    const fallbackPoint = getWardFallbackPoint(selectedWard);
    const latitude = getOptionalNumber(formData, "latitude") ?? fallbackPoint.lat;
    const longitude = getOptionalNumber(formData, "longitude") ?? fallbackPoint.lng;

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
    const storage = getStorageAdapter();
    const savedStorageKeys: string[] = [];

    try {
      const original = await storage.saveBuffer({
        buffer: normalized,
        storageKey: `reports/${datePath}/${id}.jpg`,
        contentType: "image/jpeg",
      });
      savedStorageKeys.push(original.storageKey);

      const thumb = await storage.saveBuffer({
        buffer: thumbnail,
        storageKey: `reports/${datePath}/${id}-thumb.jpg`,
        contentType: "image/jpeg",
      });
      savedStorageKeys.push(thumb.storageKey);

      const reportId = await repository.createReport({
        reporterId: null,
        wardId,
        wasteTypeId: wasteTypeRecord.id,
        landmark: landmark ?? addressText,
        address: addressText || landmark || buildReportTitle(addressText, landmark),
        lat: latitude,
        lng: longitude,
        severity,
        photoUrl: original.publicUrl,
      });

      return ok({ reportId });
    } catch (error) {
      const cleanupResults = await Promise.allSettled(
        savedStorageKeys.map((storageKey) => storage.deleteObject(storageKey)),
      );

      for (const cleanupResult of cleanupResults) {
        if (cleanupResult.status === "rejected") {
          console.error("Could not remove uploaded media after failed report creation", cleanupResult.reason);
        }
      }

      throw error;
    }
  } catch (error) {
    return fail(error);
  }
}
