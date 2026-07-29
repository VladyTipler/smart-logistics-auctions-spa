import { delay, HttpResponse, http } from "msw";
import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";

import { auctionListQueryOptions } from "@/entities/auction/api/auction.queries";
import { auctionBetHistoryQueryOptions } from "@/entities/bet/api/bet.queries";
import { auctionFixtures } from "@/shared/api/mocks/fixtures/auctions.fixture";
import {
  createAuctionBet,
  resetMockDatabase,
} from "@/shared/api/mocks/mock-database";
import { server } from "@/shared/api/mocks/server";
import { renderApp } from "@/shared/config/test/render-app";

const auctionUuid = "11111111-1111-4111-8111-111111111111";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
beforeEach(() => resetMockDatabase());
afterEach(() => {
  server.resetHandlers();
  server.events.removeAllListeners();
});
afterAll(() => server.close());

describe("auction place-bid feature", () => {
  it("places a bid from a direct route and synchronises detail, history, and list", async () => {
    const user = userEvent.setup();
    const { queryClient, router } = renderApp(
      `/auctions/${auctionUuid}/bet`,
    );

    expect(
      await screen.findByRole("heading", { name: "Ставка на SL-1001" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Кишинёв → Бухарест")).toBeInTheDocument();

    await Promise.all([
      queryClient.fetchQuery(auctionListQueryOptions({ page: 1, per_page: 10 })),
      queryClient.fetchQuery(auctionBetHistoryQueryOptions(auctionUuid)),
    ]);

    const input = screen.getByRole("textbox", { name: "Сумма ставки" });
    await user.clear(input);
    await user.type(input, "31000");
    await user.click(screen.getByRole("button", { name: "Сделать ставку" }));

    expect(
      await screen.findByRole("status", {
        name: "Ставка принята",
      }),
    ).toHaveTextContent("31 000 ₽");

    await act(async () => {
      await router.navigate({
        to: "/auctions/$auctionUuid",
        params: { auctionUuid },
      });
    });
    const tradingPanel = await screen.findByRole("complementary", {
      name: "31 000 ₽",
    });
    expect(within(tradingPanel).getByText(/Ваша ставка/)).toHaveTextContent(
      "31 000 ₽",
    );

    await act(async () => {
      await router.navigate({
        to: "/auctions/$auctionUuid/bets",
        params: { auctionUuid },
      });
    });
    expect(
      await screen.findByRole("heading", {
        name: "История ставок SL-1001",
      }),
    ).toBeInTheDocument();
    const history = screen.getByLabelText("Таблица ставок");
    const ownBidRow = within(history)
      .getByText("ООО Перевозчик")
      .closest("tr");
    expect(ownBidRow).not.toBeNull();
    expect(within(ownBidRow!).getByText("31 000 ₽")).toBeInTheDocument();
    expect(within(ownBidRow!).getByText("1")).toBeInTheDocument();

    await act(async () => {
      await router.navigate({
        to: "/auctions",
        search: { page: 1, perPage: 10 },
      });
    });
    const cardAction = await screen.findByRole("link", {
      name: /Сделать ставку: SL-1001/,
    });
    const card = cardAction.closest("article");
    expect(card).not.toBeNull();
    expect(within(card!).getByText("31 000 ₽")).toBeInTheDocument();
    expect(within(card!).getByText("Лидируете")).toBeInTheDocument();
    expect(within(card!).getByText("Ваша ставка 31 000 ₽")).toBeInTheDocument();
  });

  it("blocks client-invalid prices without sending a mutation", async () => {
    let mutationRequests = 0;
    server.events.on("request:start", ({ request }) => {
      if (
        request.method === "POST" &&
        new URL(request.url).pathname.endsWith(`/auctions/${auctionUuid}/bets`)
      ) {
        mutationRequests += 1;
      }
    });
    const user = userEvent.setup();
    renderApp(`/auctions/${auctionUuid}/bet`);

    const input = await screen.findByRole("textbox", {
      name: "Сумма ставки",
    });
    await user.clear(input);
    await user.type(input, "31250");
    await user.click(screen.getByRole("button", { name: "Сделать ставку" }));

    expect(
      await screen.findByText("Соблюдайте шаг ставки 500"),
    ).toBeInTheDocument();
    expect(mutationRequests).toBe(0);
  });

  it("maps a server 422 field error and preserves the entered value", async () => {
    server.use(
      http.post("*/api/v1/auctions/:auctionUuid/bets", () =>
        HttpResponse.json(
          {
            code: "validation_failed",
            title: "Ошибка валидации",
            message: "Цена изменилась во время отправки.",
            errors: [
              {
                code: "next_price_not_reached",
                field: "price",
                message: "Доступная цена уже 30 500 ₽.",
              },
            ],
          },
          {
            status: 422,
            headers: { "Content-Type": "application/problem+json" },
          },
        ),
      ),
    );
    const user = userEvent.setup();
    renderApp(`/auctions/${auctionUuid}/bet`);

    const input = await screen.findByRole("textbox", {
      name: "Сумма ставки",
    });
    await user.clear(input);
    await user.type(input, "31000");
    await user.click(screen.getByRole("button", { name: "Сделать ставку" }));

    expect(
      await screen.findByText("Доступная цена уже 30 500 ₽."),
    ).toBeInTheDocument();
    expect(input).toHaveValue("31000");
  });

  it("renders unavailable from central access policy and sends no mutation", async () => {
    let mutationRequests = 0;
    const restricted = structuredClone(auctionFixtures[0].detail);
    restricted.trading.can_set_bet = false;
    server.use(
      http.get("*/api/v1/auctions/:auctionUuid", () =>
        HttpResponse.json(restricted),
      ),
      http.post("*/api/v1/auctions/:auctionUuid/bets", () => {
        mutationRequests += 1;
        return new HttpResponse(null, { status: 200 });
      }),
    );

    renderApp(`/auctions/${auctionUuid}/bet`);

    expect(
      await screen.findByRole("heading", { name: "Ставка недоступна" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("textbox", { name: "Сумма ставки" }),
    ).not.toBeInTheDocument();
    expect(mutationRequests).toBe(0);
  });

  it("prevents a duplicate mutation while submission is pending", async () => {
    let mutationRequests = 0;
    server.use(
      http.post("*/api/v1/auctions/:auctionUuid/bets", async () => {
        mutationRequests += 1;
        await delay(80);
        createAuctionBet(auctionUuid, 31_000);
        return new HttpResponse(null, { status: 200 });
      }),
    );
    const user = userEvent.setup();
    renderApp(`/auctions/${auctionUuid}/bet`);

    const input = await screen.findByRole("textbox", {
      name: "Сумма ставки",
    });
    await user.clear(input);
    await user.type(input, "31000");
    const submit = screen.getByRole("button", { name: "Сделать ставку" });
    await user.dblClick(submit);

    await waitFor(() => expect(submit).toBeDisabled());
    expect(
      await screen.findByRole("status", { name: "Ставка принята" }),
    ).toBeInTheDocument();
    expect(mutationRequests).toBe(1);
  });
});
