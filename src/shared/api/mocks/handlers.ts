import { HttpResponse, http } from "msw";

import type {
  AuctionListRequest,
  ProblemDetail,
  ValidationProblem,
} from "../contracts";
import {
  canSetAuctionBet,
  createAuctionBet,
  hasAuction,
  queryAuctionBets,
  queryAuctionDetail,
  queryAuctionList,
  validateAuctionBet,
} from "./mock-database";

const API_PREFIX = "*/api/v1";

const notFoundProblem: ProblemDetail = {
  code: "resource_not_found",
  title: "Не найдено",
  message: "Аукцион не найден",
};

const invalidPriceProblem: ValidationProblem = {
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

function requestValidationProblem(
  field: string,
  message: string,
  code: string,
): ValidationProblem {
  return {
    code: "validation_failed",
    title: "Ошибка валидации",
    message: "Запрос содержит некорректные поля.",
    errors: [{ field, message, code }],
  };
}

const forbiddenBetProblem: ValidationProblem = {
  code: "bet_not_allowed",
  title: "Ставка недоступна",
  message: "В этом аукционе нельзя установить ставку",
  errors: [],
};

function problemResponse(
  problem: ProblemDetail | ValidationProblem,
  status: number,
) {
  return HttpResponse.json(problem, {
    status,
    headers: { "Content-Type": "application/problem+json" },
  });
}

function isValidBidRequest(body: unknown): body is { price: number } {
  if (typeof body !== "object" || body === null || !("price" in body)) {
    return false;
  }

  const price = (body as { price?: unknown }).price;
  return typeof price === "number" && Number.isFinite(price) && price > 0;
}

function isObjectBody(body: unknown): body is AuctionListRequest {
  return typeof body === "object" && body !== null && !Array.isArray(body);
}

export const handlers = [
  http.post(`${API_PREFIX}/auctions/list`, async ({ request }) => {
    let body: unknown = {};

    if (request.body !== null) {
      try {
        body = await request.json();
      } catch {
        return problemResponse(
          requestValidationProblem(
            "body",
            "Тело запроса содержит некорректный JSON.",
            "invalid_json",
          ),
          422,
        );
      }
    }

    if (!isObjectBody(body)) {
      return problemResponse(
        requestValidationProblem(
          "body",
          "Тело запроса должно быть JSON-объектом.",
          "invalid_type",
        ),
        422,
      );
    }

    return HttpResponse.json(queryAuctionList(body));
  }),

  http.get(`${API_PREFIX}/auctions/:auctionUuid`, ({ params }) => {
    const detail = queryAuctionDetail(String(params.auctionUuid));

    return detail
      ? HttpResponse.json(detail)
      : problemResponse(notFoundProblem, 404);
  }),

  http.get(
    `${API_PREFIX}/auctions/:auctionUuid/bets`,
    ({ params, request }) => {
      const all = new URL(request.url).searchParams.get("all") === "true";
      const response = queryAuctionBets(String(params.auctionUuid), all);

      return response
        ? HttpResponse.json(response)
        : problemResponse(notFoundProblem, 404);
    },
  ),

  http.post(
    `${API_PREFIX}/auctions/:auctionUuid/bets`,
    async ({ params, request }) => {
      const auctionUuid = String(params.auctionUuid);

      if (!hasAuction(auctionUuid)) {
        return problemResponse(notFoundProblem, 404);
      }

      if (canSetAuctionBet(auctionUuid) !== true) {
        return problemResponse(forbiddenBetProblem, 403);
      }

      let body: unknown;

      try {
        body = await request.json();
      } catch {
        return problemResponse(invalidPriceProblem, 422);
      }

      if (!isValidBidRequest(body)) {
        return problemResponse(invalidPriceProblem, 422);
      }

      // Down auctions accept lower prices; Up auctions accept higher prices.
      // A bid must cross `available`, stay within min/max, and align to `step`.
      const bidValidation = validateAuctionBet(auctionUuid, body.price);

      if (bidValidation) {
        return problemResponse(
          requestValidationProblem(
            "price",
            bidValidation.message,
            bidValidation.code,
          ),
          422,
        );
      }

      createAuctionBet(auctionUuid, body.price);
      return new HttpResponse(null, { status: 200 });
    },
  ),
];
