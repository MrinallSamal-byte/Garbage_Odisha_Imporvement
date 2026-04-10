import { copyFile, unlink, writeFile } from "fs/promises";
import path from "path";

import { env } from "@/lib/env";
import { ensureDirectory } from "@/lib/utils/files";

import type { SaveBufferInput, StorageAdapter } from "@/lib/storage/storage-adapter";

export class LocalStorageAdapter implements StorageAdapter {
  private readonly uploadRoot = path.resolve(process.cwd(), env.LOCAL_UPLOAD_DIR);
  private readonly publicBasePath = this.resolvePublicBasePath();

  private resolvePublicBasePath() {
    const publicRoot = path.resolve(process.cwd(), "public");
    const relativePublicPath = path.relative(publicRoot, this.uploadRoot);

    if (
      relativePublicPath.startsWith("..") ||
      path.isAbsolute(relativePublicPath)
    ) {
      throw new Error("LOCAL_UPLOAD_DIR must be inside the public directory when using local storage.");
    }

    if (!relativePublicPath || relativePublicPath === ".") {
      return "/";
    }

    return `/${relativePublicPath.split(path.sep).join("/")}`;
  }

  private resolveDiskPath(storageKey: string) {
    return path.join(this.uploadRoot, storageKey);
  }

  getPublicUrl(storageKey: string) {
    return path.posix.join(this.publicBasePath, storageKey.replaceAll("\\", "/"));
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
