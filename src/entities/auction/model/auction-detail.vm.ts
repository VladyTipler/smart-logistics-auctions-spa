import type { AuctionAccess } from "./auction-access";

export type AuctionRoutePointViewModel = {
  id: string;
  sequence: number;
  operationLabel: string;
  city: string;
  dateLabel?: string;
  dateTime?: string;
  address?: string;
  contact?: {
    name?: string;
    phone?: string;
  };
  cargo: {
    name?: string;
    packageName?: string;
    packageAmount?: number;
    weight?: string;
    volume?: string;
    dimensionsLabel?: string;
    oversized?: boolean;
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
    isInternational: boolean;
    temperatureLabel?: string;
    adrClass?: number;
    loadingLabels: readonly string[];
    documentLabels: readonly string[];
    equipmentLabels: readonly string[];
    vehicle?: {
      type?: string;
      weightTons?: number;
      volumeCubicMeters?: number;
      widthMeters?: number;
      lengthMeters?: number;
      heightMeters?: number;
    };
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
    minPrice?: number;
    maxPrice?: number;
    ownLastBet?: number;
    step?: number;
    currencyCode?: string;
  };
};
