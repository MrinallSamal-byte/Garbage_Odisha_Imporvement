import { NextResponse } from "next/server";

import { healthCheckDb } from "@/lib/db/client";

export const dynamic = "force-dynamic";

export async function GET() {
  const database = await healthCheckDb();

  return NextResponse.json({
    status: database.ok ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    database,
  });
}
