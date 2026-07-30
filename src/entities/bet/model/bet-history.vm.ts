export type BetStatusViewModel = {
  label: string;
  tone: "active" | "cancelled" | "rejected" | "winner";
};

export type BetHistoryItemViewModel = {
  id: string;
  participantLabel: string;
  contactName?: string;
  createdAtLabel?: string;
  createdAt?: string;
  priceWithVat?: number;
  priceWithoutVat?: number;
  paymentLabel?: string;
  vatRateLabel?: string;
  place?: number;
  status: BetStatusViewModel;
  cancelReason?: string;
};

export type BetHistoryViewModel = {
  canViewPlaces: boolean;
  currencyCode?: string;
  participantCount: number;
  participantCountLabel: string;
  items: readonly BetHistoryItemViewModel[];
};
