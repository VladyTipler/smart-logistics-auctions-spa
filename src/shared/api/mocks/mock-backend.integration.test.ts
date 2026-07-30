import { setupServer } from "msw/node";

import type {
  AuctionDetail,
  AuctionListRequest,
  AuctionListResponse,
  BetListResponse,
  SetBetRequest,
} from "../contracts";
import { createHttpClient } from "../http-client";
import { handlers } from "./handlers";
import * as mockDatabase from "./mock-database";
import {
  queryAuctionBets,
  queryAuctionDetail,
  queryAuctionList,
  resetMockDatabase,
} from "./mock-database";

const API_ORIGIN = "http://localhost";
const ALLOWED_AUCTION_UUID = "11111111-1111-4111-8111-111111111111";
const HIDDEN_HISTORY_UUID = "44444444-4444-4444-8444-444444444444";
const FORBIDDEN_AUCTION_UUID = "55555555-5555-4555-8555-555555555555";

const client = createHttpClient({
  baseUrl: `${API_ORIGIN}/api/v1`,
});
const server = setupServer(...handlers);

function listAuctions(body: AuctionListRequest = {}) {
  return client.post<AuctionListResponse, AuctionListRequest>(
    "/auctions/list",
    body,
  );
}

function getAuction(uuid: string) {
  return client.get<AuctionDetail>(`/auctions/${uuid}`);
}

function getBets(uuid: string, all = false) {
  return client.get<BetListResponse>(
    `/auctions/${uuid}/bets${all ? "?all=true" : ""}`,
  );
}

function setBet(uuid: string, body: SetBetRequest) {
  return client.post<undefined, SetBetRequest>(
    `/auctions/${uuid}/bets`,
    body,
  );
}

