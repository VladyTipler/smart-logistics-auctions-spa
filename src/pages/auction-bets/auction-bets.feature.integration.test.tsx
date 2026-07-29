import { HttpResponse, http } from "msw";
import { screen, waitFor, within } from "@testing-library/react";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";

import { betKeys } from "@/entities/bet/api/bet.queries";
import { auctionFixtures } from "@/shared/api/mocks/fixtures/auctions.fixture";
import { resetMockDatabase } from "@/shared/api/mocks/mock-database";
import { server } from "@/shared/api/mocks/server";
import { renderApp } from "@/shared/config/test/render-app";

const auctionUuid = "11111111-1111-4111-8111-111111111111";
const missingUuid = "99999999-9999-4999-8999-999999999999";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
beforeEach(() => resetMockDatabase());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("auction bid history feature", () => {
  it("loads the direct route, requests all bids, and shares the router QueryClient cache", async () => {
    let allParameter: string | null = null;
    let betsRequests = 0;
    server.use(
      http.get("*/api/v1/auctions/:auctionUuid/bets", ({ request }) => {
        betsRequests += 1;
        allParameter = new URL(request.url).searchParams.get("all");
        return HttpResponse.json({
          bets: [
            {
              id: 1,
              subscriber_id: 77,
              organization_name: "Fast Freight",
              contact_name: "Пётр",
              created_at: "2026-07-29T12:00:00+03:00",
              price_with_vat: 32_000,
              price_no_vat: 32_000 / 1.2,
              place: 1,
              is_win: true,
              price_info: {
                payment_type: "Безналичная с НДС",
                vat_rate: "20",
              },
            },
            {
              id: 2,
              subscriber_id: 88,
              organization_name: "Road Runner",
              price_with_vat: 29_000,
              price_no_vat: 29_000 / 1.2,
              is_rejected: true,
              cancel_reason: "Отменена участником",
            },
          ],
        });
      }),
    );

    const { queryClient } = renderApp(`/auctions/${auctionUuid}/bets`);

    expect(
      await screen.findByRole("heading", {
        name: "История ставок SL-1001",
      }),
    ).toBeInTheDocument();
    expect(allParameter).toBe("true");
    expect(queryClient.getQueryData(betKeys.byAuction(auctionUuid))).toEqual(
      expect.objectContaining({ bets: expect.any(Array) }),
    );
    expect(betsRequests).toBe(1);
    expect(screen.getByText("2 участника")).toBeInTheDocument();

    const desktop = screen.getByLabelText("Таблица ставок");
    const table = within(desktop).getByRole("table");
    expect(
      within(table).getByRole("columnheader", { name: "Участник" }),
    ).toBeInTheDocument();
    expect(within(table).getByText("Fast Freight")).toBeInTheDocument();
    expect(within(table).getByText("32 000 ₽")).toBeInTheDocument();
    expect(within(table).getByText("26 666,67 ₽")).toBeInTheDocument();
    expect(within(table).getByText("Победитель")).toBeInTheDocument();
    expect(within(table).getByText("Отменена")).toBeInTheDocument();
    expect(
      within(table).getByText("Отменена участником"),
    ).toBeInTheDocument();

    const mobile = screen.getByLabelText("Карточки ставок");
    const cards = within(mobile).getAllByRole("listitem");
    expect(cards).toHaveLength(2);
    expect(within(cards[0]).getByText("Fast Freight")).toBeInTheDocument();
    expect(within(cards[0]).getByText("Место 1")).toBeInTheDocument();
    expect(within(cards[0]).getByText("32 000 ₽")).toBeInTheDocument();

    server.use(
      http.get("*/api/v1/auctions/:auctionUuid/bets", ({ request }) => {
        betsRequests += 1;
        allParameter = new URL(request.url).searchParams.get("all");
        return HttpResponse.json({
          bets: [
            {
              id: 3,
              subscriber_id: 99,
              organization_name: "Fresh Carrier",
              price_with_vat: 27_500,
              price_no_vat: 22_916.67,
              place: 1,
            },
          ],
        });
      }),
    );
    await queryClient.invalidateQueries({
      queryKey: betKeys.byAuction(auctionUuid),
    });

    expect(await screen.findAllByText("Fresh Carrier")).toHaveLength(2);
    await waitFor(() => expect(betsRequests).toBe(2));
    expect(allParameter).toBe("true");
    expect(screen.queryByText("Fast Freight")).not.toBeInTheDocument();
  });

  it("renders an explicit empty history", async () => {
    server.use(
      http.get("*/api/v1/auctions/:auctionUuid/bets", () =>
        HttpResponse.json({ bets: [] }),
      ),
    );

    renderApp(`/auctions/${auctionUuid}/bets`);

    expect(
      await screen.findByRole("heading", { name: "Ставок пока нет" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Первая ставка появится здесь после начала торгов."),
    ).toBeInTheDocument();
  });

  it.each([
    ["root-only", true, false],
    ["nested-only", false, true],
  ])(
    "does not request bets when the %s history guard hides access",
    async (_name, rootHidden, nestedHidden) => {
      let betsRequests = 0;
      const restricted = structuredClone(auctionFixtures[0].detail);
      restricted.hide_bets_history = rootHidden;
      restricted.trading.hide_bets_history = nestedHidden;
      server.use(
        http.get("*/api/v1/auctions/:auctionUuid", () =>
          HttpResponse.json(restricted),
        ),
        http.get("*/api/v1/auctions/:auctionUuid/bets", () => {
          betsRequests += 1;
          return HttpResponse.json({ bets: [] });
        }),
      );

      renderApp(`/auctions/${auctionUuid}/bets`);

      expect(
        await screen.findByRole("heading", {
          name: "История ставок скрыта",
        }),
      ).toBeInTheDocument();
      expect(betsRequests).toBe(0);
    },
  );

  it("does not expose places when the central access policy hides them", async () => {
    const restricted = structuredClone(auctionFixtures[0].detail);
    restricted.trading.hide_places = true;
    server.use(
      http.get("*/api/v1/auctions/:auctionUuid", () =>
        HttpResponse.json(restricted),
      ),
    );

    renderApp(`/auctions/${auctionUuid}/bets`);

    expect(
      await screen.findByRole("heading", {
        name: "История ставок SL-1001",
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("columnheader", { name: "Место" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/^Место \d+$/)).not.toBeInTheDocument();
  });

  it("renders the auction not-found state for an unknown direct link", async () => {
    renderApp(`/auctions/${missingUuid}/bets`);

    expect(
      await screen.findByRole("heading", { name: "Аукцион не найден" }),
    ).toBeInTheDocument();
  });
});
