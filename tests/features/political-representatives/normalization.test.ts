import { describe, expect, it } from "vitest";

import { normalizeLocationText } from "@/features/political-representatives/shared/normalization";

describe("political location normalization", () => {
  it("normalizes Bhubaneswar spelling and punctuation variants", () => {
    expect(normalizeLocationText("BBSR, Odisha")).toBe("bhubaneswar odisha");
    expect(normalizeLocationText("Bhubaneshwar - Odisha")).toBe("bhubaneswar odisha");
  });

  it("normalizes Chandrasekharpur spelling variants", () => {
    expect(normalizeLocationText("C.S. Pur")).toBe("chandrasekharpur");
    expect(normalizeLocationText("cs pur")).toBe("chandrasekharpur");
    expect(normalizeLocationText("CSPUR")).toBe("chandrasekharpur");
  });

  it("trims repeated spaces and common spelling variations", () => {
    expect(normalizeLocationText("  Jaydev   Vihar  ")).toBe("jayadev vihar");
  });
});
