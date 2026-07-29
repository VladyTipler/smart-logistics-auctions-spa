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

  it.each(["0", "-1"])("requires a positive number for %j", (price) => {
    const result = createSetBetSchema({ direction: "Down" }).safeParse({
      price,
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(
      "Ставка должна быть положительным числом",
    );
  });

  it.each([
    "0x10",
    "0b10",
    "0o10",
    "1e2",
    "+100",
    "1.2.3",
    "1,2,3",
    "1,2.3",
    ".5",
    ",5",
    "1.",
    "1,",
    "NaN",
    "Infinity",
    "не число",
  ])("rejects non-plain base-10 money input %j", (price) => {
    const result = createSetBetSchema({ direction: "Request" }).safeParse({
      price,
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(
      "Введите сумму обычным десятичным числом",
    );
  });

  it("accepts dot, comma, leading zeros, and outer whitespace by policy", () => {
    const schema = createSetBetSchema({ direction: "Request" });

    expect(schema.parse({ price: " 0012.50 " })).toEqual({ price: 12.5 });
    expect(schema.parse({ price: "12,50" })).toEqual({ price: 12.5 });
  });

  it.each([
    "0.0000001",
    "1.1234567",
    "9007199254740992",
    "999999999999999999999999999999999999999",
  ])("rejects unsupported money precision or magnitude %j", (price) => {
    const result = createSetBetSchema({ direction: "Request" }).safeParse({
      price,
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(
      "Сумма содержит слишком много разрядов",
    );
  });

  it("rejects an arbitrarily long digit sequence safely", () => {
    const result = createSetBetSchema({ direction: "Request" }).safeParse({
      price: "9".repeat(10_000),
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(
      "Сумма содержит слишком много разрядов",
    );
  });

  it("keeps exact step validation for supported fractional money", () => {
    const schema = createSetBetSchema({
      available: 0.1,
      direction: "Up",
      step: 0.1,
    });

    expect(schema.safeParse({ price: "0.3" }).success).toBe(true);
    expect(schema.safeParse({ price: "0.31" }).success).toBe(false);
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
