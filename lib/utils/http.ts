import { NextResponse } from "next/server";

import { AppError, isAppError } from "@/lib/utils/errors";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function fail(error: unknown) {
  if (isAppError(error)) {
    return NextResponse.json(
      {
        error: error.message,
        details: error.details ?? null,
      },
      { status: error.statusCode },
    );
  }

  console.error(error);

  return NextResponse.json(
    {
      error: "Internal server error",
    },
    { status: 500 },
  );
}

export function assert(condition: unknown, message: string, statusCode = 400): asserts condition {
  if (!condition) {
    throw new AppError(message, statusCode);
  }
}
