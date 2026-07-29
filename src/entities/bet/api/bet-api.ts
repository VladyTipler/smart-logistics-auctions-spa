import type { BetListResponse } from "@/shared/api/contracts";
import { createHttpClient } from "@/shared/api/http-client";

const apiBaseUrl =
  typeof window === "undefined"
    ? "/api/v1"
    : new URL("/api/v1", window.location.origin).toString().replace(/\/$/, "");

const client = createHttpClient({ baseUrl: apiBaseUrl });

export const betApi = {
  getHistory(auctionUuid: string) {
    return client.get<BetListResponse>(
      `/auctions/${auctionUuid}/bets?all=true`,
    );
  },
};
