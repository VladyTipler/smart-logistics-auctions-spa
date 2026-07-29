import type { components } from "../generated/auctions-api";
import { filterAuctionList } from "./auction-list-filter";
import { auctionFixtures, betFixtures } from "./fixtures/auctions.fixture";

type AuctionDetail = components["schemas"]["AuctionShowResponse"];
type AuctionListItem = components["schemas"]["AuctionListItem"];
type AuctionListRequest = components["schemas"]["AuctionListRequest"];
type AuctionListResponse = components["schemas"]["AuctionListResponseBase"];
type BetItem = components["schemas"]["BetItem"];
type BetListResponse = components["schemas"]["BetListResponse"];

interface MutableAuction {
  detail: AuctionDetail;
  listItem: AuctionListItem;
}

const CURRENT_SUBSCRIBER_ID = 13;
const CURRENT_ORGANIZATION_ID = 14;

let auctions: MutableAuction[] = [];
let bets: BetItem[] = [];
let nextBidId = 1;

function clone<T>(value: T): T {
  return structuredClone(value);
}

function findAuction(orderUid: string): MutableAuction | undefined {
  return auctions.find(
    (auction) => auction.listItem.main?.order_uid === orderUid,
  );
}

function isInactiveBid(bet: BetItem): boolean {
  return bet.is_rejected === true || Boolean(bet.cancel_reason);
}

function updateRanks(auction: MutableAuction): void {
  const auctionId = auction.listItem.main?.id;
  const direction = auction.listItem.main?.auc_type === "Up" ? -1 : 1;
  const activeBids = bets
    .filter((bet) => bet.auction_id === auctionId && !isInactiveBid(bet))
    .sort(
      (left, right) =>
        direction *
        ((left.price_with_vat ?? Number.POSITIVE_INFINITY) -
          (right.price_with_vat ?? Number.POSITIVE_INFINITY)),
    );

  bets
    .filter((bet) => bet.auction_id === auctionId)
    .forEach((bet) => {
      bet.place = isInactiveBid(bet) ? null : activeBids.indexOf(bet) + 1;
    });
}

export function resetMockDatabase(): void {
  auctions = clone(auctionFixtures);
  bets = betFixtures.map((bet) => clone(bet));
  nextBidId =
    bets.reduce((maximum, bet) => Math.max(maximum, bet.id ?? 0), 0) + 1;
}

export function queryAuctionList(
  request: AuctionListRequest,
): AuctionListResponse {
  const filtered = filterAuctionList(
    auctions.map((auction) => auction.listItem),
    request,
  );
  const perPage = Math.min(Math.max(Math.trunc(request.per_page ?? 20), 1), 100);
  const lastPage = Math.max(Math.ceil(filtered.length / perPage), 1);
  const currentPage = Math.min(
    Math.max(Math.trunc(request.page ?? 1), 1),
    lastPage,
  );
  const offset = (currentPage - 1) * perPage;
  const page = filtered.slice(offset, offset + perPage);

  return clone({
    data: page,
    meta: {
      current_page: currentPage,
      from: page.length === 0 ? 0 : offset + 1,
      last_page: lastPage,
      per_page: perPage,
      to: page.length === 0 ? 0 : offset + page.length,
      total: filtered.length,
    },
  });
}

export function queryAuctionDetail(orderUid: string): AuctionDetail | undefined {
  const auction = findAuction(orderUid);
  return auction ? clone(auction.detail) : undefined;
}

export function queryAuctionBets(
  orderUid: string,
  includeInactive: boolean,
): BetListResponse | undefined {
  const auction = findAuction(orderUid);

  if (!auction) {
    return undefined;
  }

  if (
    auction.detail.hide_bets_history ||
    auction.detail.trading.hide_bets_history
  ) {
    return { bets: [] };
  }

  const auctionId = auction.listItem.main?.id;
  const selectedBets = bets.filter(
    (bet) =>
      bet.auction_id === auctionId && (includeInactive || !isInactiveBid(bet)),
  );

  return clone({ bets: selectedBets });
}

export function canSetAuctionBet(orderUid: string): boolean | undefined {
  return findAuction(orderUid)?.detail.trading.can_set_bet;
}

export function createAuctionBet(
  orderUid: string,
  price: number,
): BetItem | undefined {
  const auction = findAuction(orderUid);

  if (!auction) {
    return undefined;
  }

  const priceNoVat = price / 1.2;
  const step = auction.detail.trading.price?.step ?? 0;
  const isUpAuction = auction.listItem.main?.auc_type === "Up";
  const available = isUpAuction ? price + step : price - step;
  const bid: BetItem = {
    id: nextBidId,
    created_at: `2026-07-29T12:${String(nextBidId).padStart(2, "0")}:00+03:00`,
    auction_id: auction.listItem.main?.id,
    subscriber_id: CURRENT_SUBSCRIBER_ID,
    contact_name: "Иванов Иван",
    contact_phone: "+79001234567",
    price_with_vat: price,
    price_no_vat: priceNoVat,
    organization_id: CURRENT_ORGANIZATION_ID,
    organization_inn: "9616244307",
    organization_name: "ООО Перевозчик",
    transporter_comment: null,
    is_rejected: false,
    is_counter: false,
    place: null,
    is_win: false,
    run_number: 0,
    cancel_reason: "",
    price_info: {
      price_with_vat: price,
      price_no_vat: priceNoVat,
      payment_type: "Безналичная с НДС",
      vat_rate: "20",
    },
  };

  nextBidId += 1;
  bets.push(bid);

  const listTrading = auction.listItem.trading;
  const detailTrading = auction.detail.trading;

  if (listTrading) {
    listTrading.status_mobile = "Leading";
    listTrading.is_bidder = true;
    listTrading.is_available = true;
    listTrading.price = {
      ...listTrading.price,
      current: price,
      current_no_vat: priceNoVat,
    };
    listTrading.your = {
      bet: true,
      last_bet: price,
    };
  }

  detailTrading.status_mobile = "Leading";
  detailTrading.is_bidder = true;
  detailTrading.price = {
    ...detailTrading.price,
    current: price,
    current_no_vat: priceNoVat,
    available,
    available_no_vat: available / 1.2,
    price_per_km:
      auction.detail.cargo.distance && auction.detail.cargo.distance > 0
        ? priceNoVat / auction.detail.cargo.distance
        : 0,
  };
  detailTrading.your = {
    ...detailTrading.your,
    bet: true,
    last_bet: price,
    last_bet_with_vat: price,
  };

  updateRanks(auction);

  return clone(bid);
}

resetMockDatabase();
