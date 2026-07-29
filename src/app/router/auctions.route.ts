import {
  createRoute,
  lazyRouteComponent,
  type SearchSchemaInput,
} from "@tanstack/react-router";

import { rootRoute } from "@/app/router/root.route";
import {
  auctionSearchSchema,
  type AuctionSearch,
} from "@/features/auction-filters/model/auction-search.schema";

type AuctionSearchInput = Partial<AuctionSearch> & SearchSchemaInput;

export const auctionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/auctions",
  validateSearch: (search: AuctionSearchInput): AuctionSearch =>
    auctionSearchSchema.parse(search),
  component: lazyRouteComponent(
    () => import("@/pages/auction-list/auction-list-page.component"),
    "AuctionListPage",
  ),
});
