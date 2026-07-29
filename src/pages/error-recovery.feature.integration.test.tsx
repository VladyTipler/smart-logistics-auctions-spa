import { createMemoryHistory } from "@tanstack/react-router";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";

import { AppProviders } from "@/app/providers/app-providers.component";
import {
  createAppQueryClient,
  shouldRetryQuery,
} from "@/app/providers/query-client";
import { createAppRouter } from "@/app/router/router";
import { queryAuctionList } from "@/shared/api/mocks/mock-database";
import { auctionFixtures } from "@/shared/api/mocks/fixtures/auctions.fixture";
import { resetMockDatabase } from "@/shared/api/mocks/mock-database";
import { server } from "@/shared/api/mocks/server";
import { renderApp } from "@/shared/config/test/render-app";
import { AppToastProvider } from "@/shared/ui/toast/app-toast-provider.component";
import { showAppToast } from "@/shared/ui/toast/app-toast-manager";

const auctionUuid = "11111111-1111-4111-8111-111111111111";

function renderWithRetryPolicy(initialUrl: string) {
  const queryClient = createAppQueryClient();
  queryClient.setDefaultOptions({
    queries: {
      retry: shouldRetryQuery,
      retryDelay: 0,
    },
  });
  const router = createAppRouter({
    history: createMemoryHistory({ initialEntries: [initialUrl] }),
    queryClient,
  });

  return {
    ...render(
      <AppProviders queryClient={queryClient} router={router} />,
    ),
    queryClient,
    router,
  };
}

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
beforeEach(() => resetMockDatabase());
afterEach(() => {
  server.resetHandlers();
  server.events.removeAllListeners();
});
afterAll(() => server.close());

