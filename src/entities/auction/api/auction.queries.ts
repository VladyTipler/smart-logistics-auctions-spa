import { queryOptions } from "@tanstack/react-query";

import type { AuctionListRequest } from "@/shared/api/contracts";

import { auctionApi } from "./auction-api";

export const auctionKeys = {
  all: ["auctions"] as const,
  detail: (auctionUuid: string) =>
    [...auctionKeys.all, "detail", auctionUuid] as const,
  lists: () => [...auctionKeys.all, "list"] as const,
  list: (request: AuctionListRequest) =>
    [...auctionKeys.lists(), request] as const,
};

export function auctionListQueryOptions(request: AuctionListRequest) {
  return queryOptions({
    queryKey: auctionKeys.list(request),
    queryFn: () => auctionApi.getList(request),
  });
}

export function auctionDetailQueryOptions(auctionUuid: string) {
  return queryOptions({
    queryKey: auctionKeys.detail(auctionUuid),
    queryFn: () => auctionApi.getDetail(auctionUuid),
    staleTime: 60_000,
  });
}
