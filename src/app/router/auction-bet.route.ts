import {
  createRoute,
  lazyRouteComponent,
  notFound,
} from "@tanstack/react-router";

import { rootRoute } from "@/app/router/root.route";
import { auctionDetailQueryOptions } from "@/entities/auction/api/auction.queries";
import { resolveAuctionAccess } from "@/entities/auction/model/auction-access";
import { mapSetBetViewModel } from "@/features/set-bet/model/set-bet.vm";
import type { AuctionBetLoaderData } from "@/pages/auction-bet/auction-bet-page.component";
import { ApiError } from "@/shared/api/api-error";
import { RouteErrorState } from "@/shared/ui/error-state/error-state.component";

export const auctionBetRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/auctions/$auctionUuid/bet",
  loader: async ({
    context: { queryClient },
    params: { auctionUuid },
  }): Promise<AuctionBetLoaderData> => {
    try {
      const detail = await queryClient.ensureQueryData(
        auctionDetailQueryOptions(auctionUuid),
      );
      const cargoNumber = detail.main.cargo_num?.trim() || "Без номера";

      if (!resolveAuctionAccess(detail).canSetBet) {
        return {
          availability: "unavailable",
          auctionUuid,
          cargoNumber,
        };
      }

      return {
        availability: "available",
        auction: mapSetBetViewModel(detail, auctionUuid),
      };
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        throw notFound();
      }

      throw error;
    }
  },
  component: lazyRouteComponent(
    () => import("@/pages/auction-bet/auction-bet-page.component"),
    "AuctionBetPage",
  ),
  pendingComponent: lazyRouteComponent(
    () => import("@/pages/auction-bet/auction-bet-page.component"),
    "AuctionBetPendingPage",
  ),
  pendingMs: 0,
  notFoundComponent: lazyRouteComponent(
    () => import("@/pages/auction-detail/auction-detail-page.component"),
    "AuctionDetailNotFoundPage",
  ),
  errorComponent: RouteErrorState,
});
