import type { components } from "@/shared/api/generated/auctions-api";

import type {
  AuctionCardViewModel,
  AuctionStatusTone,
  RoutePointViewModel,
} from "./auction-card.vm";

type AuctionListItem = components["schemas"]["AuctionListItem"];
type RoutePoint = components["schemas"]["AuctionListItemRoutePoint"];

const auctionTypeLabels: Record<string, string> = {
  Down: "На понижение",
  FixPrice: "Фиксированная цена",
  Request: "По запросу",
  Unknown: "Неизвестный тип",
  Up: "На повышение",
};

const statusLabels: Record<
  string,
  { label: string; tone: AuctionStatusTone }
> = {
  Confirmed: { label: "Подтверждено", tone: "positive" },
  Leading: { label: "Лидируете", tone: "positive" },
  Losing: { label: "Ставка перебита", tone: "warning" },
  NotParticipating: { label: "Не участвуете", tone: "neutral" },
  Unknown: { label: "Статус неизвестен", tone: "neutral" },
  Winner: { label: "Победитель", tone: "positive" },
};

function formatDate(value: string | undefined): string {
  if (!value || Number.isNaN(Date.parse(value))) {
    return "Дата не указана";
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    timeZone: "Europe/Chisinau",
  }).format(new Date(value));
}

function formatMoney(value: number, currencyCode = "643"): string {
  const currency = currencyCode === "643" ? "RUB" : currencyCode;

  try {
    return new Intl.NumberFormat("ru-RU", {
      currency,
      maximumFractionDigits: 0,
      style: "currency",
    }).format(value);
  } catch {
    return `${new Intl.NumberFormat("ru-RU").format(value)} ${currencyCode}`;
  }
}

function mapRoutePoint(point: RoutePoint | undefined): RoutePointViewModel {
  return {
    city: point?.city?.trim() || "Пункт не указан",
    dateLabel: formatDate(point?.date),
  };
}

function cargoSummary(dto: AuctionListItem): string {
  const parts = [
    dto.cargo?.name,
    dto.cargo?.weight == null ? undefined : `${dto.cargo.weight} т`,
    dto.cargo?.volume == null ? undefined : `${dto.cargo.volume} м³`,
    dto.cargo?.body_type,
  ].filter((part): part is string => Boolean(part));

  return parts.length > 0
    ? parts.join(" · ")
    : "Параметры груза не указаны";
}

export function mapAuctionCard(dto: AuctionListItem): AuctionCardViewModel {
  const auctionUuid = dto.main?.order_uid?.trim() || null;
  const current = dto.trading?.price?.current;
  const canBid = dto.trading?.can_set_bet === true && auctionUuid !== null;
  const status =
    statusLabels[dto.trading?.status_mobile ?? ""] ??
    statusLabels.Unknown;
  const lastBid = dto.trading?.your?.last_bet;

  return {
    auctionUuid,
    cargoNumber: dto.main?.cargo_num?.trim() || "Без номера",
    auctionType:
      dto.main?.auc_type === undefined
        ? "Тип не указан"
        : (auctionTypeLabels[dto.main.auc_type] ?? "Неизвестный тип"),
    route: {
      load: mapRoutePoint(dto.route?.load),
      unload: mapRoutePoint(dto.route?.unload),
    },
    cargoSummary: cargoSummary(dto),
    currentPrice:
      current == null
        ? null
        : {
            amount: current,
            label: formatMoney(current, dto.payment?.currency_code),
          },
    status,
    action: {
      kind: canBid ? "bid" : "details",
      label: canBid ? "Сделать ставку" : "Открыть аукцион",
    },
    ownBidLabel:
      lastBid == null
        ? null
        : `Ваша ставка ${formatMoney(lastBid, dto.payment?.currency_code)}`,
  };
}
