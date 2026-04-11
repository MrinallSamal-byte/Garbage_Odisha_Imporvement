import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";

import { assertSameOrigin } from "@/lib/utils/request";

describe("assertSameOrigin", () => {
  it("allows same-origin requests through a reverse proxy", () => {
    const request = new NextRequest("http://127.0.0.1:3000/api/reports/create", {
      method: "POST",
      headers: {
        host: "127.0.0.1:3000",
        origin: "https://sea-turtle-app-84qh.ondigitalocean.app",
        "x-forwarded-host": "sea-turtle-app-84qh.ondigitalocean.app",
        "x-forwarded-proto": "https",
      },
    });

    expect(() => assertSameOrigin(request)).not.toThrow();
  });

  it("blocks requests from a different origin", () => {
    const request = new NextRequest("http://127.0.0.1:3000/api/reports/create", {
      method: "POST",
      headers: {
        host: "127.0.0.1:3000",
        origin: "https://attacker.example",
        "x-forwarded-host": "sea-turtle-app-84qh.ondigitalocean.app",
        "x-forwarded-proto": "https",
      },
    });

    expect(() => assertSameOrigin(request)).toThrow("Cross-origin request blocked.");
  });
});
