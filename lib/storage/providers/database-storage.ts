import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { AppError } from "@/lib/utils/errors";

import type { SaveBufferInput, StorageAdapter } from "@/lib/storage/storage-adapter";

type StoredMediaRow = {
  storage_key: string;
  content_type: string;
  data: Buffer;
  byte_size: number;
  updated_at: Date | string;
};

let ensureTablePromise: Promise<void> | null = null;

function encodeStorageKey(storageKey: string) {
  return storageKey
    .split("/")
    .filter(Boolean)
    .map(encodeURIComponent)
    .join("/");
}

async function ensureUploadedMediaTable() {
  ensureTablePromise ??= prisma
    .$executeRaw(Prisma.sql`
      CREATE TABLE IF NOT EXISTS public.uploaded_media (
        storage_key text PRIMARY KEY,
        content_type text NOT NULL,
        data bytea NOT NULL,
        byte_size integer NOT NULL,
        created_at timestamptz NOT NULL DEFAULT NOW(),
        updated_at timestamptz NOT NULL DEFAULT NOW()
      )
    `)
    .then(() => undefined);

  return ensureTablePromise;
}

export async function readDatabaseStoredMedia(storageKey: string) {
  await ensureUploadedMediaTable();

  const rows = await prisma.$queryRaw<StoredMediaRow[]>(Prisma.sql`
    SELECT storage_key, content_type, data, byte_size, updated_at
    FROM public.uploaded_media
    WHERE storage_key = ${storageKey}
    LIMIT 1
  `);

  const row = rows[0];
  if (!row) {
    throw new AppError("Stored media not found.", 404);
  }

  return row;
}

export class DatabaseStorageAdapter implements StorageAdapter {
  getPublicUrl(storageKey: string) {
    return `/api/uploads/${encodeStorageKey(storageKey)}`;
  }

  async saveBuffer(input: SaveBufferInput) {
    await ensureUploadedMediaTable();

    await prisma.$executeRaw(Prisma.sql`
      INSERT INTO public.uploaded_media (storage_key, content_type, data, byte_size)
      VALUES (${input.storageKey}, ${input.contentType}, ${input.buffer}, ${input.buffer.length})
      ON CONFLICT (storage_key) DO UPDATE
      SET
        content_type = EXCLUDED.content_type,
        data = EXCLUDED.data,
        byte_size = EXCLUDED.byte_size,
        updated_at = NOW()
    `);

    return {
      storageKey: input.storageKey,
      publicUrl: this.getPublicUrl(input.storageKey),
    };
  }

  async copyObject(sourceKey: string, destinationKey: string) {
    await ensureUploadedMediaTable();

    const rows = await prisma.$queryRaw<Array<{ storage_key: string }>>(Prisma.sql`
      INSERT INTO public.uploaded_media (storage_key, content_type, data, byte_size)
      SELECT ${destinationKey}, content_type, data, byte_size
      FROM public.uploaded_media
      WHERE storage_key = ${sourceKey}
      ON CONFLICT (storage_key) DO UPDATE
      SET
        content_type = EXCLUDED.content_type,
        data = EXCLUDED.data,
        byte_size = EXCLUDED.byte_size,
        updated_at = NOW()
      RETURNING storage_key
    `);

    if (!rows[0]) {
      throw new AppError("Stored media source not found.", 500);
    }

    return {
      storageKey: destinationKey,
      publicUrl: this.getPublicUrl(destinationKey),
    };
  }

  async deleteObject(storageKey: string) {
    await ensureUploadedMediaTable();

    await prisma.$executeRaw(Prisma.sql`
      DELETE FROM public.uploaded_media
      WHERE storage_key = ${storageKey}
    `);
  }
}
