import { z } from "zod";

const tradingStatuses = [
  "NotParticipating",
  "Leading",
  "Losing",
  "OnPending",
  "Confirmed",
  "ChoosingWinner",
  "Winner",
  "Accepted",
  "Unknown",
] as const;

const auctionTypes = ["Request", "Up", "Down", "FixPrice"] as const;

const tradingStatusSchema = z.enum(tradingStatuses);
const auctionTypeSchema = z.enum(auctionTypes);
const dateOnlySchema = z.iso.date();

function firstValue(value: unknown): unknown {
  return Array.isArray(value) ? value[0] : value;
}

function base10PositiveInteger(value: unknown): number | undefined {
  if (typeof value === "number") {
    return Number.isSafeInteger(value) && value > 0 ? value : undefined;
  }

  if (typeof value !== "string" || !/^\d+$/.test(value.trim())) {
    return undefined;
  }

  const parsed = Number.parseInt(value.trim(), 10);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function positiveInteger(value: unknown, fallback: number): number {
  return base10PositiveInteger(firstValue(value)) ?? fallback;
}

function arrayValues(value: unknown): unknown[] {
  const values = Array.isArray(value) ? value : [value];

  return values.flatMap((item) =>
    typeof item === "string" ? item.split(",") : [item],
  );
}

function stringArray(value: unknown): string[] | undefined {
  const values = arrayValues(value)
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);

  return values.length > 0 ? values : undefined;
}

function integerArray(
  value: unknown,
  isAllowed: (item: number) => boolean = () => true,
): number[] | undefined {
  const values = arrayValues(value)
    .map(base10PositiveInteger)
    .filter((item): item is number => item !== undefined && isAllowed(item));

  return values.length > 0 ? values : undefined;
}

function enumArray<T extends string>(
  value: unknown,
  schema: z.ZodEnum<Record<T, T>>,
): T[] | undefined {
  const values = stringArray(value)
    ?.map((item) => schema.safeParse(item))
    .filter((result) => result.success)
    .map((result) => result.data);

  return values && values.length > 0 ? values : undefined;
}

function trimmedString(value: unknown): string | undefined {
  const candidate = firstValue(value);

  if (typeof candidate !== "string") {
    return undefined;
  }

  const trimmed = candidate.trim();
  return trimmed === "" ? undefined : trimmed;
}

function decimalString(value: unknown): string | undefined {
  const candidate = trimmedString(value);

  if (
    candidate === undefined ||
    !/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(candidate) ||
    !Number.isFinite(Number(candidate))
  ) {
    return undefined;
  }

  return candidate;
}

function dateOnly(value: unknown): string | undefined {
  const candidate = trimmedString(value);
  const result = dateOnlySchema.safeParse(candidate);
  return result.success ? result.data : undefined;
}

function normalizeSearch(input: unknown): Record<string, unknown> {
  const raw =
    typeof input === "object" && input !== null && !Array.isArray(input)
      ? input
      : {};
  const read = (key: string): unknown => Reflect.get(raw, key);
  const status = enumArray(read("status"), tradingStatusSchema);
  const mobileStatuses = integerArray(read("mobileStatuses"));
  const statuses = integerArray(read("statuses"), (item) => item <= 7);
  const cargoNum = trimmedString(read("cargoNum"));
  const bodyTypes = stringArray(read("bodyTypes"));
  const loadCity = trimmedString(read("loadCity"));
  const unloadCity = trimmedString(read("unloadCity"));
  const loadDateFrom = dateOnly(read("loadDateFrom"));
  const loadDateTo = dateOnly(read("loadDateTo"));
  const unloadDateFrom = dateOnly(read("unloadDateFrom"));
  const unloadDateTo = dateOnly(read("unloadDateTo"));
  const createDateFrom = dateOnly(read("createDateFrom"));
  const createDateTo = dateOnly(read("createDateTo"));
  const currentPriceFrom = decimalString(read("currentPriceFrom"));
  const currentPriceTo = decimalString(read("currentPriceTo"));
  const aucType = enumArray(read("aucType"), auctionTypeSchema);

  return {
    page: positiveInteger(read("page"), 1),
    perPage: positiveInteger(read("perPage"), 10),
    ...(status ? { status } : {}),
    ...(mobileStatuses ? { mobileStatuses } : {}),
    ...(statuses ? { statuses } : {}),
    ...(cargoNum ? { cargoNum } : {}),
    ...(bodyTypes ? { bodyTypes } : {}),
    ...(loadCity ? { loadCity } : {}),
    ...(unloadCity ? { unloadCity } : {}),
    ...(loadDateFrom ? { loadDateFrom } : {}),
    ...(loadDateTo ? { loadDateTo } : {}),
    ...(unloadDateFrom ? { unloadDateFrom } : {}),
    ...(unloadDateTo ? { unloadDateTo } : {}),
    ...(createDateFrom ? { createDateFrom } : {}),
    ...(createDateTo ? { createDateTo } : {}),
    ...(currentPriceFrom ? { currentPriceFrom } : {}),
    ...(currentPriceTo ? { currentPriceTo } : {}),
    ...(aucType ? { aucType } : {}),
  };
}

const normalizedAuctionSearchSchema = z.object({
  page: z.number().int().positive(),
  perPage: z.number().int().positive(),
  status: z.array(tradingStatusSchema).optional(),
  mobileStatuses: z.array(z.number().int().positive()).optional(),
  statuses: z.array(z.number().int().min(1).max(7)).optional(),
  cargoNum: z.string().optional(),
  bodyTypes: z.array(z.string()).optional(),
  loadCity: z.string().optional(),
  unloadCity: z.string().optional(),
  loadDateFrom: dateOnlySchema.optional(),
  loadDateTo: dateOnlySchema.optional(),
  unloadDateFrom: dateOnlySchema.optional(),
  unloadDateTo: dateOnlySchema.optional(),
  createDateFrom: dateOnlySchema.optional(),
  createDateTo: dateOnlySchema.optional(),
  currentPriceFrom: z.string().optional(),
  currentPriceTo: z.string().optional(),
  aucType: z.array(auctionTypeSchema).optional(),
});

export const auctionSearchSchema = z.preprocess(
  normalizeSearch,
  normalizedAuctionSearchSchema,
);

export type AuctionSearch = z.output<typeof auctionSearchSchema>;
