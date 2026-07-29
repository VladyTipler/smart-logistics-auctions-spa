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

export function createSetBetSchema(constraints: SetBetConstraints) {
  return z
    .object({
      price: z.string(),
    })
    .superRefine(({ price }, context) => {
      const normalized = price.trim().replace(",", ".");
      const parsed = Number(normalized);

      if (normalized.length === 0) {
        context.addIssue({
          code: "custom",
          message: "Укажите сумму ставки",
          path: ["price"],
        });
        return;
      }

      if (!Number.isFinite(parsed) || parsed <= 0) {
        context.addIssue({
          code: "custom",
          message: "Ставка должна быть положительным числом",
          path: ["price"],
        });
        return;
      }

      if (constraints.min != null && parsed < constraints.min) {
        context.addIssue({
          code: "custom",
          message: `Минимальная ставка — ${constraints.min}`,
          path: ["price"],
        });
        return;
      }

      if (constraints.max != null && parsed > constraints.max) {
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
        parsed > constraints.available
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
        parsed < constraints.available
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
        !isDecimalStepAligned(normalized, stepOrigin, constraints.step)
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
