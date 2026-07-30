import { expect, test } from "@playwright/test";

import { PAGES_REPOSITORY_BASE_PATH } from "../pages.config";

const auctionUuid = "11111111-1111-4111-8111-111111111111";

type ApiResponse = {
  fromServiceWorker: boolean;
  method: string;
  path: string;
  status: number;
};

test("keeps the stateful Pages demo functional across hash navigation and reload", async ({
  page,
}, testInfo) => {
  const apiResponses: ApiResponse[] = [];
  const apiFailures: string[] = [];
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];

  page.on("response", (response) => {
    const url = new URL(response.url());

    if (url.pathname.startsWith("/api/v1/")) {
      const record = {
        fromServiceWorker: response.fromServiceWorker(),
        method: response.request().method(),
        path: `${url.pathname}${url.search}`,
        status: response.status(),
      };
      apiResponses.push(record);

      if (!response.ok()) {
        apiFailures.push(
          `${record.method} ${record.path} responded ${record.status}`,
        );
      }
    }
  });
  page.on("requestfailed", (request) => {
    const url = new URL(request.url());

    if (url.pathname.startsWith("/api/v1/")) {
      apiFailures.push(
        `${request.method()} ${url.pathname}${url.search} failed: ${
          request.failure()?.errorText ?? "unknown error"
        }`,
      );
    }
  });
  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });
  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });

  try {
    await page.goto(`${PAGES_REPOSITORY_BASE_PATH}#/auctions`);

    await expect(page).toHaveURL(
      new RegExp(
        `${PAGES_REPOSITORY_BASE_PATH}#/auctions(?:\\?.*)?$`,
      ),
    );
    await expect(page.getByText("Найдено: 18")).toBeVisible();
    await expect(page.getByText("SL-1001", { exact: true })).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(() => navigator.serviceWorker.controller?.state),
      )
      .toBe("activated");

    await page
      .getByRole("link", { name: /^Сделать ставку: SL-1001,/ })
      .click();
    await expect(page).toHaveURL(
      `${PAGES_REPOSITORY_BASE_PATH}#/auctions/${auctionUuid}/bet`,
    );

    await page.getByRole("textbox", { name: "Сумма ставки" }).fill("31000");
    await page.getByRole("button", { name: "Сделать ставку" }).click();
    await expect(page.getByLabel("Ставка принята")).toBeVisible();

    await page.getByRole("link", { name: "К аукциону" }).click();
    const detailUrl =
      `${PAGES_REPOSITORY_BASE_PATH}#/auctions/${auctionUuid}`;
    await expect(page).toHaveURL(detailUrl);
    await expect(
      page.getByRole("heading", { name: "Аукцион SL-1001" }),
    ).toBeVisible();
    await expect(page.getByText("Ваша ставка 31 000 ₽")).toBeVisible();

    await page.reload();

    await expect(page).toHaveURL(detailUrl);
    await expect(
      page.getByRole("heading", { name: "Аукцион SL-1001" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 2, name: "32 000 ₽" }),
    ).toBeVisible();
    await expect(page.getByText("Ваша ставка 31 000 ₽")).toHaveCount(0);
  } finally {
    await testInfo.attach("pages-demo-diagnostics", {
      body: JSON.stringify(
        { apiResponses, apiFailures, pageErrors, consoleErrors },
        null,
        2,
      ),
      contentType: "application/json",
    });
  }

  expect(
    apiResponses.some(
      ({ fromServiceWorker, method, path, status }) =>
        fromServiceWorker &&
        method === "POST" &&
        path === "/api/v1/auctions/list" &&
        status === 200,
    ),
  ).toBe(true);
  expect(
    apiResponses.some(
      ({ fromServiceWorker, method, path, status }) =>
        fromServiceWorker &&
        method === "POST" &&
        path === `/api/v1/auctions/${auctionUuid}/bets` &&
        status === 200,
    ),
  ).toBe(true);
  expect(
    apiResponses.filter(
      ({ fromServiceWorker, method, path, status }) =>
        fromServiceWorker &&
        method === "GET" &&
        path === `/api/v1/auctions/${auctionUuid}` &&
        status === 200,
    ).length,
  ).toBeGreaterThanOrEqual(2);
  expect(
    apiResponses
      .filter(({ status }) => status >= 200 && status < 300)
      .every(({ fromServiceWorker }) => fromServiceWorker),
    "successful /api/v1 responses served by the Service Worker",
  ).toBe(true);
  expect(apiFailures, "failed /api/v1 requests").toEqual([]);
  expect(pageErrors, "uncaught page errors").toEqual([]);
  expect(consoleErrors, "browser console errors").toEqual([]);
});
