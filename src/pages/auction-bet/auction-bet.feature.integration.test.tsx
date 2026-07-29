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
const listRequest = { page: 1, per_page: 10 } as const;
const listQueryKey = ["auctions", "list", listRequest] as const;
const detailQueryKey = ["auctions", "detail", auctionUuid] as const;
const betQueryKey = ["bets", "auction", auctionUuid] as const;

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

    await act(async () => {
      await Promise.all([
        queryClient.fetchQuery(
          auctionListQueryOptions(listRequest),
        ),
        queryClient.fetchQuery(auctionBetHistoryQueryOptions(auctionUuid)),
      ]);
    });

    const input = screen.getByRole("textbox", { name: "Сумма ставки" });
    await user.clear(input);
    await user.type(input, "31000");
    await user.click(screen.getByRole("button", { name: "Сделать ставку" }));

    const successToast = await screen.findByRole("dialog", {
      name: "Ставка принята",
    });
    expect(
      within(successToast).getByRole("heading", {
        name: "Ставка принята",
      }),
    ).toBeInTheDocument();
    expect(successToast).toHaveTextContent("31 000 ₽");

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

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Соблюдайте шаг ставки 500",
    );
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

  it("uses a sanitised non-RUB currency suffix from auction detail", async () => {
    const usdAuction = structuredClone(auctionFixtures[0].detail);
    usdAuction.payment.currency_code = "USD";
    server.use(
      http.get("*/api/v1/auctions/:auctionUuid", () =>
        HttpResponse.json(usdAuction),
      ),
    );

    renderApp(`/auctions/${auctionUuid}/bet`);

    expect(
      await screen.findByRole("heading", { name: "Ставка на SL-1001" }),
    ).toBeInTheDocument();
    const input = screen.getByRole("textbox", { name: "Сумма ставки" });
    expect(input.parentElement).toHaveTextContent("$");
    expect(input.parentElement).not.toHaveTextContent("₽");
    expect(
      screen.getByText(/Следующая доступная цена/),
    ).toHaveTextContent("$");
  });

  it("keeps input and cached state unchanged after a real server 403", async () => {
    server.use(
      http.post("*/api/v1/auctions/:auctionUuid/bets", () =>
        HttpResponse.json(
          {
            code: "bet_not_allowed",
            title: "Ставка недоступна",
            message: "В этом аукционе нельзя установить ставку",
          },
          {
            status: 403,
            headers: { "Content-Type": "application/problem+json" },
          },
        ),
      ),
    );
    const user = userEvent.setup();
    const { queryClient } = renderApp(`/auctions/${auctionUuid}/bet`);
    await act(async () => {
      await Promise.all([
        queryClient.fetchQuery(
          auctionListQueryOptions(listRequest),
        ),
        queryClient.fetchQuery(auctionBetHistoryQueryOptions(auctionUuid)),
      ]);
    });
    const stateBefore = structuredClone({
      bets: queryClient.getQueryData(betQueryKey),
      detail: queryClient.getQueryData(detailQueryKey),
      list: queryClient.getQueryData(listQueryKey),
    });
    const input = await screen.findByRole("textbox", {
      name: "Сумма ставки",
    });
    await user.clear(input);
    await user.type(input, "31000");
    await user.click(screen.getByRole("button", { name: "Сделать ставку" }));

    expect(
      await screen.findByText(
        "Ставка больше недоступна. Обновите условия аукциона.",
      ),
    ).toBeInTheDocument();
    expect(input).toHaveValue("31000");
    expect(
      within(screen.getByTestId("app-toast-viewport")).queryByRole("heading", {
        name: "Ставка принята",
      }),
    ).not.toBeInTheDocument();
    expect(
      queryClient.getQueryState(detailQueryKey)?.isInvalidated,
    ).toBe(false);
    expect(
      queryClient.getQueryState(listQueryKey)?.isInvalidated,
    ).toBe(false);
    expect(
      queryClient.getQueryState(betQueryKey)?.isInvalidated,
    ).toBe(false);
    expect({
      bets: queryClient.getQueryData(betQueryKey),
      detail: queryClient.getQueryData(detailQueryKey),
      list: queryClient.getQueryData(listQueryKey),
    }).toEqual(stateBefore);
  });

  it("keeps input and cached state unchanged after a real network error", async () => {
    server.use(
      http.post("*/api/v1/auctions/:auctionUuid/bets", () =>
        HttpResponse.error(),
      ),
    );
    const user = userEvent.setup();
    const { queryClient } = renderApp(`/auctions/${auctionUuid}/bet`);
    await act(async () => {
      await Promise.all([
        queryClient.fetchQuery(
          auctionListQueryOptions(listRequest),
        ),
        queryClient.fetchQuery(auctionBetHistoryQueryOptions(auctionUuid)),
      ]);
    });
    const stateBefore = structuredClone({
      bets: queryClient.getQueryData(betQueryKey),
      detail: queryClient.getQueryData(detailQueryKey),
      list: queryClient.getQueryData(listQueryKey),
    });
    const input = await screen.findByRole("textbox", {
      name: "Сумма ставки",
    });
    await user.clear(input);
    await user.type(input, "31000");
    await user.click(screen.getByRole("button", { name: "Сделать ставку" }));

    expect(
      await screen.findByText(
        "Не удалось отправить ставку. Попробуйте ещё раз.",
      ),
    ).toBeInTheDocument();
    expect(input).toHaveValue("31000");
    expect(
      within(screen.getByTestId("app-toast-viewport")).queryByRole("heading", {
        name: "Ставка принята",
      }),
    ).not.toBeInTheDocument();
    expect(
      queryClient.getQueryState(detailQueryKey)?.isInvalidated,
    ).toBe(false);
    expect(
      queryClient.getQueryState(listQueryKey)?.isInvalidated,
    ).toBe(false);
    expect(
      queryClient.getQueryState(betQueryKey)?.isInvalidated,
    ).toBe(false);
    expect({
      bets: queryClient.getQueryData(betQueryKey),
      detail: queryClient.getQueryData(detailQueryKey),
      list: queryClient.getQueryData(listQueryKey),
    }).toEqual(stateBefore);
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
      within(
        await screen.findByRole("dialog", { name: "Ставка принята" }),
      ).getByRole("heading", { name: "Ставка принята" }),
    ).toBeInTheDocument();
    expect(mutationRequests).toBe(1);
  });
});