describe("shared error and recovery states", () => {
  it("explains a 401 list failure and offers a useful next action", async () => {
    server.use(
      http.post("*/api/v1/auctions/list", () =>
        HttpResponse.json(
          {
            code: "unauthenticated",
            title: "Сессия завершена",
            message: "Требуется повторный вход.",
          },
          { status: 401 },
        ),
      ),
    );

    renderApp("/auctions");

    const alert = await screen.findByRole("alert");
    expect(
      within(alert).getByRole("heading", { name: "Сессия завершена" }),
    ).toBeInTheDocument();
    expect(alert).toHaveTextContent(
      "Войдите снова, затем повторите загрузку аукционов.",
    );
    expect(
      within(alert).getByRole("button", { name: "Повторить загрузку" }),
    ).toBeInTheDocument();
  });

  it("retries a 503 once, then manually recovers without reloading the app", async () => {
    let attempts = 0;
    server.use(
      http.post("*/api/v1/auctions/list", async ({ request }) => {
        attempts += 1;

        if (attempts <= 2) {
          return HttpResponse.json(
            {
              code: "service_unavailable",
              title: "Сервис временно недоступен",
              message: "Диспетчерская не ответила вовремя.",
            },
            { status: 503 },
          );
        }

        return HttpResponse.json(
          queryAuctionList((await request.json()) as never),
        );
      }),
    );
    const user = userEvent.setup();
    renderWithRetryPolicy("/auctions");

    const alert = await screen.findByRole("alert");
    expect(attempts).toBe(2);
    expect(
      within(alert).getByRole("heading", {
        name: "Не удалось загрузить аукционы",
      }),
    ).toBeInTheDocument();
    expect(alert).toHaveTextContent(
      "Автоматический повтор не помог. Запустите загрузку ещё раз.",
    );

    await user.click(
      within(alert).getByRole("button", { name: "Повторить загрузку" }),
    );

    expect(
      await screen.findByRole("link", { name: /SL-1001/ }),
    ).toBeInTheDocument();
    expect(attempts).toBe(3);
  });

  it.each([
    [
      "/missing",
      "Страница не найдена",
      "Проверьте адрес или вернитесь к списку аукционов.",
    ],
    [
      `/auctions/00000000-0000-4000-8000-000000000000`,
      "Аукцион не найден",
      "Он завершён, удалён или ссылка содержит неверный идентификатор.",
    ],
  ])("renders a quiet 404 state for %s", async (url, title, guidance) => {
    renderApp(url);

    const heading = await screen.findByRole("heading", { name: title });
    const state = heading.closest("section");
    expect(state).not.toBeNull();
    expect(state).toHaveTextContent(guidance);
    expect(state).not.toHaveAttribute("role", "alert");
    expect(
      within(state!).getByRole("link", { name: "Вернуться к аукционам" }),
    ).toBeInTheDocument();
  });

  it("resets a failed route query and opens the auction on manual retry", async () => {
    let attempts = 0;
    server.use(
      http.get("*/api/v1/auctions/:auctionUuid", () => {
        attempts += 1;

        if (attempts === 1) {
          return HttpResponse.json(
            {
              code: "service_unavailable",
              title: "Сервис временно недоступен",
              message: "Карточка аукциона пока недоступна.",
            },
            { status: 503 },
          );
        }

        return HttpResponse.json(auctionFixtures[0].detail);
      }),
    );
    const user = userEvent.setup();
    renderApp(`/auctions/${auctionUuid}`);

    const alert = await screen.findByRole("alert");
    expect(
      within(alert).getByRole("heading", {
        name: "Сервис временно недоступен",
      }),
    ).toBeInTheDocument();

    await user.click(
      within(alert).getByRole("button", { name: "Повторить загрузку" }),
    );

    expect(
      await screen.findByRole("heading", { name: "Аукцион SL-1001" }),
    ).toBeInTheDocument();
    expect(attempts).toBe(2);
  });

  it.each([
    {
      name: "403",
      response: () =>
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
      inline: "Ставка больше недоступна. Обновите условия аукциона.",
    },
    {
      name: "422",
      response: () =>
        HttpResponse.json(
          {
            code: "validation_failed",
            title: "Ошибка валидации",
            message: "Цена изменилась.",
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
      inline: "Доступная цена уже 30 500 ₽.",
    },
    {
      name: "network",
      response: () => HttpResponse.error(),
      inline: "Не удалось отправить ставку. Попробуйте ещё раз.",
    },
  ])(
    "keeps bid input and announces a $name error through one live channel",
    async ({ inline, response }) => {
      server.use(
        http.post("*/api/v1/auctions/:auctionUuid/bets", response),
      );
    const user = userEvent.setup();
    renderApp(`/auctions/${auctionUuid}/bet`);
    const input = await screen.findByRole("textbox", {
      name: "Сумма ставки",
    });

    await user.clear(input);
    await user.type(input, "31000");
    await user.click(screen.getByRole("button", { name: "Сделать ставку" }));

      expect(await screen.findByText(inline)).toBeInTheDocument();
    const toast = await screen.findByTestId("app-toast-viewport");
    expect(toast).toHaveTextContent("Ошибка ставки");
    expect(input).toHaveValue("31000");
      expect(input.getAttribute("aria-describedby")).toContain(
        inline.includes("30 500")
          ? "set-bet-price-error"
          : "set-bet-server-error",
      );
      expect(screen.queryAllByRole("alert")).toHaveLength(0);
      expect(
        document.querySelectorAll(
          '.app-toast[role="alert"], .app-toast[role="status"], .app-toast[aria-live]',
        ),
      ).toHaveLength(0);
      expect(
        document.querySelectorAll(
          '.set-bet-form__error[role], .set-bet-form__error[aria-live]',
        ),
      ).toHaveLength(0);
      expect(
        document.querySelectorAll(
          '[data-testid="app-toast-viewport"][aria-live="polite"]',
        ),
      ).toHaveLength(1);
    },
  );

  it("clears singleton toast state across a real provider unmount and remount", async () => {
    const user = userEvent.setup();
    const first = render(
      <AppToastProvider>
        <button
          type="button"
          onClick={() =>
            showAppToast({
              description: "Первое сообщение",
              id: "provider-lifecycle",
              title: "Первый toast",
              tone: "success",
            })
          }
        >
          Показать первый
        </button>
      </AppToastProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Показать первый" }));
    expect(await screen.findByText("Первый toast")).toBeInTheDocument();
    expect(screen.getAllByTestId("app-toast-viewport")).toHaveLength(1);

    first.unmount();

    const second = render(
      <AppToastProvider>
        <span>Новый provider</span>
      </AppToastProvider>,
    );
    expect(screen.getAllByTestId("app-toast-viewport")).toHaveLength(1);
    expect(screen.queryByText("Первый toast")).not.toBeInTheDocument();

    second.unmount();
  });
});
