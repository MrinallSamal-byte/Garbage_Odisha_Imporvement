import { readFile, unlink, writeFile } from "fs/promises";
import path from "path";

import { customAlphabet } from "nanoid";

import type { PreviewSessionPayload } from "@/types/domain";
import { ensureDirectory } from "@/lib/utils/files";

const previewDirectory = path.join(process.cwd(), "data", "preview-sessions");
const tokenGenerator = customAlphabet("1234567890abcdefghijklmnopqrstuvwxyz", 32);

function resolvePath(token: string) {
  return path.join(previewDirectory, `${token}.json`);
}

export async function createPreviewSession(payload: Omit<PreviewSessionPayload, "id">) {
  const token = tokenGenerator();
  await ensureDirectory(previewDirectory);
  await writeFile(resolvePath(token), JSON.stringify({ ...payload, id: token }, null, 2), "utf8");
  return token;
}

export async function readPreviewSession(token: string) {
  try {
    const contents = await readFile(resolvePath(token), "utf8");
    return JSON.parse(contents) as PreviewSessionPayload;
  } catch {
    return null;
  }
}

export async function deletePreviewSession(token: string) {
  await unlink(resolvePath(token)).catch(() => undefined);
}
