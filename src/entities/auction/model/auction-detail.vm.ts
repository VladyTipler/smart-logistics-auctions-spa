import type { AuctionAccess } from "./auction-access";

export type AuctionRoutePointViewModel = {
  id: string;
  sequence: number;
  operationLabel: string;
  city: string;
  dateLabel?: string;
  address?: string;
  contact?: {
    name?: string;
    phone?: string;
  };
  cargo: {
    name?: string;
    weight?: string;
    volume?: string;
  };
};

export type AuctionDetailViewModel = {
  access: AuctionAccess;
  identity: {
    auctionUuid: string;
    cargoNumber: string;
    auctionType: string;
    createdAtLabel?: string;
  };
  organizer: {
    name: string;
    taxId?: string;
    contacts: readonly {
      name?: string;
      phone?: string;
    }[];
  };
  route: readonly AuctionRoutePointViewModel[];
  cargo: {
    bodyType?: string;
    truckCount?: number;
    distanceKm?: number;
    loadingLabels: readonly string[];
    documentLabels: readonly string[];
    value?: {
      amount: number;
      currencyCode?: string;
    };
  };
  payment: {
    form: string;
    delayLabel?: string;
    condition?: string;
    currencyCode?: string;
  };
  trading: {
    statusLabel: string;
    statusTone: "active" | "neutral" | "positive" | "warning";
    stopTimeLabel?: string;
    currentPrice?: number;
    availablePrice?: number;
    ownLastBet?: number;
    step?: number;
    currencyCode?: string;
  };
};
