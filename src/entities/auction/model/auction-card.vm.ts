export type AuctionStatusTone = "neutral" | "active" | "positive" | "warning";

export interface AuctionCardViewModel {
  action: {
    kind: "bid" | "details";
    label: string;
  };
  auctionType: string;
  auctionUuid: string | null;
  cargoNumber: string;
  cargoSummary: string;
  currentPrice: {
    amount: number;
    label: string;
  } | null;
  ownBidLabel: string | null;
  route: {
    load: RoutePointViewModel;
    unload: RoutePointViewModel;
  };
  status: {
    label: string;
    tone: AuctionStatusTone;
  };
}

export interface RoutePointViewModel {
  city: string;
  dateLabel: string;
}
