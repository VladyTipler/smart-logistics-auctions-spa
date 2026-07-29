import { describe, expect, it } from "vitest";

import { auctionSearchSchema } from "./auction-search.schema";
import { buildAuctionListRequest } from "./build-auction-list-request";

describe("buildAuctionListRequest", () => {
  it("maps normalized URL state to the generated API contract", () => {
    const search = auctionSearchSchema.parse({
      page: "2",
      perPage: "20",
      cargoNum: " 00000001059 ",
      status: ["Leading", "Losing"],
      statuses: ["2", "4"],
      mobileStatuses: "2,3",
      bodyTypes: ["тентованный", "фургон"],
      loadCity: " Пермь ",
      unloadCity: " Москва ",
      currentPriceFrom: "1200.50",
      currentPriceTo: "2300",
      aucType: ["Request", "Down"],
    });

    expect(buildAuctionListRequest(search)).toEqual({
      page: 2,
      per_page: 20,
      cargo_num: "00000001059",
      status: ["Leading", "Losing"],
      statuses: [2, 4],
      mobile_statuses: [2, 3],
      body_types: ["тентованный", "фургон"],
      load_city: "Пермь",
      unload_city: "Москва",
      current_price_from: 1200.5,
      current_price_to: 2300,
      auc_type: ["Request", "Down"],
    });
  });

  it("converts date-only filters to local offset day boundaries", () => {
    const search = auctionSearchSchema.parse({
      loadDateFrom: "2026-05-26",
      loadDateTo: "2026-05-27",
      createDateFrom: "2026-06-01",
      createDateTo: "2026-06-02",
    });

    expect(buildAuctionListRequest(search)).toMatchObject({
      load_date_from: expect.stringMatching(
        /^2026-05-26T00:00:00[+-]\d{2}:\d{2}$/,
      ),
      load_date_to: expect.stringMatching(
        /^2026-05-27T23:59:59\.999[+-]\d{2}:\d{2}$/,
      ),
      create_date_from: expect.stringMatching(
        /^2026-06-01T00:00:00[+-]\d{2}:\d{2}$/,
      ),
      create_date_to: expect.stringMatching(
        /^2026-06-02T23:59:59\.999[+-]\d{2}:\d{2}$/,
      ),
    });
  });

  it("omits absent optional filters", () => {
    expect(buildAuctionListRequest(auctionSearchSchema.parse({}))).toEqual({
      page: 1,
      per_page: 10,
    });
  });
});
