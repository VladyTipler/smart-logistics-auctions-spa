import type { AuctionDetail } from "@/shared/api/contracts";

import type {
  AuctionBidDirection,
  SetBetConstraints,
} from "./set-bet.schema";

export type SetBetViewModel = {
  auctionUuid: string;
  cargoNumber: string;
  constraints: SetBetConstraints;
  currencyCode: string;
  currencySuffix: string;
  currentPrice?: number;
  routeLabel: string;
};

const currencyByCode: Record<string, { code: string; suffix: string }> = {
  "498": { code: "498", suffix: "MDL" },
  "643": { code: "643", suffix: "₽" },
  "840": { code: "840", suffix: "$" },
  "978": { code: "978", suffix: "€" },
  EUR: { code: "978", suffix: "€" },
  MDL: { code: "498", suffix: "MDL" },
  RUB: { code: "643", suffix: "₽" },
  RUR: { code: "643", suffix: "₽" },
  USD: { code: "840", suffix: "$" },
};

function usefulText(value: string | null | undefined, fallback: string): string {
  return value?.trim() || fallback;
}

function bidDirection(detail: AuctionDetail): AuctionBidDirection {
  const direction = detail.main.auc_type;
  return direction === "Up" ||
    direction === "Down" ||
    direction === "FixPrice"
    ? direction
    : "Request";
}

export function mapSetBetViewModel(
  detail: AuctionDetail,
  auctionUuid: string,
): SetBetViewModel {
  const loading = detail.routes.find((route) => route.op_type === "Loading");
  const unloading = detail.routes.find(
    (route) => route.op_type === "Unloading",
  );
  const price = detail.trading.price;
  const rawCurrencyCode = usefulText(detail.payment.currency_code, "643");
  const currency = currencyByCode[rawCurrencyCode.toUpperCase()] ?? {
    code: rawCurrencyCode,
    suffix: rawCurrencyCode,
  };

  return {
    auctionUuid,
    cargoNumber: usefulText(detail.main.cargo_num, "Без номера"),
    constraints: {
      available: price?.available,
      direction: bidDirection(detail),
      max: price?.max,
      min: price?.min,
      step: price?.step,
    },
    currencyCode: currency.code,
    currencySuffix: currency.suffix,
    ...(price?.current == null ? {} : { currentPrice: price.current }),
    routeLabel: `${usefulText(
      loading?.location?.city_name,
      "Погрузка",
    )} → ${usefulText(unloading?.location?.city_name, "Выгрузка")}`,
  };
}
