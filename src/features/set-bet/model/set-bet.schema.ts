import { z } from "zod";

import { isDecimalStepAligned } from "@/shared/lib/decimal/decimal-step";

export type AuctionBidDirection = "Down" | "FixPrice" | "Request" | "Up";

export type SetBetConstraints = {
  available?: number | null;
  direction: AuctionBidDirection;
  max?: number | null;
  min?: number | null;
  step?: number | null;
};

type ParsedMoney =
  | { kind: "invalid" }
  | { kind: "precision" }
  | { kind: "valid"; normalized: string; value: number };

const plainDecimalPattern = /^\d+(?:[.,]\d+)?$/;
const maximumMoneyCoefficient = BigInt(Number.MAX_SAFE_INTEGER);

function parseMoneyInput(input: string): ParsedMoney {
  const trimmed = input.trim();

  if (!plainDecimalPattern.test(trimmed)) {
    return { kind: "invalid" };
  }

  const normalized = trimmed.replace(",", ".");
  const [integer, fraction = ""] = normalized.split(".");
  const coefficientSource =
    `${integer}${fraction}`.replace(/^0+/, "") || "0";

  if (
    fraction.length > 6 ||
    coefficientSource.length > 16
  ) {
    return { kind: "precision" };
  }

  const coefficient = BigInt(coefficientSource);

  if (
    coefficient > maximumMoneyCoefficient
  ) {
    return { kind: "precision" };
  }

  return {
    kind: "valid",
    normalized,
    value: Number(normalized),
  };
}

export function createSetBetSchema(constraints: SetBetConstraints) {
  return z
    .object({
      price: z.string(),
    })
    .superRefine(({ price }, context) => {
      const trimmed = price.trim();

      if (trimmed.length === 0) {
        context.addIssue({
          code: "custom",
          message: "Укажите сумму ставки",
          path: ["price"],
        });
        return;
      }

      if (/^-\d/.test(trimmed)) {
        context.addIssue({
          code: "custom",
          message: "Ставка должна быть положительным числом",
          path: ["price"],
        });
        return;
      }

      const money = parseMoneyInput(trimmed);

      if (money.kind === "invalid") {
        context.addIssue({
          code: "custom",
          message: "Введите сумму обычным десятичным числом",
          path: ["price"],
        });
        return;
      }

      if (money.kind === "precision") {
        context.addIssue({
          code: "custom",
          message: "Сумма содержит слишком много разрядов",
          path: ["price"],
        });
        return;
      }

      if (money.value <= 0) {
        context.addIssue({
          code: "custom",
          message: "Ставка должна быть положительным числом",
          path: ["price"],
        });
        return;
      }

      if (constraints.min != null && money.value < constraints.min) {
        context.addIssue({
          code: "custom",
          message: `Минимальная ставка — ${constraints.min}`,
          path: ["price"],
        });
        return;
      }

      if (constraints.max != null && money.value > constraints.max) {
        context.addIssue({
          code: "custom",
          message: `Максимальная ставка — ${constraints.max}`,
          path: ["price"],
        });
        return;
      }

      if (
        constraints.available != null &&
        constraints.direction === "Down" &&
        money.value > constraints.available
      ) {
        context.addIssue({
          code: "custom",
          message: `Ставка должна быть не выше ${constraints.available}`,
          path: ["price"],
        });
        return;
      }

      if (
        constraints.available != null &&
        constraints.direction === "Up" &&
        money.value < constraints.available
      ) {
        context.addIssue({
          code: "custom",
          message: `Ставка должна быть не ниже ${constraints.available}`,
          path: ["price"],
        });
        return;
      }

      const stepOrigin = constraints.available ?? constraints.min;
      if (
        stepOrigin != null &&
        !isDecimalStepAligned(
          money.normalized,
          stepOrigin,
          constraints.step,
        )
      ) {
        context.addIssue({
          code: "custom",
          message: `Соблюдайте шаг ставки ${constraints.step}`,
          path: ["price"],
        });
      }
    })
    .transform(({ price }) => ({
      price: Number(price.trim().replace(",", ".")),
    }));
}

export type SetBetFormInput = z.input<ReturnType<typeof createSetBetSchema>>;
export type SetBetFormValues = z.output<ReturnType<typeof createSetBetSchema>>;
