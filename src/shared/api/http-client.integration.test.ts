import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";

import { ApiError } from "./api-error";
import { createHttpClient } from "./http-client";

const API_ORIGIN = "http://localhost";
const client = createHttpClient({
  baseUrl: `${API_ORIGIN}/api/v1/`,
});
const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("typed HTTP client", () => {
  it("joins a trailing-slash base URL and endpoint without duplicate slashes", async () => {
    let requestUrl = "";

    server.use(
      http.get(`${API_ORIGIN}/api/v1/auctions/list`, ({ request }) => {
        requestUrl = request.url;
        return HttpResponse.json({ auctions: [] });
      }),
    );

    await client.get<{ auctions: unknown[] }>("/auctions/list");

    expect(requestUrl).toBe(`${API_ORIGIN}/api/v1/auctions/list`);
  });

  it("sends a JSON body with content negotiation headers", async () => {
    let requestBody: unknown;
    let acceptHeader = "";
    let contentTypeHeader = "";

    server.use(
      http.post(`${API_ORIGIN}/api/v1/auctions/list`, async ({ request }) => {
        requestBody = await request.json();
        acceptHeader = request.headers.get("accept") ?? "";
        contentTypeHeader = request.headers.get("content-type") ?? "";
        return HttpResponse.json({ auctions: [] });
      }),
    );

    await client.post<{ auctions: unknown[] }, { page: number }>(
      "auctions/list",
      { page: 2 },
    );

    expect(requestBody).toEqual({ page: 2 });
    expect(contentTypeHeader).toContain("application/json");
    expect(acceptHeader).toContain("application/json");
    expect(acceptHeader).toContain("application/problem+json");
  });

  it("throws ApiError with status and parsed problem details", async () => {
    const problem = {
      code: "resource_not_found",
      title: "Не найдено",
      message: "Аукцион не найден",
    };

    server.use(
      http.get(`${API_ORIGIN}/api/v1/auctions/missing`, () =>
        HttpResponse.json(problem, {
          status: 404,
          headers: { "Content-Type": "application/problem+json" },
        }),
      ),
    );

    const request = client.get("/auctions/missing");

    await expect(request).rejects.toBeInstanceOf(ApiError);
    await expect(request).rejects.toMatchObject({
      status: 404,
      problem,
      message: problem.message,
    });
  });

  it("preserves validation errors from a 422 response", async () => {
    const validationProblem = {
      code: "validation_failed",
      title: "Ошибка валидации",
      message: "Запрос содержит некорректные поля.",
      errors: [
        {
          field: "price",
          message: "Значение должно быть больше 0.",
          code: "min_value",
        },
      ],
    };

    server.use(
      http.post(`${API_ORIGIN}/api/v1/auctions/auction-id/bets`, () =>
        HttpResponse.json(validationProblem, {
          status: 422,
          headers: { "Content-Type": "application/problem+json" },
        }),
      ),
    );

    await expect(
      client.post("/auctions/auction-id/bets", { price: 0 }),
    ).rejects.toMatchObject({
      status: 422,
      problem: validationProblem,
    });
  });

  it("returns undefined for an empty successful response", async () => {
    server.use(
      http.post(
        `${API_ORIGIN}/api/v1/auctions/auction-id/bets`,
        () => new HttpResponse(null, { status: 200 }),
      ),
    );

    await expect(
      client.post<undefined, { price: number }>(
        "/auctions/auction-id/bets",
        { price: 15_000 },
      ),
    ).resolves.toBeUndefined();
  });

  it("does not send Content-Type when the request has no body", async () => {
    let contentTypeHeader: string | null = "not-observed";

    server.use(
      http.get(`${API_ORIGIN}/api/v1/auctions/auction-id`, ({ request }) => {
        contentTypeHeader = request.headers.get("content-type");
        return HttpResponse.json({ id: "auction-id" });
      }),
    );

    await client.get("/auctions/auction-id");

    expect(contentTypeHeader).toBeNull();
  });
});
