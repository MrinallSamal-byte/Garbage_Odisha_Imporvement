import { NextResponse } from "next/server";

import { readDatabaseStoredMedia } from "@/lib/storage/providers/database-storage";
import { fail } from "@/lib/utils/http";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ key: string[] }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { key } = await context.params;
    const storageKey = key.map(decodeURIComponent).join("/");
    const media = await readDatabaseStoredMedia(storageKey);
    const body = new Uint8Array(media.data).buffer;

    return new NextResponse(body, {
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Length": String(media.byte_size),
        "Content-Type": media.content_type,
        ETag: `"${Buffer.from(`${media.storage_key}:${media.updated_at}`).toString("base64url")}"`,
      },
    });
  } catch (error) {
    return fail(error);
  }
}
