import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

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

  it("navigates through the SPA without losing QueryClient state", async () => {
    const user = userEvent.setup();
    const { queryClient, router } = renderApp("/auctions/auction-42");
    const beforeUnload = vi.fn();
    window.addEventListener("beforeunload", beforeUnload);
    queryClient.setQueryData(["navigation-sentinel"], "preserved");

    try {
      await screen.findByRole("heading", {
        level: 1,
        name: "Карточка аукциона",
      });
      await user.click(
        screen.getByRole("link", {
          name: "Аукционы",
        }),
      );

      expect(
        await screen.findByRole("heading", {
          level: 1,
          name: "Аукционы грузов",
        }),
      ).toBeInTheDocument();
      expect(router.state.location.pathname).toBe("/auctions");
      expect(queryClient.getQueryData(["navigation-sentinel"])).toBe(
        "preserved",
      );
      expect(beforeUnload).not.toHaveBeenCalled();
    } finally {
      window.removeEventListener("beforeunload", beforeUnload);
    }
  });

  it.each([
    ["/auctions", "Аукционы грузов", true],
    ["/missing", "Страница не найдена", false],
  ])(
    "sets the auctions navigation state at %s",
    async (initialUrl, heading, isCurrent) => {
      renderApp(initialUrl);

      await screen.findByRole("heading", { level: 1, name: heading });
      const navigationLink = screen.getByRole("link", {
        name: "Аукционы",
      });

      if (isCurrent) {
        expect(navigationLink).toHaveAttribute("aria-current", "page");
      } else {
        expect(navigationLink).not.toHaveAttribute("aria-current");
      }
    },
  );

  it("exposes the dynamic auction route parameter", async () => {
    renderApp("/auctions/auction-42");

    expect(await screen.findByText("auction-42")).toBeInTheDocument();
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
    [0, new Error("Unknown failure"), false],
    [0, new SyntaxError("Invalid JSON"), false],
    [0, "connection failed", false],
  ])(
    "applies the retry decision for failure count %s",
    (failureCount, error, expected) => {
      expect(shouldRetryQuery(failureCount, error)).toBe(expected);
    },
  );
});
