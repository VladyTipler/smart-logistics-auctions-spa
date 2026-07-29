import { describe, expect, it } from "vitest";

import { isDecimalStepAligned } from "./decimal-step";

describe("isDecimalStepAligned", () => {
  it("aligns decimal values without floating-point modulo errors", () => {
    expect(isDecimalStepAligned(0.3, 0.1, 0.1)).toBe(true);
    expect(isDecimalStepAligned(0.31, 0.1, 0.1)).toBe(false);
  });

  it("supports exact fractional string inputs", () => {
    expect(isDecimalStepAligned("1000.0002", "1000", "0.0001")).toBe(true);
    expect(isDecimalStepAligned("1000.00025", "1000", "0.0001")).toBe(false);
  });

  it.each([null, undefined, 0, -1])(
    "treats a %s step as unrestricted",
    (step) => {
      expect(isDecimalStepAligned("12.345", "10", step)).toBe(true);
    },
  );
});
