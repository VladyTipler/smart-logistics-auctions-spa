import type { AuctionDetail } from "@/shared/api/contracts";

export type AuctionAccess = {
  canSetBet: boolean;
  canViewBetHistory: boolean;
  canViewCargoValue: boolean;
  canViewPlaces: boolean;
  canViewPointDetails: boolean;
};

export function resolveAuctionAccess(detail: AuctionDetail): AuctionAccess {
  return {
    canSetBet: detail.trading.can_set_bet === true,
    canViewBetHistory:
      detail.hide_bets_history !== true &&
      detail.trading.hide_bets_history !== true,
    canViewCargoValue: detail.trading.no_view_cargo_price !== true,
    canViewPlaces: detail.trading.hide_places !== true,
    canViewPointDetails:
      detail.trading.hide_points_address_and_contacts !== true,
  };
}
