import type { AuctionListRequest } from "@/shared/api/contracts";

import type { AuctionSearch } from "./auction-search.schema";

function formatOffset(date: Date): string {
  const offsetMinutes = date.getTimezoneOffset();
  const sign = offsetMinutes <= 0 ? "+" : "-";
  const absoluteMinutes = Math.abs(offsetMinutes);
  const hours = Math.floor(absoluteMinutes / 60).toString().padStart(2, "0");
  const minutes = (absoluteMinutes % 60).toString().padStart(2, "0");

  return `${sign}${hours}:${minutes}`;
}

function toOffsetBoundary(
  dateOnly: string,
  boundary: "start" | "end",
): string {
  const [year, month, day] = dateOnly.split("-").map(Number);
  const isStart = boundary === "start";
  const date = new Date(
    year,
    month - 1,
    day,
    isStart ? 0 : 23,
    isStart ? 0 : 59,
    isStart ? 0 : 59,
    isStart ? 0 : 999,
  );
  const time = isStart ? "00:00:00" : "23:59:59.999";

  return `${dateOnly}T${time}${formatOffset(date)}`;
}

export function buildAuctionListRequest(
  search: AuctionSearch,
): AuctionListRequest {
  return {
    page: search.page,
    per_page: search.perPage,
    ...(search.status ? { status: search.status } : {}),
    ...(search.mobileStatuses
      ? { mobile_statuses: search.mobileStatuses }
      : {}),
    ...(search.statuses ? { statuses: search.statuses } : {}),
    ...(search.cargoNum ? { cargo_num: search.cargoNum } : {}),
    ...(search.bodyTypes ? { body_types: search.bodyTypes } : {}),
    ...(search.loadCity ? { load_city: search.loadCity } : {}),
    ...(search.unloadCity ? { unload_city: search.unloadCity } : {}),
    ...(search.loadDateFrom
      ? { load_date_from: toOffsetBoundary(search.loadDateFrom, "start") }
      : {}),
    ...(search.loadDateTo
      ? { load_date_to: toOffsetBoundary(search.loadDateTo, "end") }
      : {}),
    ...(search.unloadDateFrom
      ? {
          unload_date_from: toOffsetBoundary(
            search.unloadDateFrom,
            "start",
          ),
        }
      : {}),
    ...(search.unloadDateTo
      ? { unload_date_to: toOffsetBoundary(search.unloadDateTo, "end") }
      : {}),
    ...(search.createDateFrom
      ? {
          create_date_from: toOffsetBoundary(
            search.createDateFrom,
            "start",
          ),
        }
      : {}),
    ...(search.createDateTo
      ? {
          create_date_to: toOffsetBoundary(search.createDateTo, "end"),
        }
      : {}),
    ...(search.currentPriceFrom
      ? { current_price_from: Number(search.currentPriceFrom) }
      : {}),
    ...(search.currentPriceTo
      ? { current_price_to: Number(search.currentPriceTo) }
      : {}),
    ...(search.aucType ? { auc_type: search.aucType } : {}),
  };
}
