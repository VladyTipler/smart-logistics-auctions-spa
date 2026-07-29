import { createRoute } from "@tanstack/react-router";

import { rootRoute } from "@/app/router/root.route";
import { AuctionDetailPage } from "@/pages/auction-detail/auction-detail-page.component";

export const auctionDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/auctions/$auctionUuid",
  component: AuctionDetailPage,
});
