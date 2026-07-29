import { describe, expect, it } from "vitest";

import { createSetBetSchema } from "./set-bet.schema";

describe("createSetBetSchema", () => {
  it.each(["", "   "])("requires a price for %j", (price) => {
    const result = createSetBetSchema({ direction: "Down" }).safeParse({
      price,
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("Укажите сумму ставки");
  });

  it.each(["0", "-1", "не число"])("requires a positive number for %j", (price) => {
    const result = createSetBetSchema({ direction: "Down" }).safeParse({
      price,
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(
      "Ставка должна быть положительным числом",
    );
  });

  it("does not invent nullable min, max, or step constraints", () => {
    const schema = createSetBetSchema({
      available: null,
      direction: "Down",
      max: null,
      min: null,
      step: null,
    });

    expect(schema.safeParse({ price: "12.345" }).success).toBe(true);
  });

  it("accepts exact min and max boundaries", () => {
    const schema = createSetBetSchema({
      direction: "Request",
      max: 100_000,
      min: 1_000,
    });

    expect(schema.safeParse({ price: "1000" }).success).toBe(true);
    expect(schema.safeParse({ price: "100000" }).success).toBe(true);
    expect(schema.safeParse({ price: "999.99" }).success).toBe(false);
    expect(schema.safeParse({ price: "100000.01" }).success).toBe(false);
  });

  it("validates a Down auction from available price with decimal-safe steps", () => {
    const schema = createSetBetSchema({
      available: 31_500,
      direction: "Down",
      min: 1_000,
      step: 500,
    });

    expect(schema.safeParse({ price: "31500" }).success).toBe(true);
    expect(schema.safeParse({ price: "31000" }).success).toBe(true);
    expect(schema.safeParse({ price: "31250" }).success).toBe(false);
    expect(schema.safeParse({ price: "32000" }).success).toBe(false);
  });

  it("validates an Up auction in the opposite direction", () => {
    const schema = createSetBetSchema({
      available: 50_500,
      direction: "Up",
      max: 100_000,
      step: 500,
    });

    expect(schema.safeParse({ price: "50500" }).success).toBe(true);
    expect(schema.safeParse({ price: "51000" }).success).toBe(true);
    expect(schema.safeParse({ price: "50750" }).success).toBe(false);
    expect(schema.safeParse({ price: "50000" }).success).toBe(false);
  });

  it("falls back to min as the step origin when available is missing", () => {
    const schema = createSetBetSchema({
      available: null,
      direction: "Request",
      min: 1_000,
      step: 250,
    });

    expect(schema.safeParse({ price: "1250" }).success).toBe(true);
    expect(schema.safeParse({ price: "1200" }).success).toBe(false);
  });
});
