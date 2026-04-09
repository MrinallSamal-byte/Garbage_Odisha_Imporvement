import { createHash } from "crypto";

export function sha256(value: Buffer | string) {
  return createHash("sha256").update(value).digest("hex");
}
