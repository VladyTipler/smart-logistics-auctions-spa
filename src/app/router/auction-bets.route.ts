import {
  createRoute,
  lazyRouteComponent,
  notFound,
} from "@tanstack/react-router";

import { rootRoute } from "@/app/router/root.route";
import { auctionDetailQueryOptions } from "@/entities/auction/api/auction.queries";
import { resolveAuctionAccess } from "@/entities/auction/model/auction-access";
import { auctionBetHistoryQueryOptions } from "@/entities/bet/api/bet.queries";
import type { AuctionBetsLoaderData } from "@/pages/auction-bets/auction-bets-page.component";
import { ApiError } from "@/shared/api/api-error";
import { RouteErrorState } from "@/shared/ui/error-state/error-state.component";

function usefulText(value: string | null | undefined) {
  const text = value?.trim();
  return text ? text : undefined;
}

export const auctionBetsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/auctions/$auctionUuid/bets",
  loader: async ({
    context: { queryClient },
    params: { auctionUuid },
  }): Promise<AuctionBetsLoaderData> => {
    try {
      const detail = await queryClient.ensureQueryData(
        auctionDetailQueryOptions(auctionUuid),
      );
      const access = resolveAuctionAccess(detail);
      const base = {
        auctionUuid,
        cargoNumber: usefulText(detail.main.cargo_num) ?? "Без номера",
      };

      if (!access.canViewBetHistory) {
        return { ...base, visibility: "hidden" };
      }

      await queryClient.ensureQueryData({
        ...auctionBetHistoryQueryOptions(auctionUuid),
        revalidateIfStale: true,
      });
      const currencyCode = usefulText(detail.payment.currency_code);

      return {
        ...base,
        visibility: "visible",
        canViewPlaces: access.canViewPlaces,
        ...(currencyCode ? { currencyCode } : {}),
      };
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        throw notFound();
      }

      throw error;
    }
  },
  component: lazyRouteComponent(
    () => import("@/pages/auction-bets/auction-bets-page.component"),
    "AuctionBetsPage",
  ),
  pendingComponent: lazyRouteComponent(
    () => import("@/pages/auction-bets/auction-bets-page.component"),
    "AuctionBetsPendingPage",
  ),
  pendingMs: 0,
  notFoundComponent: lazyRouteComponent(
    () => import("@/pages/auction-detail/auction-detail-page.component"),
    "AuctionDetailNotFoundPage",
  ),
  errorComponent: RouteErrorState,
});
