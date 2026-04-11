import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const civicRouteFiles = [
  "app/authority/[id]/page.tsx",
  "app/mla/[id]/page.tsx",
  "app/mp/[id]/page.tsx",
  "app/api/reports/[id]/confirm/route.ts",
];

describe("Bhubaneswar route wiring", () => {
  it("does not route civic pages through the legacy Delhi modules", () => {
    for (const relativePath of civicRouteFiles) {
      const source = fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");

      expect(source, relativePath).not.toMatch(/@\/lib\/delhi/);
      expect(source, relativePath).not.toMatch(/@\/components\/delhi/);
      expect(source, relativePath).not.toMatch(/getDelhi|confirmDelhi/);
    }
  });
});
