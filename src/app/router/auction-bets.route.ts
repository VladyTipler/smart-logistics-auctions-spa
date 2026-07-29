import { createRoute } from "@tanstack/react-router";

import { rootRoute } from "@/app/router/root.route";
import { AuctionBetsPage } from "@/pages/auction-bets/auction-bets-page.component";

export const auctionBetsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/auctions/$auctionUuid/bets",
  component: AuctionBetsPage,
});
