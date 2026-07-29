import type { components } from "../../generated/auctions-api";

type AuctionListItem = components["schemas"]["AuctionListItem"];
type AuctionDetail = components["schemas"]["AuctionShowResponse"];
type BetItem = components["schemas"]["BetItem"];

export interface AuctionFixture {
  detail: AuctionDetail;
  listItem: AuctionListItem;
}

interface AuctionSeed {
  aucType: "Request" | "Up" | "Down" | "FixPrice";
  available: number;
  canSetBet: boolean;
  cargoNum: string;
  currentPrice: number;
  id: number;
  isAvailable: boolean;
  isBidder: boolean;
  loadCity: string;
  loadCityId: number;
  loadDate: string;
  orderUid: string;
  status:
    | "Planning"
    | "Auction"
    | "DeterminateWinner"
    | "Finished"
    | "Stopped";
  statusMobile:
    | "NotParticipating"
    | "Leading"
    | "Losing"
    | "Winner"
    | "Confirmed";
  unloadCity: string;
  unloadCityId: number;
}

const seeds: readonly AuctionSeed[] = [
  {
    id: 101,
    cargoNum: "SL-1001",
    orderUid: "11111111-1111-4111-8111-111111111111",
    aucType: "Down",
    status: "Auction",
    statusMobile: "NotParticipating",
    loadCity: "Кишинёв",
    loadCityId: 1,
    unloadCity: "Бухарест",
    unloadCityId: 2,
    loadDate: "2026-08-01T09:00:00+03:00",
    currentPrice: 32_000,
    available: 31_500,
    canSetBet: true,
    isAvailable: true,
    isBidder: false,
  },
  {
    id: 102,
    cargoNum: "SL-1002",
    orderUid: "22222222-2222-4222-8222-222222222222",
    aucType: "Up",
    status: "Finished",
    statusMobile: "Leading",
    loadCity: "Одесса",
    loadCityId: 3,
    unloadCity: "Киев",
    unloadCityId: 4,
    loadDate: "2026-08-02T10:00:00+03:00",
    currentPrice: 50_000,
    available: 50_500,
    canSetBet: false,
    isAvailable: false,
    isBidder: true,
  },
  {
    id: 103,
    cargoNum: "SL-1003",
    orderUid: "33333333-3333-4333-8333-333333333333",
    aucType: "FixPrice",
    status: "DeterminateWinner",
    statusMobile: "Losing",
    loadCity: "Бельцы",
    loadCityId: 5,
    unloadCity: "Яссы",
    unloadCityId: 6,
    loadDate: "2026-08-03T11:00:00+03:00",
    currentPrice: 18_000,
    available: 18_000,
    canSetBet: false,
    isAvailable: false,
    isBidder: true,
  },
  {
    id: 104,
    cargoNum: "SL-1004",
    orderUid: "44444444-4444-4444-8444-444444444444",
    aucType: "Request",
    status: "Stopped",
    statusMobile: "Winner",
    loadCity: "Тирасполь",
    loadCityId: 7,
    unloadCity: "София",
    unloadCityId: 8,
    loadDate: "2026-08-04T12:00:00+03:00",
    currentPrice: 75_000,
    available: 74_500,
    canSetBet: false,
    isAvailable: false,
    isBidder: true,
  },
  {
    id: 105,
    cargoNum: "SL-1005",
    orderUid: "55555555-5555-4555-8555-555555555555",
    aucType: "Up",
    status: "Planning",
    statusMobile: "Confirmed",
    loadCity: "Комрат",
    loadCityId: 9,
    unloadCity: "Варна",
    unloadCityId: 10,
    loadDate: "2026-08-05T13:00:00+03:00",
    currentPrice: 12_000,
    available: 12_500,
    canSetBet: false,
    isAvailable: false,
    isBidder: true,
  },
];

