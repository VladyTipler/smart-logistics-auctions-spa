import auctionBetRouteSource from "./auction-bet.route.ts?raw";
import auctionBetsRouteSource from "./auction-bets.route.ts?raw";
import auctionDetailRouteSource from "./auction-detail.route.ts?raw";
import auctionsRouteSource from "./auctions.route.ts?raw";
import testSetupSource from "@/shared/config/test/setup-tests.ts?raw";

const routeModules = [
  [
    "auctions.route.ts",
    auctionsRouteSource,
    "@/pages/auction-list/auction-list-page.component",
  ],
  [
    "auction-detail.route.ts",
    auctionDetailRouteSource,
    "@/pages/auction-detail/auction-detail-page.component",
  ],
  [
    "auction-bets.route.ts",
    auctionBetsRouteSource,
    "@/pages/auction-bets/auction-bets-page.component",
  ],
  [
    "auction-bet.route.ts",
    auctionBetRouteSource,
    "@/pages/auction-bet/auction-bet-page.component",
  ],
] as const;

describe("route bundle boundaries", () => {
  it("does not warm lazy page modules from the global test setup", () => {
    expect(testSetupSource).not.toContain('import "@/pages/');
  });

  it.each(routeModules)(
    "loads the page behind %s through a dynamic import",
    (_routeFile, source, pageModule) => {
      expect(source).toContain(`import("${pageModule}")`);
      expect(source).not.toMatch(
        new RegExp(
          `import\\s+\\{[^}]+\\}\\s+from\\s+["']${pageModule.replaceAll(
            "/",
            "\\/",
          )}["']`,
          "s",
        ),
      );
    },
  );
});
