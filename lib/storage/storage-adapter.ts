import { env } from "@/lib/env";
import { DatabaseStorageAdapter } from "@/lib/storage/providers/database-storage";
import { LocalStorageAdapter } from "@/lib/storage/providers/local-storage";
import { S3StorageAdapter } from "@/lib/storage/providers/s3-storage";

export interface SaveBufferInput {
  buffer: Buffer;
  storageKey: string;
  contentType: string;
}

export interface StorageAdapter {
  saveBuffer(input: SaveBufferInput): Promise<{ storageKey: string; publicUrl: string }>;
  copyObject(sourceKey: string, destinationKey: string): Promise<{ storageKey: string; publicUrl: string }>;
  deleteObject(storageKey: string): Promise<void>;
  getPublicUrl(storageKey: string): string;
}

let adapter: StorageAdapter | null = null;

export function getStorageAdapter() {
  if (!adapter) {
    if (env.STORAGE_PROVIDER === "database") {
      adapter = new DatabaseStorageAdapter();
    } else if (env.STORAGE_PROVIDER === "s3") {
      adapter = new S3StorageAdapter();
    } else {
      adapter = new LocalStorageAdapter();
    }
  }

  return adapter;
}
