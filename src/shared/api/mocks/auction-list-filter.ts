import type { components } from "../generated/auctions-api";

type AuctionListItem = components["schemas"]["AuctionListItem"];
type AuctionListRequest = components["schemas"]["AuctionListRequest"];

const AUCTION_STATUS_BY_ID = {
  1: "Planning",
  2: "Auction",
  3: "DeterminateWinner",
  4: "WaitDeal",
  5: "InProgress",
  6: "Finished",
  7: "Stopped",
  8: "Canceled",
} as const;

function contains(value: string | undefined, query: string): boolean {
  return value?.toLocaleLowerCase().includes(query.toLocaleLowerCase()) ?? false;
}

function isAtOrAfter(value: string | undefined, boundary: string): boolean {
  return value !== undefined && Date.parse(value) >= Date.parse(boundary);
}

function isAtOrBefore(value: string | undefined, boundary: string): boolean {
  return value !== undefined && Date.parse(value) <= Date.parse(boundary);
}

function matchesArray<T>(filter: readonly T[] | undefined, value: T | undefined) {
  return filter === undefined || filter.length === 0 || filter.includes(value as T);
}

export function filterAuctionList(
  auctions: readonly AuctionListItem[],
  request: AuctionListRequest,
): AuctionListItem[] {
  return auctions.filter((auction) => {
    const { main, route, trading } = auction;
    const currentPrice = trading?.price?.current;
    const allowedStatuses = request.statuses?.map(
      (status) => AUCTION_STATUS_BY_ID[status as keyof typeof AUCTION_STATUS_BY_ID],
    );

    return (
      (request.cargo_num === undefined ||
        contains(main?.cargo_num, request.cargo_num)) &&
      matchesArray(request.status, trading?.status_mobile) &&
      matchesArray(allowedStatuses, trading?.status) &&
      matchesArray(request.auc_type, main?.auc_type) &&
      (request.load_city === undefined ||
        contains(route?.load?.city, request.load_city)) &&
      (request.unload_city === undefined ||
        contains(route?.unload?.city, request.unload_city)) &&
      (request.load_date_from === undefined ||
        isAtOrAfter(route?.load?.date, request.load_date_from)) &&
      (request.load_date_to === undefined ||
        isAtOrBefore(route?.load?.date, request.load_date_to)) &&
      (request.is_available === undefined ||
        trading?.is_available === request.is_available) &&
      (request.is_bidder === undefined ||
        trading?.is_bidder === request.is_bidder) &&
      (request.current_price_from == null ||
        (currentPrice !== undefined &&
          currentPrice >= request.current_price_from)) &&
      (request.current_price_to == null ||
        (currentPrice !== undefined && currentPrice <= request.current_price_to))
    );
  });
}
