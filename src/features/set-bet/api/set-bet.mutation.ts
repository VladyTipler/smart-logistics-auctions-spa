import { useMutation, useQueryClient } from "@tanstack/react-query";

import { auctionKeys } from "@/entities/auction/api/auction.queries";
import { betKeys } from "@/entities/bet/api/bet.queries";
import type { SetBetRequest } from "@/shared/api/contracts";
import { createHttpClient } from "@/shared/api/http-client";

const apiBaseUrl =
  typeof window === "undefined"
    ? "/api/v1"
    : new URL("/api/v1", window.location.origin).toString().replace(/\/$/, "");

const client = createHttpClient({ baseUrl: apiBaseUrl });

export const setBetMutationKey = (auctionUuid: string) =>
  ["set-bet", auctionUuid] as const;

export function useSetBetMutation(auctionUuid: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: setBetMutationKey(auctionUuid),
    mutationFn: (request: SetBetRequest) =>
      client.post<void, SetBetRequest>(
        `/auctions/${auctionUuid}/bets`,
        request,
      ),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: auctionKeys.lists() }),
        queryClient.invalidateQueries({
          queryKey: auctionKeys.detail(auctionUuid),
        }),
        queryClient.invalidateQueries({
          queryKey: betKeys.byAuction(auctionUuid),
        }),
      ]);
    },
  });
}
