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

  it("maps every documented cargo capability without raw contract keys", () => {
    const detail = cloneFixture();
    detail.cargo = {
      ...detail.cargo,
      is_international: true,
      temp_from: -18,
      temp_to: -15,
      conics: 4,
      belts: 6,
      adr: 3,
      coupling: true,
      air_pass: true,
      low_loader: true,
      additional_load: true,
      containered: true,
      container_type: "40HC",
      container_size: "40 футов",
      loading_types: { side: true, top: true, rear: true, full: true },
      docs: { tir: true, cmr: true, t1: true, med: true },
      car: {
        type: "Тягач",
        weight: 20,
        volume: 82,
        width: 2.4,
        length: 13.6,
        height: 2.7,
      },
    };
    detail.routes[0].cargo = {
      name: "Мороженое",
      package_name: "Европаллет",
      package_amount: 18,
      weight: "20.000",
      volume: "82.000",
      length: "13.600",
      width: "2.400",
      height: "2.700",
      oversized: true,
    };

    const viewModel = mapAuctionDetail(detail);

    expect(viewModel.cargo.loadingLabels).toEqual([
      "Боковая",
      "Верхняя",
      "Задняя",
      "Полная растентовка",
    ]);
    expect(viewModel.cargo.documentLabels).toEqual([
      "TIR",
      "CMR",
      "T1",
      "Медицинские документы",
    ]);
    expect(viewModel.cargo).toMatchObject({
      isInternational: true,
      temperatureLabel: "−18…−15 °C",
      adrClass: 3,
      vehicle: {
        type: "Тягач",
        weightTons: 20,
        volumeCubicMeters: 82,
        widthMeters: 2.4,
        lengthMeters: 13.6,
        heightMeters: 2.7,
      },
    });
    expect(viewModel.cargo.equipmentLabels).toEqual([
      "Коники: 4",
      "Ремни: 6",
      "Сцепка",
      "Пневмоход",
      "Низкорамная платформа",
      "Догруз",
      "Контейнер: 40HC · 40 футов",
    ]);
    expect(viewModel.route[0].cargo).toMatchObject({
      packageName: "Европаллет",
      packageAmount: 18,
      dimensionsLabel: "13,6 × 2,4 × 2,7 м",
      oversized: true,
    });
    expect(viewModel.cargo).not.toHaveProperty("loading_types");
    expect(viewModel.cargo.vehicle).not.toHaveProperty("weight");
  });

  it("ignores unknown cargo flags and non-finite optional requirements", () => {
    const detail = cloneFixture();
    detail.cargo.loading_types = {
      rear: true,
      teleport: true,
    } as NonNullable<AuctionDetail["cargo"]["loading_types"]> & {
      teleport: boolean;
    };
    detail.cargo.docs = {
      med: true,
      secret: true,
    } as NonNullable<AuctionDetail["cargo"]["docs"]> & { secret: boolean };
    detail.cargo.car = { weight: Number.NaN };

    const viewModel = mapAuctionDetail(detail);

    expect(viewModel.cargo.loadingLabels).toEqual(["Задняя"]);
    expect(viewModel.cargo.documentLabels).toEqual([
      "Медицинские документы",
    ]);
    expect(viewModel.cargo.vehicle).toBeUndefined();
  });

  it("keeps the trading min and max bounds in the sanitised model", () => {
    const viewModel = mapAuctionDetail(cloneFixture());

    expect(viewModel.trading.minPrice).toBe(1_000);
    expect(viewModel.trading.maxPrice).toBe(100_000);
  });
});
