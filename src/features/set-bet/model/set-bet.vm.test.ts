import { describe, expect, it } from "vitest";

import { auctionFixtures } from "@/shared/api/mocks/fixtures/auctions.fixture";

import { mapSetBetViewModel } from "./set-bet.vm";

const auctionUuid = "11111111-1111-4111-8111-111111111111";

describe("mapSetBetViewModel currency", () => {
  it.each([
    ["643", "643", "₽"],
    ["RUB", "643", "₽"],
    ["498", "498", "MDL"],
    ["MDL", "498", "MDL"],
    ["840", "840", "$"],
    ["USD", "840", "$"],
    ["978", "978", "€"],
    ["EUR", "978", "€"],
    ["XYZ", "XYZ", "XYZ"],
  ])(
    "maps %s to safe formatter code %s and visible suffix %s",
    (source, expectedCode, expectedSuffix) => {
      const detail = structuredClone(auctionFixtures[0].detail);
      detail.payment.currency_code = source;

      const result = mapSetBetViewModel(detail, auctionUuid);

      expect(result.currencyCode).toBe(expectedCode);
      expect(result.currencySuffix).toBe(expectedSuffix);
    },
  );
});
