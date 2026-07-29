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
  currentPrice?: number;
  routeLabel: string;
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
    currencyCode: usefulText(detail.payment.currency_code, "643"),
    ...(price?.current == null ? {} : { currentPrice: price.current }),
    routeLabel: `${usefulText(
      loading?.location?.city_name,
      "Погрузка",
    )} → ${usefulText(unloading?.location?.city_name, "Выгрузка")}`,
  };
}
