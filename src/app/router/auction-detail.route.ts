import { createRoute, notFound } from "@tanstack/react-router";

import { rootRoute } from "@/app/router/root.route";
import {
  AuctionDetailNotFoundPage,
  AuctionDetailPage,
  AuctionDetailPendingPage,
} from "@/pages/auction-detail/auction-detail-page.component";
import { auctionDetailQueryOptions } from "@/entities/auction/api/auction.queries";
import { ApiError } from "@/shared/api/api-error";
import { RouteErrorState } from "@/shared/ui/error-state/error-state.component";

export const auctionDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/auctions/$auctionUuid",
  loader: async ({ context: { queryClient }, params: { auctionUuid } }) => {
    try {
      return await queryClient.ensureQueryData(
        auctionDetailQueryOptions(auctionUuid),
      );
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        throw notFound();
      }

      throw error;
    }
  },
  component: AuctionDetailPage,
  pendingComponent: AuctionDetailPendingPage,
  pendingMs: 0,
  notFoundComponent: AuctionDetailNotFoundPage,
  errorComponent: RouteErrorState,
});
