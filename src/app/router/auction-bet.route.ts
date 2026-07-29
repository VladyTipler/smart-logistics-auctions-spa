import { createRoute } from "@tanstack/react-router";

import { rootRoute } from "@/app/router/root.route";
import { AuctionBetPage } from "@/pages/auction-bet/auction-bet-page.component";

export const auctionBetRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/auctions/$auctionUuid/bet",
  component: AuctionBetPage,
});
