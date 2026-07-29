import { describe, expect, it } from "vitest";

import type { AuctionDetail } from "@/shared/api/contracts";
import { auctionFixtures } from "@/shared/api/mocks/fixtures/auctions.fixture";

import { mapAuctionDetail } from "./map-auction-detail";

function cloneFixture(): AuctionDetail {
  return structuredClone(auctionFixtures[0].detail);
}

describe("mapAuctionDetail", () => {
  it("maps the transport contract into a presentation-only view model", () => {
    const viewModel = mapAuctionDetail(cloneFixture());

    expect(viewModel.identity).toMatchObject({
      auctionUuid: "11111111-1111-4111-8111-111111111111",
      cargoNumber: "SL-1001",
      auctionType: "На понижение",
    });
    expect(viewModel.route).toHaveLength(2);
    expect(viewModel.route[0]).toMatchObject({
      city: "Кишинёв",
      address: "Кишинёв, Складская 1",
      contact: { name: "Иван", phone: "+37360000001" },
    });
    expect(viewModel.trading.currentPrice).toBe(32_000);
    expect(viewModel).not.toHaveProperty("main");
    expect(viewModel).not.toHaveProperty("routes");
    expect(viewModel).not.toHaveProperty("trading.can_set_bet");
  });

  it("keeps route cities but removes addresses and every contact when point details are hidden", () => {
    const detail = cloneFixture();
    detail.trading.hide_points_address_and_contacts = true;

    const viewModel = mapAuctionDetail(detail);

    expect(viewModel.route.map((point) => point.city)).toEqual([
      "Кишинёв",
      "Бухарест",
    ]);
    expect(viewModel.route.every((point) => point.address === undefined)).toBe(
      true,
    );
    expect(viewModel.route.every((point) => point.contact === undefined)).toBe(
      true,
    );
    expect(viewModel.organizer.contacts).toEqual([]);
  });

  it("removes cargo valuation while preserving the live trading price", () => {
    const detail = cloneFixture();
    detail.trading.no_view_cargo_price = true;

    const viewModel = mapAuctionDetail(detail);

    expect(viewModel.cargo.value).toBeUndefined();
    expect(viewModel.trading.currentPrice).toBe(32_000);
    expect(viewModel.trading.availablePrice).toBe(31_500);
  });

  it("keeps places access independent from every other capability", () => {
    const detail = cloneFixture();
    detail.trading.hide_places = true;
    detail.trading.can_set_bet = true;

    const viewModel = mapAuctionDetail(detail);

    expect(viewModel.access.canViewPlaces).toBe(false);
    expect(viewModel.access.canSetBet).toBe(true);
    expect(viewModel.access.canViewBetHistory).toBe(true);
  });

  it("normalizes absent and unknown optional fields without leaking undefined labels", () => {
    const detail = cloneFixture();
    detail.main = {};
    detail.routes = [{ op_type: "Unknown", location: {}, cargo: {} }];
    detail.trading.status = undefined;
    detail.cargo = {};

    const viewModel = mapAuctionDetail(detail);

    expect(viewModel.identity.cargoNumber).toBe("Без номера");
    expect(viewModel.route[0]).toMatchObject({
      operationLabel: "Пункт маршрута",
      city: "Город не указан",
    });
    expect(viewModel.trading.statusLabel).toBe("Статус не указан");
  });

  it("preserves the payment delay unit from the contract", () => {
    const detail = cloneFixture();
    detail.payment.delay = 5;
    detail.payment.delay_type = "WorkDays";

    expect(mapAuctionDetail(detail).payment.delayLabel).toBe(
      "5 рабочих дней",
    );
  });
});
