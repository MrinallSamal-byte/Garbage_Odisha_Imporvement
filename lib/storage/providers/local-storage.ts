import "server-only";

import { copyFile, unlink, writeFile } from "fs/promises";
import path from "path";

import { env } from "@/lib/env";
import { ensureDirectory } from "@/lib/utils/files";

import type { SaveBufferInput, StorageAdapter } from "@/lib/storage/storage-adapter";

export class LocalStorageAdapter implements StorageAdapter {
  private resolveDiskPath(storageKey: string) {
    return path.join(process.cwd(), env.LOCAL_UPLOAD_DIR, storageKey);
  }

  getPublicUrl(storageKey: string) {
    return `/uploads/${storageKey}`;
  }

  async saveBuffer(input: SaveBufferInput) {
    const targetPath = this.resolveDiskPath(input.storageKey);
    await ensureDirectory(path.dirname(targetPath));
    await writeFile(targetPath, input.buffer);

    return {
      storageKey: input.storageKey,
      publicUrl: this.getPublicUrl(input.storageKey),
    };
  }

  async copyObject(sourceKey: string, destinationKey: string) {
    const sourcePath = this.resolveDiskPath(sourceKey);
    const destinationPath = this.resolveDiskPath(destinationKey);
    await ensureDirectory(path.dirname(destinationPath));
    await copyFile(sourcePath, destinationPath);

    return {
      storageKey: destinationKey,
      publicUrl: this.getPublicUrl(destinationKey),
    };
  }

  async deleteObject(storageKey: string) {
    await unlink(this.resolveDiskPath(storageKey)).catch(() => undefined);
  }
}
