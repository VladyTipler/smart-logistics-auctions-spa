import { expect, test } from "@playwright/test";

const unavailableAuctionUuid = "22222222-2222-4222-8222-222222222222";
const restrictedAuctionUuid = "33333333-3333-4333-8333-333333333333";
const hiddenHistoryAuctionUuid = "44444444-4444-4444-8444-444444444444";

test("blocks a direct bid route when the auction cannot accept bids", async ({
  page,
}) => {
  await page.goto(`/auctions/${unavailableAuctionUuid}/bet`);

  await expect(page).toHaveURL(`/auctions/${unavailableAuctionUuid}/bet`);
  await expect(
    page.getByRole("heading", { name: "Ставка недоступна" }),
  ).toBeVisible();
  await expect(
    page.getByRole("textbox", { name: "Сумма ставки" }),
  ).toHaveCount(0);
});

test("does not request bets when a direct history route is hidden", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const originalFetch = window.fetch.bind(window);
    Reflect.set(window, "__betHistoryRequestCount", 0);
    window.fetch = async (...args) => {
      const url = String(
        args[0] instanceof Request ? args[0].url : args[0],
      );
      if (/\/api\/v1\/auctions\/[^/]+\/bets(?:\?|$)/.test(url)) {
        Reflect.set(
          window,
          "__betHistoryRequestCount",
          Number(Reflect.get(window, "__betHistoryRequestCount")) + 1,
        );
      }
      return originalFetch(...args);
    };
  });

  await page.goto(`/auctions/${hiddenHistoryAuctionUuid}/bets`);

  await expect(
    page.getByRole("heading", { name: "История ставок скрыта" }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(() =>
        Number(Reflect.get(window, "__betHistoryRequestCount")),
      ),
    )
    .toBe(0);
});

test("omits guarded contacts, addresses, cargo value, and bid places", async ({
  page,
}) => {
  await page.addInitScript((auctionUuid) => {
    const originalFetch = window.fetch.bind(window);
    window.fetch = async (...args) => {
      const requestUrl = String(
        args[0] instanceof Request ? args[0].url : args[0],
      );
      const response = await originalFetch(...args);
      const url = new URL(requestUrl, window.location.origin);

      if (
        url.pathname === `/api/v1/auctions/${auctionUuid}` &&
        response.ok
      ) {
        const detail = await response.json();
        detail.trading.hide_points_address_and_contacts = true;
        detail.trading.no_view_cargo_price = true;
        detail.trading.hide_places = true;

        return new Response(JSON.stringify(detail), {
          headers: response.headers,
          status: response.status,
          statusText: response.statusText,
        });
      }

      return response;
    };
  }, restrictedAuctionUuid);

  await page.goto(`/auctions/${restrictedAuctionUuid}`);

  await expect(
    page.getByRole("heading", { name: "Аукцион SL-1003" }),
  ).toBeVisible();
  await expect(page.getByText("Бельцы", { exact: true })).toBeVisible();
  await expect(page.getByText("Яссы", { exact: true })).toBeVisible();
  await expect(page.getByText("Стоимость груза")).toHaveCount(0);
  await expect(page.getByText("Бельцы, Складская 1")).toHaveCount(0);
  await expect(page.getByText("Яссы, Терминальная 2")).toHaveCount(0);
  await expect(page.getByText("+37360000000")).toHaveCount(0);
  await expect(page.getByText("+37360000001")).toHaveCount(0);
  await expect(page.getByText("+37360000002")).toHaveCount(0);

  await page.goto(`/auctions/${restrictedAuctionUuid}/bets`);

  await expect(
    page.getByRole("heading", { name: "История ставок SL-1003" }),
  ).toBeVisible();
  await expect(
    page.getByRole("columnheader", { name: "Место" }),
  ).toHaveCount(0);
  await expect(page.getByText(/^Место \d+$/)).toHaveCount(0);
});
