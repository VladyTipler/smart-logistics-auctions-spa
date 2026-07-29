import type { components } from "@/shared/api/generated/auctions-api";

import { mapAuctionCard } from "./map-auction-card";

type AuctionListItem = components["schemas"]["AuctionListItem"];

describe("mapAuctionCard", () => {
  it("maps operational card data without leaking optional DTO structure", () => {
    const dto: AuctionListItem = {
      main: {
        cargo_num: "SL-2042",
        order_uid: "auction-42",
        auc_type: "Down",
      },
      route: {
        load: {
          city: "Кишинёв",
          date: "2026-08-01T09:00:00+03:00",
        },
        unload: {
          city: "Бухарест",
          date: "2026-08-02T11:30:00+03:00",
        },
      },
      cargo: {
        name: "Паллетированный груз",
        weight: 20,
        volume: 82,
        body_type: "тентованный",
        truck_count: 1,
      },
      trading: {
        status: "Auction",
        status_mobile: "Leading",
        can_set_bet: true,
        price: { current: 32_000 },
        your: { bet: true, last_bet: 32_500 },
      },
      payment: { currency_code: "643" },
    };

    expect(mapAuctionCard(dto)).toMatchObject({
      auctionUuid: "auction-42",
      cargoNumber: "SL-2042",
      auctionType: "На понижение",
      route: {
        load: { city: "Кишинёв", dateLabel: "01 авг., 09:00" },
        unload: { city: "Бухарест", dateLabel: "02 авг., 11:30" },
      },
      cargoSummary: "Паллетированный груз · 20 т · 82 м³ · тентованный",
      currentPrice: { amount: 32_000, label: "32 000 ₽" },
      status: { label: "Лидируете", tone: "positive" },
      action: { label: "Сделать ставку", kind: "bid" },
      ownBidLabel: "Ваша ставка 32 500 ₽",
    });
  });

  it("uses stable fallbacks for nullable price and missing route or cargo", () => {
    expect(
      mapAuctionCard({
        main: { order_uid: "sparse-auction" },
        trading: {
          status: "Planning",
          status_mobile: "NotParticipating",
          price: null,
        },
      }),
    ).toEqual({
      auctionUuid: "sparse-auction",
      cargoNumber: "Без номера",
      auctionType: "Тип не указан",
      route: {
        load: { city: "Пункт не указан", dateLabel: "Дата не указана" },
        unload: { city: "Пункт не указан", dateLabel: "Дата не указана" },
      },
      cargoSummary: "Параметры груза не указаны",
      currentPrice: null,
      status: { label: "Не участвуете", tone: "neutral" },
      action: { label: "Открыть аукцион", kind: "details" },
      ownBidLabel: null,
    });
  });

  it("renders unknown enum values and absent identifiers safely", () => {
    const malformed = {
      main: { auc_type: "Surprise" },
      trading: {
        status: "Teleporting",
        status_mobile: "Alien",
        can_set_bet: true,
      },
    } as unknown as AuctionListItem;

    expect(mapAuctionCard(malformed)).toMatchObject({
      auctionUuid: null,
      auctionType: "Неизвестный тип",
      status: { label: "Статус неизвестен", tone: "neutral" },
      action: { label: "Открыть аукцион", kind: "details" },
    });
  });
});
