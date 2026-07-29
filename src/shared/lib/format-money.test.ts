import { describe, expect, it } from "vitest";

import { formatMoney } from "./format-money";

describe("formatMoney", () => {
  it("preserves contract decimal precision for a known numeric currency", () => {
    expect(formatMoney(24_590.16, "643")).toBe("24 590,16 ₽");
  });

  it("does not invent decimals for whole monetary values", () => {
    expect(formatMoney(32_000, "643")).toBe("32 000 ₽");
  });

  it("formats an unknown currency as a localised decimal without crashing", () => {
    expect(formatMoney(1234.5, "999")).toBe("1 234,5");
  });
});
