import { queryOptions } from "@tanstack/react-query";

import { betApi } from "./bet-api";

export const betKeys = {
  all: ["bets"] as const,
  byAuction: (auctionUuid: string) =>
    [...betKeys.all, "auction", auctionUuid] as const,
};

export function auctionBetHistoryQueryOptions(auctionUuid: string) {
  return queryOptions({
    queryKey: betKeys.byAuction(auctionUuid),
    queryFn: () => betApi.getHistory(auctionUuid),
  });
}
