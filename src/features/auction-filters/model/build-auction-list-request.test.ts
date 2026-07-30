import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { auctionSearchSchema } from "./auction-search.schema";
import { buildAuctionListRequest } from "./build-auction-list-request";

const initialTimezone = import.meta.env.TZ;

describe("buildAuctionListRequest", () => {
  beforeAll(() => {
    vi.stubEnv("TZ", "Europe/Chisinau");
  });

  afterAll(() => {
    vi.unstubAllEnvs();
    expect(import.meta.env.TZ).toBe(initialTimezone);
  });

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

  it("uses exact winter and summer offsets for all date filters", () => {
    const search = auctionSearchSchema.parse({
      loadDateFrom: "2026-01-15",
      loadDateTo: "2026-01-16",
      unloadDateFrom: "2026-05-26",
      unloadDateTo: "2026-05-27",
      createDateFrom: "2026-06-01",
      createDateTo: "2026-06-02",
    });

    expect(buildAuctionListRequest(search)).toMatchObject({
      load_date_from: "2026-01-15T00:00:00+02:00",
      load_date_to: "2026-01-16T23:59:59.999+02:00",
      unload_date_from: "2026-05-26T00:00:00+03:00",
      unload_date_to: "2026-05-27T23:59:59.999+03:00",
      create_date_from: "2026-06-01T00:00:00+03:00",
      create_date_to: "2026-06-02T23:59:59.999+03:00",
    });
  });

  it("uses the offset active at each boundary on a DST transition day", () => {
    const search = auctionSearchSchema.parse({
      loadDateFrom: "2026-03-29",
      loadDateTo: "2026-03-29",
    });

    expect(buildAuctionListRequest(search)).toMatchObject({
      load_date_from: "2026-03-29T00:00:00+02:00",
      load_date_to: "2026-03-29T23:59:59.999+03:00",
    });
  });

  it("omits absent optional filters", () => {
    expect(buildAuctionListRequest(auctionSearchSchema.parse({}))).toEqual({
      page: 1,
      per_page: 10,
    });
  });
});
