import {
  createRouter,
  type RouterHistory,
} from "@tanstack/react-router";

import { auctionBetRoute } from "@/app/router/auction-bet.route";
import { auctionBetsRoute } from "@/app/router/auction-bets.route";
import { auctionDetailRoute } from "@/app/router/auction-detail.route";
import { auctionsRoute } from "@/app/router/auctions.route";
import { rootRoute } from "@/app/router/root.route";

const routeTree = rootRoute.addChildren([
  auctionsRoute,
  auctionDetailRoute,
  auctionBetsRoute,
  auctionBetRoute,
]);

type CreateAppRouterOptions = {
  history?: RouterHistory;
};

export function createAppRouter({ history }: CreateAppRouterOptions = {}) {
  return createRouter({
    routeTree,
    history,
    defaultPreload: "intent",
    scrollRestoration:
      history === undefined && import.meta.env.MODE !== "test",
  });
}

export const appRouter = createAppRouter();
export type AppRouter = typeof appRouter;

declare module "@tanstack/react-router" {
  interface Register {
    router: AppRouter;
  }
}
