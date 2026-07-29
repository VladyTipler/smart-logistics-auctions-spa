import { HttpResponse, delay, http } from "msw";
import {
  screen,
  waitFor,
  waitForElementToBeRemoved,
} from "@testing-library/react";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
} from "vitest";

import { server } from "@/shared/api/mocks/server";
import { auctionFixtures } from "@/shared/api/mocks/fixtures/auctions.fixture";
import { renderApp } from "@/shared/config/test/render-app";
import { auctionKeys } from "@/entities/auction/api/auction.queries";

const auctionUuid = "11111111-1111-4111-8111-111111111111";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("auction detail feature", () => {
  it("loads a direct detail URL through the router and stateful MSW backend", async () => {
    let detailRequests = 0;
    server.use(
      http.get("*/api/v1/auctions/:auctionUuid", async () => {
        detailRequests += 1;
        await delay(80);
        return HttpResponse.json(auctionFixtures[0].detail);
      }),
    );

    const { queryClient, router } = renderApp(`/auctions/${auctionUuid}`);

    expect(
      await screen.findByText("Загружаем условия перевозки…"),
    ).toBeInTheDocument();
    await waitForElementToBeRemoved(
      screen.getByText("Загружаем условия перевозки…"),
    );

    expect(
      screen.getByRole("heading", { name: "Аукцион SL-1001" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Все аукционы" })).not.toHaveAttribute(
      "aria-current",
    );
    expect(screen.getByText("Кишинёв")).toBeInTheDocument();
    expect(screen.getByText("Бухарест")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "32 000 ₽" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Сделать ставку" }),
    ).toHaveAttribute(
      "href",
      `/auctions/${auctionUuid}/bet`,
    );
    expect(
      screen.getByRole("link", { name: "Протокол торгов" }),
    ).toHaveAttribute("href", `/auctions/${auctionUuid}/bets`);
    expect(queryClient.getQueryData(auctionKeys.detail(auctionUuid))).toEqual(
      auctionFixtures[0].detail,
    );
    expect(router.options.context.queryClient).toBe(queryClient);
    expect(detailRequests).toBe(1);

    const cacheUpdate = structuredClone(auctionFixtures[0].detail);
    cacheUpdate.trading.price!.current = 24_590.16;
    queryClient.setQueryData(
      auctionKeys.detail(auctionUuid),
      cacheUpdate,
    );

    expect(
      await screen.findByRole("heading", {
        level: 2,
        name: "24 590,16 ₽",
      }),
    ).toBeInTheDocument();
    expect(detailRequests).toBe(1);

    const refetched = structuredClone(cacheUpdate);
    refetched.trading.price!.current = 24_000;
    server.use(
      http.get("*/api/v1/auctions/:auctionUuid", () => {
        detailRequests += 1;
        return HttpResponse.json(refetched);
      }),
    );
    await queryClient.invalidateQueries({
      queryKey: auctionKeys.detail(auctionUuid),
    });

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { level: 2, name: "24 000 ₽" }),
      ).toBeInTheDocument();
    });
    expect(detailRequests).toBe(2);
  });

  it("renders the auction not-found state for an unknown direct link", async () => {
    renderApp("/auctions/99999999-9999-4999-8999-999999999999");

    expect(
      await screen.findByRole("heading", { name: "Аукцион не найден" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Вернуться к аукционам" }),
    ).toHaveAttribute("href", "/auctions");
  });

  it("never renders fields removed by the access policy", async () => {
    const restricted = structuredClone(auctionFixtures[0].detail);
    restricted.trading.hide_points_address_and_contacts = true;
    restricted.trading.no_view_cargo_price = true;
    restricted.trading.can_set_bet = false;
    restricted.contacts = [
      { name: "Скрытый организатор", phone: "+37360000111" },
    ];

    server.use(
      http.get("*/api/v1/auctions/:auctionUuid", () =>
        HttpResponse.json(restricted),
      ),
    );

    renderApp(`/auctions/${auctionUuid}`);

    expect(await screen.findByText("Кишинёв")).toBeInTheDocument();
    expect(screen.getByText("Бухарест")).toBeInTheDocument();
    expect(screen.queryByText("Кишинёв, Складская 1")).not.toBeInTheDocument();
    expect(screen.queryByText("Иван")).not.toBeInTheDocument();
    expect(screen.queryByText("Скрытый организатор")).not.toBeInTheDocument();
    expect(screen.queryByText("150 000 ₽")).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "32 000 ₽" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Сделать ставку" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Протокол торгов" }),
    ).toHaveAttribute("href", `/auctions/${auctionUuid}/bets`);
    expect(screen.getByText("Ставка сейчас недоступна")).toBeInTheDocument();
  });

  it("does not expose the history route when history is guarded", async () => {
    const restricted = structuredClone(auctionFixtures[0].detail);
    restricted.hide_bets_history = true;

    server.use(
      http.get("*/api/v1/auctions/:auctionUuid", () =>
        HttpResponse.json(restricted),
      ),
    );

    renderApp(`/auctions/${auctionUuid}`);

    expect(
      await screen.findByRole("heading", { name: "Аукцион SL-1001" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Протокол торгов" }),
    ).not.toBeInTheDocument();
  });
});
