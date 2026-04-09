import "server-only";

import exifr from "exifr";
import { fileTypeFromBuffer } from "file-type";
import sharp from "sharp";

import { env } from "@/lib/env";
import { AppError } from "@/lib/utils/errors";
import { sha256 } from "@/lib/utils/hash";
import { slugify } from "@/lib/utils/text";

const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function processImageFile(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const maxBytes = env.MAX_UPLOAD_MB * 1024 * 1024;

  if (buffer.byteLength > maxBytes) {
    throw new AppError(`Image exceeds the ${env.MAX_UPLOAD_MB} MB upload limit.`, 413);
  }

  const detectedType = await fileTypeFromBuffer(buffer);
  const mimeType = detectedType?.mime ?? file.type;

  if (!allowedMimeTypes.has(mimeType)) {
    throw new AppError("Only JPEG, PNG, and WEBP uploads are supported.", 415);
  }

  const pipeline = sharp(buffer).rotate();
  const metadata = await pipeline.metadata();
  const processedBuffer = await pipeline
    .resize({
      width: 1600,
      withoutEnlargement: true,
    })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();

  const exifJson = (await exifr.parse(buffer).catch(() => null)) as Record<string, unknown> | null;
  const safeName = slugify(file.name.replace(/\.[^.]+$/, "")) || "capture";

  return {
    buffer: processedBuffer,
    mimeType: "image/jpeg",
    width: metadata.width ?? null,
    height: metadata.height ?? null,
    fileSize: processedBuffer.byteLength,
    sha256Hash: sha256(processedBuffer),
    exifJson,
    normalizedFilename: `${safeName}.jpg`,
  };
}
