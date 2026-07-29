import { describe, expect, it } from "vitest";

import { auctionSearchSchema } from "./auction-search.schema";

describe("auctionSearchSchema", () => {
  it.each([
    [{}, { page: 1, perPage: 10 }],
    [{ page: "3", perPage: "25" }, { page: 3, perPage: 25 }],
    [{ page: "oops", perPage: "0" }, { page: 1, perPage: 10 }],
    [{ page: "-2", perPage: "2.5" }, { page: 1, perPage: 10 }],
    [{ page: ["4"], perPage: ["50"] }, { page: 4, perPage: 50 }],
  ])("normalizes pagination %#", (input, expected) => {
    expect(auctionSearchSchema.parse(input)).toMatchObject(expected);
  });

  it("parses scalar, repeated and comma-separated arrays", () => {
    expect(
      auctionSearchSchema.parse({
        status: ["Leading", "Losing"],
        statuses: "1,3,7",
        mobileStatuses: ["2", "5"],
        bodyTypes: "тентованный, фургон",
      }),
    ).toMatchObject({
      status: ["Leading", "Losing"],
      statuses: [1, 3, 7],
      mobileStatuses: [2, 5],
      bodyTypes: ["тентованный", "фургон"],
    });
  });

  it("discards invalid enum and integer array members safely", () => {
    expect(
      auctionSearchSchema.parse({
        status: ["Leading", "invalid", "", 3],
        statuses: ["2", "bad", "4.5", "-1"],
        aucType: ["Request", "Unknown", "Down", "invalid"],
      }),
    ).toMatchObject({
      status: ["Leading"],
      statuses: [2],
      aucType: ["Request", "Down"],
    });
  });

  it("omits empty strings and arrays while preserving decimal URL strings", () => {
    const result = auctionSearchSchema.parse({
      cargoNum: " ",
      loadCity: "",
      status: [],
      statuses: [""],
      bodyTypes: " , ",
      currentPriceFrom: " 1200.50 ",
      currentPriceTo: "not-a-price",
    });

    expect(result).toStrictEqual({
      page: 1,
      perPage: 10,
      currentPriceFrom: "1200.50",
    });
  });
});
