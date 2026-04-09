import { mkdir, readFile, rm, stat, writeFile } from "fs/promises";
import path from "path";

export async function ensureDirectory(directoryPath: string) {
  await mkdir(directoryPath, { recursive: true });
}

export async function writeJsonFile(filePath: string, value: unknown) {
  await ensureDirectory(path.dirname(filePath));
  await writeFile(filePath, JSON.stringify(value, null, 2), "utf8");
}

export async function readJsonFile<T>(filePath: string) {
  const contents = await readFile(filePath, "utf8");
  return JSON.parse(contents) as T;
}

export async function fileExists(filePath: string) {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function removeFile(filePath: string) {
  await rm(filePath, { force: true });
}
