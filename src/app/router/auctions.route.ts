import { createRoute } from "@tanstack/react-router";

import { rootRoute } from "@/app/router/root.route";
import { AuctionListPage } from "@/pages/auction-list/auction-list-page.component";

export const auctionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/auctions",
  component: AuctionListPage,
});
