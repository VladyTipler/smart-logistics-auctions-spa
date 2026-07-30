import {
  createRoute,
  lazyRouteComponent,
  notFound,
} from "@tanstack/react-router";

import { rootRoute } from "@/app/router/root.route";
import { auctionDetailQueryOptions } from "@/entities/auction/api/auction.queries";
import { ApiError } from "@/shared/api/api-error";
import { RouteErrorState } from "@/shared/ui/error-state/error-state.component";

const loadAuctionDetailPage = () =>
  import("@/pages/auction-detail/auction-detail-page.component");

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
  component: lazyRouteComponent(loadAuctionDetailPage, "AuctionDetailPage"),
  pendingComponent: lazyRouteComponent(
    loadAuctionDetailPage,
    "AuctionDetailPendingPage",
  ),
  pendingMs: 0,
  notFoundComponent: lazyRouteComponent(
    loadAuctionDetailPage,
    "AuctionDetailNotFoundPage",
  ),
  errorComponent: RouteErrorState,
});
