import type {
  AuctionDetail,
  AuctionListRequest,
  AuctionListResponse,
} from "@/shared/api/contracts";
import { createHttpClient } from "@/shared/api/http-client";

const client = createHttpClient({ baseUrl: "/api/v1" });

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
