import type { BetListResponse } from "@/shared/api/contracts";

import type {
  BetHistoryItemViewModel,
  BetHistoryViewModel,
  BetStatusViewModel,
} from "./bet-history.vm";

type MapBetHistoryOptions = {
  canViewPlaces: boolean;
  currencyCode?: string;
};

function usefulText(value: string | null | undefined) {
  const text = value?.trim();
  return text ? text : undefined;
}

function nonnegativeNumber(value: number | null | undefined) {
  return typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0
    ? value
    : undefined;
}

function positiveInteger(value: number | null | undefined) {
  return typeof value === "number" &&
    Number.isInteger(value) &&
    value > 0
    ? value
    : undefined;
}

function validDateTime(value: string | undefined) {
  if (!value || Number.isNaN(new Date(value).getTime())) {
    return undefined;
  }

  return value;
}

function formatDateTime(value: string | undefined) {
  const dateTime = validDateTime(value);
  if (!dateTime) {
    return undefined;
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateTime));
}

function resolveStatus(
  isWinner: boolean | undefined,
  isRejected: boolean | undefined,
  cancelReason: string | undefined,
): BetStatusViewModel {
  if (cancelReason) {
    return { label: "Отменена", tone: "cancelled" };
  }
  if (isRejected === true) {
    return { label: "Отклонена", tone: "rejected" };
  }
  if (isWinner === true) {
    return { label: "Победитель", tone: "winner" };
  }

  return { label: "Активна", tone: "active" };
}

function participantCountLabel(count: number) {
  const lastTwo = count % 100;
  const last = count % 10;
  const noun =
    lastTwo >= 11 && lastTwo <= 14
      ? "участников"
      : last === 1
        ? "участник"
        : last >= 2 && last <= 4
          ? "участника"
          : "участников";

  return `${count} ${noun}`;
}

export function mapBetHistory(
  response: BetListResponse,
  options: MapBetHistoryOptions,
): BetHistoryViewModel {
  const participantIds = new Set(
    response.bets
      .map((bet) => positiveInteger(bet.subscriber_id))
      .filter((id): id is number => id !== undefined),
  );

  const items: BetHistoryItemViewModel[] = response.bets.map((bet, index) => {
    const subscriberId = positiveInteger(bet.subscriber_id);
    const cancelReason = usefulText(bet.cancel_reason);
    const priceWithVat =
      nonnegativeNumber(bet.price_info?.price_with_vat) ??
      nonnegativeNumber(bet.price_with_vat);
    const priceWithoutVat =
      nonnegativeNumber(bet.price_info?.price_no_vat) ??
      nonnegativeNumber(bet.price_no_vat);
    const place = positiveInteger(bet.place);
    const vatRate = usefulText(bet.price_info?.vat_rate);

    const contactName = usefulText(bet.contact_name);
    const createdAt = validDateTime(bet.created_at);
    const createdAtLabel = formatDateTime(bet.created_at);
    const paymentLabel = usefulText(bet.price_info?.payment_type);
    const vatRateLabel =
      vatRate === "0" ? "Без НДС" : vatRate ? `НДС ${vatRate}%` : undefined;

    return {
      id: String(
        positiveInteger(bet.id) ?? `${subscriberId ?? "unknown"}-${index}`,
      ),
      participantLabel:
        usefulText(bet.organization_name) ??
        (subscriberId === undefined
          ? "Участник"
          : `Участник #${subscriberId}`),
      ...(contactName ? { contactName } : {}),
      ...(createdAtLabel ? { createdAtLabel } : {}),
      ...(createdAt ? { createdAt } : {}),
      ...(priceWithVat !== undefined ? { priceWithVat } : {}),
      ...(priceWithoutVat !== undefined ? { priceWithoutVat } : {}),
      ...(paymentLabel ? { paymentLabel } : {}),
      ...(vatRateLabel ? { vatRateLabel } : {}),
      ...(options.canViewPlaces && place !== undefined ? { place } : {}),
      status: resolveStatus(bet.is_win, bet.is_rejected, cancelReason),
      ...(cancelReason ? { cancelReason } : {}),
    };
  });

  return {
    canViewPlaces: options.canViewPlaces,
    currencyCode: usefulText(options.currencyCode),
    participantCount: participantIds.size,
    participantCountLabel: participantCountLabel(participantIds.size),
    items,
  };
}
