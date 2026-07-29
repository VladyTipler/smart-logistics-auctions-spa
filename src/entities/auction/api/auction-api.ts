import type {
  AuctionDetail,
  AuctionListRequest,
  AuctionListResponse,
} from "@/shared/api/contracts";
import { createHttpClient } from "@/shared/api/http-client";

const apiBaseUrl =
  typeof window === "undefined"
    ? "/api/v1"
    : new URL("/api/v1", window.location.origin).toString().replace(/\/$/, "");

const client = createHttpClient({ baseUrl: apiBaseUrl });

export const auctionApi = {
  getDetail(auctionUuid: string) {
    return client.get<AuctionDetail>(`/auctions/${auctionUuid}`);
  },
  getList(request: AuctionListRequest) {
    return client.post<AuctionListResponse, AuctionListRequest>(
      "/auctions/list",
      request,
    );
  },
};