function createFixture(seed: AuctionSeed): AuctionFixture {
  const listItem: AuctionListItem = {
    main: {
      id: seed.id,
      cargo_num: seed.cargoNum,
      cargo_date: seed.loadDate,
      auc_type: seed.aucType,
      order_uid: seed.orderUid,
      created_at: "2026-07-29T10:00:00+03:00",
      priority_sort: seed.id,
      is_assembly: false,
      price_per_km: seed.currentPrice / 500,
    },
    organizer: {
      subscriber_id: 98,
      organization_id: 340,
      organization_name: "Smart Cargo",
      organization_inn: "7703769184",
      is_hide_organization: false,
    },
    route: {
      load: {
        city: seed.loadCity,
        city_gc_id: seed.loadCityId,
        address: `${seed.loadCity}, Складская 1`,
        date: seed.loadDate,
        points_count: 1,
      },
      unload: {
        city: seed.unloadCity,
        city_gc_id: seed.unloadCityId,
        address: `${seed.unloadCity}, Терминальная 2`,
        date: seed.loadDate,
        points_count: 1,
      },
    },
    cargo: {
      name: "Паллетированный груз",
      weight: 20,
      volume: 82,
      body_type: "тентованный",
      truck_count: 1,
      is_cargo: true,
      loading_types: { side: true },
      docs: { cmr: true },
      car: null,
    },
    trading: {
      status: seed.status,
      status_mobile: seed.statusMobile,
      start_time: "2026-07-29T12:00:00+03:00",
      stop_time: "2026-08-01T18:00:00+03:00",
      bid_measurement_type: "PerRoute",
      can_set_bet: seed.canSetBet,
      allow_counter_bets: true,
      hide_points_address_and_contacts: false,
      is_bidder: seed.isBidder,
      is_available: seed.isAvailable,
      is_accredited: true,
      is_favorite: false,
      price: {
        start: seed.currentPrice + 3_000,
        current: seed.currentPrice,
        current_no_vat: seed.currentPrice / 1.2,
      },
      your: {
        bet: seed.isBidder,
        last_bet: seed.isBidder ? seed.currentPrice : null,
      },
    },
    payment: {
      form: "Безналичная с НДС",
      currency_code: "643",
    },
  };

  const detail: AuctionDetail = {
    main: {
      id: seed.id,
      cargo_num: seed.cargoNum,
      cargo_date: seed.loadDate,
      order_uid: seed.orderUid,
      auc_type: seed.aucType,
      created_at: "2026-07-29T10:00:00+03:00",
    },
    organizer: {
      subscriber_id: 98,
      subscriber_code: "ORG-98",
      organization_name: "Smart Cargo",
      organization_inn: "7703769184",
      organization_id: 340,
    },
    contacts: [{ name: "Анна Логист", phone: "+37360000000" }],
    cargo: {
      price: "150000",
      currency: 643,
      distance: 500,
      truck_count: 1,
      body_type: "тентованный",
      loading_types: { side: true },
      docs: { cmr: true },
      car: {},
    },
    trading: {
      status: seed.status,
      status_mobile: seed.statusMobile,
      start_time: "2026-07-29T12:00:00+03:00",
      stop_time: "2026-08-01T18:00:00+03:00",
      bid_measurement_type: "PerRoute",
      can_set_bet: seed.canSetBet,
      allow_counter_bets: true,
      hide_bets_history: seed.id === 104,
      hide_places: false,
      no_view_cargo_price: false,
      hide_points_address_and_contacts: false,
      is_bidder: seed.isBidder,
      is_favorite: false,
      price: {
        start: seed.currentPrice + 3_000,
        start_no_vat: (seed.currentPrice + 3_000) / 1.2,
        current: seed.currentPrice,
        current_no_vat: seed.currentPrice / 1.2,
        available: seed.available,
        available_no_vat: seed.available / 1.2,
        min: 1_000,
        max: 100_000,
        step: 500,
        step_no_vat: 500 / 1.2,
        price_per_km: seed.currentPrice / 500,
      },
      your: {
        bet: seed.isBidder,
        last_bet: seed.isBidder ? seed.currentPrice : null,
        last_bet_with_vat: seed.isBidder ? seed.currentPrice : null,
        win: seed.statusMobile === "Winner",
      },
      settings: { prolong_after_bet: 10 },
    },
    payment: {
      form: "Безналичная с НДС",
      currency_code: "643",
      delay: 30,
      delay_type: "CalendarDays",
    },
    assembly: {},
    routes: [
      {
        row_num: 1,
        op_type: "Loading",
        start_date: seed.loadDate,
        end_date: seed.loadDate,
        location: {
          city_name: seed.loadCity,
          city_full_name: `${seed.loadCity}, Молдова`,
          city_gc_id: seed.loadCityId,
          loading_address: `${seed.loadCity}, Складская 1`,
        },
        contact: { name: "Иван", phone: "+37360000001" },
        cargo: {
          name: "Паллетированный груз",
          weight: "20.000",
          volume: "82.000",
        },
      },
      {
        row_num: 2,
        op_type: "Unloading",
        start_date: seed.loadDate,
        end_date: seed.loadDate,
        location: {
          city_name: seed.unloadCity,
          city_full_name: seed.unloadCity,
          city_gc_id: seed.unloadCityId,
          loading_address: `${seed.unloadCity}, Терминальная 2`,
        },
        contact: { name: "Мария", phone: "+37360000002" },
        cargo: {
          name: "Паллетированный груз",
          weight: "20.000",
          volume: "82.000",
        },
      },
    ],
    admitted_organizations: [],
    hide_bets_history: seed.id === 104,
  };

  return { detail, listItem };
}

export const auctionFixtures = seeds.map(createFixture);

export const betFixtures: readonly BetItem[] = [
  {
    id: 1,
    created_at: "2026-07-29T12:00:00+03:00",
    auction_id: 101,
    subscriber_id: 77,
    contact_name: "Пётр",
    contact_phone: "+37361111111",
    price_with_vat: 28_000,
    price_no_vat: 28_000 / 1.2,
    organization_id: 770,
    organization_inn: "1000000001",
    organization_name: "Fast Freight",
    is_rejected: false,
    is_counter: false,
    place: 1,
    is_win: false,
    run_number: 0,
    cancel_reason: "",
    price_info: {
      price_with_vat: 28_000,
      price_no_vat: 28_000 / 1.2,
      payment_type: "Безналичная с НДС",
      vat_rate: "20",
    },
  },
  {
    id: 2,
    created_at: "2026-07-29T11:55:00+03:00",
    auction_id: 101,
    subscriber_id: 88,
    price_with_vat: 29_000,
    price_no_vat: 29_000 / 1.2,
    organization_id: 880,
    organization_name: "Road Runner",
    is_rejected: true,
    is_counter: false,
    place: null,
    is_win: false,
    run_number: 0,
    cancel_reason: "Отменена участником",
  },
  {
    id: 3,
    created_at: "2026-07-29T11:50:00+03:00",
    auction_id: 102,
    subscriber_id: 13,
    price_with_vat: 50_000,
    price_no_vat: 50_000 / 1.2,
    organization_id: 14,
    organization_name: "ООО Перевозчик",
    is_rejected: false,
    place: 1,
    cancel_reason: "",
  },
  {
    id: 4,
    created_at: "2026-07-29T11:45:00+03:00",
    auction_id: 104,
    subscriber_id: 13,
    price_with_vat: 75_000,
    price_no_vat: 75_000 / 1.2,
    organization_id: 14,
    organization_name: "ООО Перевозчик",
    is_rejected: false,
    place: 1,
    cancel_reason: "",
  },
];
