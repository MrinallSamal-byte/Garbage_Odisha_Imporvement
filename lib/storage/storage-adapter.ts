import { env } from "@/lib/env";
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
    adapter = env.STORAGE_PROVIDER === "s3" ? new S3StorageAdapter() : new LocalStorageAdapter();
  }

  return adapter;
}
