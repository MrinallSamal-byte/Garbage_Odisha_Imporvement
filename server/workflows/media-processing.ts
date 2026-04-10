import exifr from "exifr";
import sharp from "sharp";

import { env } from "@/lib/env";
import { AppError } from "@/lib/utils/errors";
import { sha256 } from "@/lib/utils/hash";
import { slugify } from "@/lib/utils/text";

const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

function hasPrefix(buffer: Buffer, bytes: number[]) {
  return bytes.every((byte, index) => buffer[index] === byte);
}

function detectImageMimeType(buffer: Buffer) {
  if (buffer.length >= 3 && hasPrefix(buffer, [0xff, 0xd8, 0xff])) {
    return "image/jpeg";
  }

  if (buffer.length >= 8 && hasPrefix(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return "image/png";
  }

  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "image/webp";
  }

  return null;
}

export async function processImageFile(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const maxBytes = env.MAX_UPLOAD_MB * 1024 * 1024;

  if (buffer.byteLength > maxBytes) {
    throw new AppError(`Image exceeds the ${env.MAX_UPLOAD_MB} MB upload limit.`, 413);
  }

  const mimeType = detectImageMimeType(buffer) ?? file.type;

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
