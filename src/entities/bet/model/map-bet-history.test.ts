import { describe, expect, it } from "vitest";

import type { BetListResponse } from "@/shared/api/contracts";

import { mapBetHistory } from "./map-bet-history";

const response: BetListResponse = {
  bets: [
    {
      id: 1,
      subscriber_id: 77,
      organization_name: "Fast Freight",
      contact_name: "Пётр",
      created_at: "2026-07-29T12:00:00+03:00",
      price_with_vat: 32_000,
      price_no_vat: 32_000 / 1.2,
      place: 1,
      is_win: true,
      price_info: {
        payment_type: "Безналичная с НДС",
        vat_rate: "20",
      },
    },
    {
      id: 2,
      subscriber_id: 77,
      organization_name: "Fast Freight",
      price_with_vat: 31_500,
      price_no_vat: 26_250,
      place: 2,
      is_rejected: true,
      cancel_reason: "Отменена после отклонения",
    },
    {
      id: 3,
      subscriber_id: 88,
      organization_name: "Road Runner",
      price_info: {
        price_with_vat: 29_000,
        price_no_vat: 24_166.67,
        payment_type: "Безналичная без НДС",
        vat_rate: "0",
      },
      place: null,
      cancel_reason: "Отменена участником",
    },
    {
      id: 4,
      organization_name: "",
      price_with_vat: Number.NaN,
    },
    {
      id: 5,
      subscriber_id: 0,
      organization_name: "Invalid participant",
      price_with_vat: -1,
      price_no_vat: 0,
      place: -2,
    },
    {
      id: 6,
      subscriber_id: 42.5,
      organization_name: "Fractional participant",
      place: 1.5,
    },
  ],
};

describe("mapBetHistory", () => {
  it("counts unique participants only by subscriber_id", () => {
    expect(
      mapBetHistory(response, {
        canViewPlaces: true,
        currencyCode: "643",
      }).participantCount,
    ).toBe(2);
  });

  it("maps VAT and no-VAT prices with resilient fallbacks", () => {
    const history = mapBetHistory(response, {
      canViewPlaces: true,
      currencyCode: "643",
    });

    expect(history.items[0]).toMatchObject({
      priceWithVat: 32_000,
      priceWithoutVat: 32_000 / 1.2,
      paymentLabel: "Безналичная с НДС",
      vatRateLabel: "НДС 20%",
    });
    expect(history.items[2]).toMatchObject({
      priceWithVat: 29_000,
      priceWithoutVat: 24_166.67,
      paymentLabel: "Безналичная без НДС",
      vatRateLabel: "Без НДС",
    });
    expect(history.items[3]).not.toHaveProperty("priceWithVat");
    expect(history.items[4]).not.toHaveProperty("priceWithVat");
    expect(history.items[4].priceWithoutVat).toBe(0);
  });

  it("maps winner, rejected, active, and cancellation states", () => {
    const history = mapBetHistory(response, {
      canViewPlaces: true,
      currencyCode: "643",
    });

    expect(history.items.map((item) => item.status)).toEqual([
      { label: "Победитель", tone: "winner" },
      { label: "Отменена", tone: "cancelled" },
      { label: "Отменена", tone: "cancelled" },
      { label: "Активна", tone: "active" },
      { label: "Активна", tone: "active" },
      { label: "Активна", tone: "active" },
    ]);
    expect(history.items[1].cancelReason).toBe(
      "Отменена после отклонения",
    );
    expect(history.items[2].cancelReason).toBe("Отменена участником");
  });

  it("accepts only positive integer subscriber ids and places", () => {
    const history = mapBetHistory(
      {
        bets: [
          { id: 10, subscriber_id: 9, place: 1 },
          { id: 11, subscriber_id: 0, place: 0 },
          { id: 12, subscriber_id: -3, place: -1 },
          { id: 13, subscriber_id: 2.5, place: 1.5 },
          { id: 14, subscriber_id: Number.NaN, place: Number.NaN },
        ],
      },
      {
        canViewPlaces: true,
        currencyCode: "643",
      },
    );

    expect(history.participantCount).toBe(1);
    expect(history.items[0].place).toBe(1);
    expect(
      history.items.slice(1).every((item) => !("place" in item)),
    ).toBe(true);
  });

  it("accepts only finite nonnegative prices", () => {
    const history = mapBetHistory(
      {
        bets: [
          { id: 20, price_with_vat: 0, price_no_vat: 10 },
          {
            id: 21,
            price_with_vat: -1,
            price_no_vat: Number.POSITIVE_INFINITY,
          },
        ],
      },
      {
        canViewPlaces: true,
        currencyCode: "643",
      },
    );

    expect(history.items[0]).toMatchObject({
      priceWithVat: 0,
      priceWithoutVat: 10,
    });
    expect(history.items[1]).not.toHaveProperty("priceWithVat");
    expect(history.items[1]).not.toHaveProperty("priceWithoutVat");
  });

  it("keeps valid places visible", () => {
    const history = mapBetHistory(response, {
      canViewPlaces: true,
      currencyCode: "643",
    });

    expect(history.participantCount).toBe(2);
    expect(history.items[4]).not.toHaveProperty("place");
    expect(history.items[5]).not.toHaveProperty("place");
  });

  it("removes places from every item when access is hidden", () => {
    const history = mapBetHistory(response, {
      canViewPlaces: false,
      currencyCode: "643",
    });

    expect(history.canViewPlaces).toBe(false);
    expect(history.items.every((item) => !("place" in item))).toBe(true);
  });
});
