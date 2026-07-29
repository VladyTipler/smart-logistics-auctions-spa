import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, delay, http } from "msw";

import {
  queryAuctionList,
  resetMockDatabase,
} from "@/shared/api/mocks/mock-database";
import type { AuctionListRequest } from "@/shared/api/contracts";
import { server } from "@/shared/api/mocks/server";
import { renderApp } from "@/shared/config/test/render-app";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
beforeEach(() => resetMockDatabase());
afterEach(() => server.events.removeAllListeners());
afterAll(() => server.close());

describe("auction list feature", () => {
  it("loads cards, applies a URL filter, and sends the exact list request", async () => {
    const bodies: AuctionListRequest[] = [];
    server.use(
      http.post("*/api/v1/auctions/list", async ({ request }) => {
        const body = (await request.json()) as AuctionListRequest;
        bodies.push(body);
        await delay(60);
        return HttpResponse.json(queryAuctionList(body));
      }),
    );
    const user = userEvent.setup();
    const { router } = renderApp("/auctions?perPage=2");

    expect(
      await screen.findByTestId("auction-list-skeleton"),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("link", { name: /SL-1001/ }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("article")).toHaveLength(2);
    expect(
      screen.getByRole("navigation", { name: "Страницы аукционов" }),
    ).toBeInTheDocument();

    await user.type(
      screen.getByRole("textbox", { name: "Номер груза" }),
      "SL-1003",
    );
    await user.click(screen.getByRole("button", { name: "Применить фильтры" }));

    await waitFor(() => {
      expect(router.state.location.search).toMatchObject({
        cargoNum: "SL-1003",
        page: 1,
        perPage: 2,
      });
    });
    expect(
      await screen.findByRole("link", { name: /SL-1003/ }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /SL-1001/ })).not.toBeInTheDocument();

    expect(bodies.at(-1)).toEqual({
      page: 1,
      per_page: 2,
      cargo_num: "SL-1003",
    });
  });

  it("changes page through semantic pagination", async () => {
    const user = userEvent.setup();
    const { router } = renderApp("/auctions?perPage=2");

    await screen.findByRole("link", { name: /SL-1001/ });
    await user.click(screen.getByRole("link", { name: "Страница 2" }));

    await waitFor(() => {
      expect(router.state.location.search).toMatchObject({
        page: 2,
        perPage: 2,
      });
    });
    expect(
      await screen.findByRole("link", { name: /SL-1003/ }),
    ).toBeInTheDocument();
  });

  it("prefetches auction detail on card hover intent", async () => {
    const detailUrls: string[] = [];
    server.events.on("request:start", ({ request }) => {
      if (
        request.method === "GET" &&
        /\/api\/v1\/auctions\/[^/]+$/.test(new URL(request.url).pathname)
      ) {
        detailUrls.push(request.url);
      }
    });
    const user = userEvent.setup();
    renderApp("/auctions?perPage=2");

    const cardLink = await screen.findByRole("link", { name: /SL-1001/ });
    await user.hover(cardLink);

    await waitFor(() => {
      expect(detailUrls).toHaveLength(1);
      expect(detailUrls[0]).toContain(
        "11111111-1111-4111-8111-111111111111",
      );
    });
  });

  it("rejects exponential pagination lexically before building the request", async () => {
    const bodies: Promise<unknown>[] = [];
    server.events.on("request:start", ({ request }) => {
      if (request.method === "POST") {
        bodies.push(request.clone().json());
      }
    });
    renderApp("/auctions?page=1e2&perPage=2");

    await screen.findByRole("link", { name: /SL-1001/ });
    const [request] = await Promise.all(bodies);

    expect(request).toMatchObject({ page: 1, per_page: 2 });
  });

  it("guides recovery from an empty result", async () => {
    const user = userEvent.setup();
    renderApp("/auctions?cargoNum=missing");

    const empty = await screen.findByRole("status");
    expect(within(empty).getByText("Подходящих аукционов нет")).toBeInTheDocument();
    await user.click(within(empty).getByRole("button", { name: "Сбросить фильтры" }));

    expect(
      await screen.findByRole("link", { name: /SL-1001/ }),
    ).toBeInTheDocument();
  });

  it("explains a list error and retries it on request", async () => {
    let attempts = 0;
    server.use(
      http.post("*/api/v1/auctions/list", () => {
        attempts += 1;

        if (attempts === 1) {
          return HttpResponse.json(
            {
              code: "service_unavailable",
              title: "Сервис недоступен",
              message: "Попробуйте ещё раз.",
            },
            { status: 503 },
          );
        }

        return undefined;
      }),
    );
    const user = userEvent.setup();
    renderApp("/auctions");

    const alert = await screen.findByRole("alert");
    expect(
      within(alert).getByText("Не удалось загрузить аукционы"),
    ).toBeInTheDocument();
    await user.click(
      within(alert).getByRole("button", { name: "Повторить загрузку" }),
    );

    expect(
      await screen.findByRole("link", { name: /SL-1001/ }),
    ).toBeInTheDocument();
    expect(attempts).toBe(2);
  });
});
