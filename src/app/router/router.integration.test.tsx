import { screen } from "@testing-library/react";

import { shouldRetryQuery } from "@/app/providers/query-client";
import { renderApp } from "@/shared/config/test/render-app";

describe("application routes", () => {
  it.each([
    ["/auctions", "Аукционы грузов"],
    ["/auctions/auction-42", "Карточка аукциона"],
    ["/auctions/auction-42/bets", "История ставок"],
    ["/auctions/auction-42/bet", "Новая ставка"],
  ])("renders %s directly", async (initialUrl, heading) => {
    renderApp(initialUrl);

    expect(
      await screen.findByRole("heading", { level: 1, name: heading }),
    ).toBeInTheDocument();
  });

  it("renders a not-found page for an unknown URL", async () => {
    renderApp("/missing");

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "Страница не найдена",
      }),
    ).toBeInTheDocument();
  });
});

describe("query retry policy", () => {
  it.each([
    [0, { status: 400 }, false],
    [0, { response: { status: 404 } }, false],
    [0, { status: 503 }, true],
    [1, { status: 503 }, false],
    [0, new TypeError("Network request failed"), true],
    [1, new TypeError("Network request failed"), false],
    [0, { status: 500 }, false],
  ])(
    "applies the retry decision for failure count %s",
    (failureCount, error, expected) => {
      expect(shouldRetryQuery(failureCount, error)).toBe(expected);
    },
  );
});