async function getAuctionState(uuid: string) {
  const [list, detail, history] = await Promise.all([
    listAuctions({ cargo_num: "SL-1001" }),
    getAuction(uuid),
    getBets(uuid, true),
  ]);

  return { list, detail, history };
}

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
beforeEach(() => resetMockDatabase());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("stateful auction mock backend", () => {
  it("returns a contract-shaped auction page", async () => {
    const response = await listAuctions({ page: 1, per_page: 2 });

    expect(response.data).toHaveLength(2);
    expect(response.data?.[0]).toMatchObject({
      main: {
        order_uid: expect.any(String),
        cargo_num: expect.any(String),
      },
      route: {
        load: { city: expect.any(String) },
        unload: { city: expect.any(String) },
      },
      trading: {
        status: expect.any(String),
        price: { current: expect.any(Number) },
      },
    });
    expect(response.meta).toEqual({
      current_page: 1,
      from: 1,
      last_page: 9,
      per_page: 2,
      to: 2,
      total: 18,
    });
  });

  it("treats an omitted optional list body as empty filters", async () => {
    const response = await client.post<AuctionListResponse>("/auctions/list");

    expect(response.data).toHaveLength(18);
    expect(response.meta).toMatchObject({
      current_page: 1,
      per_page: 20,
      total: 18,
    });
  });

  it.each([
    ["null", null],
    ["an array", []],
    ["a string", "all"],
  ])("returns 422 ValidationProblem when list body is %s", async (_name, body) => {
    await expect(
      client.post<AuctionListResponse, unknown>("/auctions/list", body),
    ).rejects.toMatchObject({
      status: 422,
      problem: {
        code: "validation_failed",
        errors: [
          {
            field: "body",
            code: "invalid_type",
          },
        ],
      },
    });
  });

  it("returns 422 ValidationProblem for malformed list JSON", async () => {
    const response = await fetch(`${API_ORIGIN}/api/v1/auctions/list`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{malformed",
    });

    expect(response.status).toBe(422);
    expect(response.headers.get("content-type")).toContain(
      "application/problem+json",
    );
    await expect(response.json()).resolves.toMatchObject({
      code: "validation_failed",
      errors: [{ field: "body", code: "invalid_json" }],
    });
  });

  it("paginates without changing the deterministic source order", async () => {
    const firstPage = await listAuctions({ page: 1, per_page: 2 });
    const secondPage = await listAuctions({ page: 2, per_page: 2 });

    expect(secondPage.data).toHaveLength(2);
    expect(secondPage.meta).toMatchObject({
      current_page: 2,
      from: 3,
      to: 4,
      total: 18,
    });
    expect(secondPage.data?.[0]?.main?.order_uid).not.toBe(
      firstPage.data?.[0]?.main?.order_uid,
    );
  });

  it("returns the final eight auctions in deterministic order on default page 2", async () => {
    const response = await listAuctions({ page: 2, per_page: 10 });

    expect(response.data?.map((auction) => auction.main?.cargo_num)).toEqual([
      "SL-1011",
      "SL-1012",
      "SL-1013",
      "SL-1014",
      "SL-1015",
      "SL-1016",
      "SL-1017",
      "SL-1018",
    ]);
    expect(response.meta).toEqual({
      current_page: 2,
      from: 11,
      last_page: 2,
      per_page: 10,
      to: 18,
      total: 18,
    });
  });

  it.each([
    ["cargo_num", { cargo_num: "SL-1001" }],
    ["status", { status: ["NotParticipating"] }],
    ["statuses", { statuses: [2] }],
    ["auc_type", { auc_type: ["Down"] }],
    ["load_city", { load_city: "Кишинёв" }],
    ["unload_city", { unload_city: "Бухарест" }],
    [
      "load_date_from/to",
      {
        load_date_from: "2026-08-01T00:00:00+03:00",
        load_date_to: "2026-08-01T23:59:59+03:00",
      },
    ],
    ["is_available", { is_available: true }],
    ["is_bidder", { is_bidder: false }],
    [
      "current_price_from/to",
      { current_price_from: 31_500, current_price_to: 32_500 },
    ],
  ] satisfies [string, AuctionListRequest][])(
    "applies the %s filter",
    async (_name, filter) => {
      const response = await listAuctions({ ...filter, per_page: 100 });

      expect(response.data).toHaveLength(1);
      expect(response.data?.[0]?.main?.order_uid).toBe(ALLOWED_AUCTION_UUID);
      expect(response.meta?.total).toBe(1);
    },
  );

  it("resolves detail by main.order_uid", async () => {
    const detail = await getAuction(ALLOWED_AUCTION_UUID);

    expect(detail.main).toMatchObject({
      id: 101,
      cargo_num: "SL-1001",
      order_uid: ALLOWED_AUCTION_UUID,
    });
    expect(detail.routes).toHaveLength(2);
  });

  it("includes rejected or cancelled bids only when all=true", async () => {
    const active = await getBets(ALLOWED_AUCTION_UUID);
    const all = await getBets(ALLOWED_AUCTION_UUID, true);

    expect(active.bets).not.toContainEqual(
      expect.objectContaining({ is_rejected: true }),
    );
    expect(active.bets.some((bet) => Boolean(bet.cancel_reason))).toBe(false);
    expect(all.bets).toContainEqual(
      expect.objectContaining({ is_rejected: true }),
    );
    expect(all.bets.length).toBeGreaterThan(active.bets.length);
  });

  it("returns no fixture data when bid history is hidden", async () => {
    await expect(getBets(HIDDEN_HISTORY_UUID, true)).resolves.toEqual({
      bets: [],
    });
  });

  it("updates list, detail, history, user status, availability, and ranks after a bid", async () => {
    const before = await listAuctions({ cargo_num: "SL-1001" });
    const previousBidIds = (await getBets(ALLOWED_AUCTION_UUID, true)).bets.map(
      (bet) => bet.id,
    );

    await expect(
      setBet(ALLOWED_AUCTION_UUID, { price: 27_000 }),
    ).resolves.toBeUndefined();

    const [list, detail, history] = await Promise.all([
      listAuctions({ cargo_num: "SL-1001" }),
      getAuction(ALLOWED_AUCTION_UUID),
      getBets(ALLOWED_AUCTION_UUID, true),
    ]);
    const newBid = history.bets.find((bet) => !previousBidIds.includes(bet.id));

    expect(before.data?.[0]?.trading?.price?.current).toBe(32_000);
    expect(list.data?.[0]?.trading).toMatchObject({
      status_mobile: "Leading",
      is_bidder: true,
      price: { current: 27_000 },
      your: { bet: true, last_bet: 27_000 },
    });
    expect(detail.trading).toMatchObject({
      status_mobile: "Leading",
      is_bidder: true,
      price: { current: 27_000, available: 26_500 },
      your: {
        bet: true,
        last_bet: 27_000,
        last_bet_with_vat: 27_000,
      },
    });
    expect(newBid).toMatchObject({
      subscriber_id: 13,
      price_with_vat: 27_000,
      place: 1,
      is_rejected: false,
    });
    expect(
      history.bets.find((bet) => bet.subscriber_id === 77 && !bet.is_rejected),
    ).toMatchObject({ place: 2 });
  });

  it.each([
    ["repeated current price", 32_000, "bid_not_improving"],
    ["a worse price", 32_500, "bid_not_improving"],
    ["an out-of-range price", 500, "out_of_range"],
    ["a price before the available threshold", 31_750, "next_price_not_reached"],
    ["an off-step price", 31_250, "invalid_step"],
  ])(
    "rejects %s without mutating any auction snapshot",
    async (_name, price, code) => {
      const before = await getAuctionState(ALLOWED_AUCTION_UUID);

      await expect(
        setBet(ALLOWED_AUCTION_UUID, { price }),
      ).rejects.toMatchObject({
        status: 422,
        problem: {
          code: "validation_failed",
          errors: [{ field: "price", code }],
        },
      });

      await expect(getAuctionState(ALLOWED_AUCTION_UUID)).resolves.toEqual(
        before,
      );
    },
  );

  it("stops bidding at the lower bound without producing negative availability", async () => {
    await setBet(ALLOWED_AUCTION_UUID, { price: 1_000 });

    const state = await getAuctionState(ALLOWED_AUCTION_UUID);

    expect(state.list.data?.[0]?.trading).toMatchObject({
      can_set_bet: false,
      is_available: false,
      price: { current: 1_000 },
    });
    expect(state.detail.trading).toMatchObject({
      can_set_bet: false,
      price: { current: 1_000, available: 1_000 },
    });
    await expect(
      setBet(ALLOWED_AUCTION_UUID, { price: 500 }),
    ).rejects.toMatchObject({
      status: 403,
      problem: { code: "bet_not_allowed" },
    });
  });

  it.each([
    ["zero", { price: 0 }],
    ["negative", { price: -100 }],
    ["not finite", { price: Number.POSITIVE_INFINITY }],
  ])("returns 422 ValidationProblem for a %s bid", async (_name, body) => {
    await expect(setBet(ALLOWED_AUCTION_UUID, body)).rejects.toMatchObject({
      status: 422,
      problem: {
        code: "validation_failed",
        title: "Ошибка валидации",
        errors: [
          {
            field: "price",
            code: "min_value",
          },
        ],
      },
    });
  });

  it("enforces can_set_bet at the HTTP boundary", async () => {
    await expect(
      setBet(FORBIDDEN_AUCTION_UUID, { price: 10_000 }),
    ).rejects.toMatchObject({
      status: 403,
      problem: {
        code: "bet_not_allowed",
        title: "Ставка недоступна",
        errors: [],
      },
    });
  });

  it("treats an existing auction with omitted can_set_bet as forbidden", async () => {
    await expect(
      setBet(HIDDEN_HISTORY_UUID, { price: 70_000 }),
    ).rejects.toMatchObject({
      status: 403,
      problem: {
        code: "bet_not_allowed",
        title: "Ставка недоступна",
      },
    });
  });

  it.each(["detail", "bets", "set-bet"])(
    "returns 404 ProblemDetail for unknown auction %s requests",
    async (requestKind) => {
      const missingUuid = "99999999-9999-4999-8999-999999999999";
      const request =
        requestKind === "detail"
          ? getAuction(missingUuid)
          : requestKind === "bets"
            ? getBets(missingUuid)
            : setBet(missingUuid, { price: 10_000 });

      await expect(request).rejects.toMatchObject({
        status: 404,
        problem: {
          code: "resource_not_found",
          title: "Не найдено",
          message: "Аукцион не найден",
        },
      });
    },
  );

  it("resets all mutable state and monotonic bid IDs deterministically", async () => {
    await setBet(ALLOWED_AUCTION_UUID, { price: 27_000 });
    const mutated = await getBets(ALLOWED_AUCTION_UUID, true);
    const mutatedId = Math.max(...mutated.bets.map((bet) => bet.id ?? 0));

    resetMockDatabase();
    const resetDetail = await getAuction(ALLOWED_AUCTION_UUID);
    await setBet(ALLOWED_AUCTION_UUID, { price: 27_000 });
    const replayed = await getBets(ALLOWED_AUCTION_UUID, true);
    const replayedId = Math.max(...replayed.bets.map((bet) => bet.id ?? 0));

    expect(resetDetail.trading).toMatchObject({
      status_mobile: "NotParticipating",
      price: { current: 32_000, available: 31_500 },
      your: { bet: false, last_bet: null },
    });
    expect(replayedId).toBe(mutatedId);
  });

  it("does not expose raw mutable collections", () => {
    expect(Object.values(mockDatabase)).toEqual(
      expect.arrayContaining([expect.any(Function)]),
    );
    expect(
      Object.values(mockDatabase).every((value) => typeof value === "function"),
    ).toBe(true);
  });

  it("isolates database list, detail, and bets operation snapshots", () => {
    const list = queryAuctionList({ cargo_num: "SL-1001" });
    const detail = queryAuctionDetail(ALLOWED_AUCTION_UUID);
    const history = queryAuctionBets(ALLOWED_AUCTION_UUID, true);

    if (list.data?.[0]?.main) {
      list.data[0].main.cargo_num = "MUTATED";
    }
    if (detail) {
      detail.main.cargo_num = "MUTATED";
      detail.trading.price = { current: -1 };
    }
    if (history?.bets[0]) {
      history.bets[0].price_with_vat = -1;
    }
    history?.bets.push({ id: -1 });

    const freshList = queryAuctionList({ cargo_num: "SL-1001" });
    const freshDetail = queryAuctionDetail(ALLOWED_AUCTION_UUID);
    const freshHistory = queryAuctionBets(ALLOWED_AUCTION_UUID, true);

    expect(freshList.data?.[0]?.main?.cargo_num).toBe("SL-1001");
    expect(freshDetail?.main.cargo_num).toBe("SL-1001");
    expect(freshDetail?.trading.price?.current).toBe(32_000);
    expect(freshHistory?.bets[0]?.price_with_vat).toBe(32_000);
    expect(freshHistory?.bets).not.toContainEqual({ id: -1 });
  });
});
