import {
  createRouter,
  parseSearchWith,
  stringifySearchWith,
  type RouterHistory,
} from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";

import { appQueryClient } from "@/app/providers/query-client";
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
  queryClient?: QueryClient;
};

function parseStructuredSearchValue(value: string): unknown {
  if (
    value === "true" ||
    value === "false" ||
    value === "null" ||
    value.startsWith("[") ||
    value.startsWith("{") ||
    value.startsWith("\"")
  ) {
    return JSON.parse(value) as unknown;
  }

  throw new SyntaxError("Keep scalar values lexical");
}

export const parseAppSearch = parseSearchWith(parseStructuredSearchValue);
export const stringifyAppSearch = stringifySearchWith(
  JSON.stringify,
  parseStructuredSearchValue,
);

export function createAppRouter({
  history,
  queryClient = appQueryClient,
}: CreateAppRouterOptions = {}) {
  return createRouter({
    routeTree,
    history,
    context: { queryClient },
    parseSearch: parseAppSearch,
    stringifySearch: stringifyAppSearch,
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
