import { describe, expect, it } from "vitest";

import type { AuctionDetail } from "@/shared/api/contracts";

import { resolveAuctionAccess } from "./auction-access";

function detailWith(
  root: Partial<AuctionDetail> = {},
  trading: Partial<AuctionDetail["trading"]> = {},
): AuctionDetail {
  return {
    main: {},
    organizer: {},
    contacts: [],
    cargo: {},
    trading: { ...trading },
    payment: {},
    assembly: {},
    routes: [],
    admitted_organizations: [],
    ...root,
  };
}

describe("resolveAuctionAccess", () => {
  it("allows a bid only when can_set_bet is explicitly true", () => {
    expect(
      resolveAuctionAccess(detailWith({}, { can_set_bet: true })).canSetBet,
    ).toBe(true);
    expect(resolveAuctionAccess(detailWith()).canSetBet).toBe(false);
    expect(
      resolveAuctionAccess(detailWith({}, { can_set_bet: false })).canSetBet,
    ).toBe(false);
  });

  it.each([
    [{ hide_bets_history: true }, {}, false],
    [{}, { hide_bets_history: true }, false],
    [
      { hide_bets_history: true },
      { hide_bets_history: false },
      false,
    ],
    [
      { hide_bets_history: false },
      { hide_bets_history: false },
      true,
    ],
  ] satisfies [
    Partial<AuctionDetail>,
    Partial<AuctionDetail["trading"]>,
    boolean,
  ][])(
    "combines root and nested hide_bets_history with OR",
    (root, trading, expected) => {
      expect(
        resolveAuctionAccess(detailWith(root, trading)).canViewBetHistory,
      ).toBe(expected);
    },
  );

  it("treats every remaining guard independently", () => {
    expect(
      resolveAuctionAccess(
        detailWith(
          {},
          {
            hide_points_address_and_contacts: true,
            no_view_cargo_price: false,
            hide_places: false,
          },
        ),
      ).canViewPointDetails,
    ).toBe(false);
    expect(
      resolveAuctionAccess(
        detailWith({}, { no_view_cargo_price: true }),
      ).canViewCargoValue,
    ).toBe(false);
    expect(
      resolveAuctionAccess(detailWith({}, { hide_places: true })).canViewPlaces,
    ).toBe(false);
  });
});
