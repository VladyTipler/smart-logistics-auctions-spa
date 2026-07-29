import type { AuctionDetail } from "@/shared/api/contracts";

import { resolveAuctionAccess } from "./auction-access";
import type {
  AuctionDetailViewModel,
  AuctionRoutePointViewModel,
} from "./auction-detail.vm";

const auctionTypeLabels = {
  Down: "На понижение",
  FixPrice: "Фиксированная цена",
  Request: "Запрос предложений",
  Up: "На повышение",
  Unknown: "Тип не указан",
} as const;

const statusLabels = {
  Auction: "Торги идут",
  Canceled: "Отменён",
  DeterminateWinner: "Определяется победитель",
  Finished: "Завершён",
  InProgress: "В работе",
  Planning: "Запланирован",
  Stopped: "Остановлен",
  Unknown: "Статус не указан",
  WaitDeal: "Ожидает сделки",
} as const;

const operationLabels = {
  Loading: "Погрузка",
  Unloading: "Выгрузка",
} as const;

function usefulText(value: string | null | undefined) {
  const text = value?.trim();
  return text ? text : undefined;
}

function finiteNumber(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

function formatDateTime(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function validDateTime(value: string | undefined) {
  if (!value || Number.isNaN(new Date(value).getTime())) {
    return undefined;
  }

  return value;
}

function formatDecimal(value: string | number | null | undefined) {
  const number = typeof value === "string" ? Number(value) : value;
  if (typeof number !== "number" || !Number.isFinite(number)) {
    return undefined;
  }

  return new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: 3,
  })
    .format(number)
    .replace(/\s/g, " ");
}

function formatTemperature(
  from: number | null | undefined,
  to: number | null | undefined,
) {
  const start = finiteNumber(from);
  const end = finiteNumber(to);
  if (start === undefined && end === undefined) {
    return undefined;
  }

  const label = (value: number | undefined) =>
    value === undefined
      ? "—"
      : formatDecimal(value)?.replace("-", "−") ?? "—";

  return `${label(start)}…${label(end)} °C`;
}

function formatRouteDimensions(
  length: string | undefined,
  width: string | undefined,
  height: string | undefined,
) {
  const dimensions = [
    formatDecimal(length),
    formatDecimal(width),
    formatDecimal(height),
  ];

  return dimensions.some((value) => value !== undefined)
    ? `${dimensions.map((value) => value ?? "—").join(" × ")} м`
    : undefined;
}

function mapFlags(
  flags: Record<string, boolean | null | undefined> | undefined,
  labels: Record<string, string>,
) {
  if (!flags) {
    return [];
  }

  return Object.entries(flags)
    .filter(([, enabled]) => enabled === true)
    .map(([key]) => labels[key])
    .filter((label): label is string => label !== undefined);
}

function mapRoute(
  detail: AuctionDetail,
  canViewPointDetails: boolean,
): AuctionRoutePointViewModel[] {
  return detail.routes.map((point, index) => {
    const sequence = point.row_num ?? index + 1;
    const city =
      usefulText(point.location?.city_name) ??
      usefulText(point.location?.city_full_name) ??
      "Город не указан";
    const operationLabel =
      point.op_type === "Loading" || point.op_type === "Unloading"
        ? operationLabels[point.op_type]
        : "Пункт маршрута";

    return {
      id: `${sequence}-${point.op_type ?? "point"}-${index}`,
      sequence,
      operationLabel,
      city,
      dateLabel: formatDateTime(point.start_date),
      dateTime: validDateTime(point.start_date),
      ...(canViewPointDetails
        ? {
            address: usefulText(point.location?.loading_address),
            contact:
              usefulText(point.contact?.name) || usefulText(point.contact?.phone)
                ? {
                    name: usefulText(point.contact?.name),
                    phone: usefulText(point.contact?.phone),
                  }
                : undefined,
          }
        : {}),
      cargo: {
        name: usefulText(point.cargo?.name),
        packageName: usefulText(point.cargo?.package_name),
        packageAmount: finiteNumber(point.cargo?.package_amount),
        weight: usefulText(point.cargo?.weight),
        volume: usefulText(point.cargo?.volume),
        dimensionsLabel: formatRouteDimensions(
          point.cargo?.length,
          point.cargo?.width,
          point.cargo?.height,
        ),
        oversized:
          point.cargo?.oversized === true ? true : undefined,
      },
    };
  });
}

function currencyCode(detail: AuctionDetail) {
  return (
    usefulText(detail.payment.currency_code) ??
    (detail.cargo.currency === null || detail.cargo.currency === undefined
      ? undefined
      : String(detail.cargo.currency))
  );
}

function paymentDelayLabel(detail: AuctionDetail) {
  const delay = finiteNumber(detail.payment.delay);
  if (delay === undefined) {
    return undefined;
  }

  const unit =
    detail.payment.delay_type === "WorkDays"
      ? "рабочих дней"
      : detail.payment.delay_type === "CalendarDays"
        ? "календарных дней"
        : "дней";

  return `${delay} ${unit}`;
}

export function mapAuctionDetail(
  detail: AuctionDetail,
): AuctionDetailViewModel {
  const access = resolveAuctionAccess(detail);
  const cargoValue = Number(detail.cargo.price);
  const status = detail.trading.status;
  const knownStatus = status && status in statusLabels ? status : undefined;
  const code = currencyCode(detail);
  const car = detail.cargo.car;
  const vehicle = car
    ? {
        type: usefulText(car.type),
        weightTons: finiteNumber(car.weight),
        volumeCubicMeters: finiteNumber(car.volume),
        widthMeters: finiteNumber(car.width),
        lengthMeters: finiteNumber(car.length),
        heightMeters: finiteNumber(car.height),
      }
    : undefined;
  const hasVehicleRequirement =
    vehicle !== undefined &&
    Object.values(vehicle).some((value) => value !== undefined);
  const equipmentLabels = [
    finiteNumber(detail.cargo.conics) === undefined
      ? undefined
      : `Коники: ${detail.cargo.conics}`,
    finiteNumber(detail.cargo.belts) === undefined
      ? undefined
      : `Ремни: ${detail.cargo.belts}`,
    detail.cargo.coupling === true ? "Сцепка" : undefined,
    detail.cargo.air_pass === true ? "Пневмоход" : undefined,
    detail.cargo.low_loader === true
      ? "Низкорамная платформа"
      : undefined,
    detail.cargo.additional_load === true ? "Догруз" : undefined,
    detail.cargo.containered === true
      ? `Контейнер: ${[
          usefulText(detail.cargo.container_type),
          usefulText(detail.cargo.container_size),
        ]
          .filter((value): value is string => value !== undefined)
          .join(" · ") || "тип не указан"}`
      : undefined,
  ].filter((label): label is string => label !== undefined);

  return {
    access,
    identity: {
      auctionUuid: usefulText(detail.main.order_uid) ?? "",
      cargoNumber: usefulText(detail.main.cargo_num) ?? "Без номера",
      auctionType:
        detail.main.auc_type && detail.main.auc_type in auctionTypeLabels
          ? auctionTypeLabels[detail.main.auc_type]
          : "Тип не указан",
      createdAtLabel: formatDateTime(detail.main.created_at),
    },
    organizer: {
      name: usefulText(detail.organizer.organization_name) ?? "Не указан",
      taxId: usefulText(detail.organizer.organization_inn),
      contacts: access.canViewPointDetails
        ? detail.contacts
            .map((contact) => ({
              name: usefulText(contact.name),
              phone: usefulText(contact.phone),
            }))
            .filter((contact) => contact.name || contact.phone)
        : [],
    },
    route: mapRoute(detail, access.canViewPointDetails),
    cargo: {
      bodyType: usefulText(detail.cargo.body_type),
      truckCount: finiteNumber(detail.cargo.truck_count),
      distanceKm: finiteNumber(detail.cargo.distance),
      isInternational: detail.cargo.is_international === true,
      temperatureLabel: formatTemperature(
        detail.cargo.temp_from,
        detail.cargo.temp_to,
      ),
      adrClass: finiteNumber(detail.cargo.adr),
      loadingLabels: mapFlags(detail.cargo.loading_types, {
        side: "Боковая",
        top: "Верхняя",
        rear: "Задняя",
        full: "Полная растентовка",
      }),
      documentLabels: mapFlags(detail.cargo.docs, {
        tir: "TIR",
        cmr: "CMR",
        t1: "T1",
        med: "Медицинские документы",
      }),
      equipmentLabels,
      vehicle: hasVehicleRequirement ? vehicle : undefined,
      value:
        access.canViewCargoValue && Number.isFinite(cargoValue)
          ? { amount: cargoValue, currencyCode: code }
          : undefined,
    },
    payment: {
      form: usefulText(detail.payment.form) ?? "Не указана",
      delayLabel: paymentDelayLabel(detail),
      condition: usefulText(detail.payment.condition),
      currencyCode: code,
    },
    trading: {
      statusLabel: knownStatus
        ? statusLabels[knownStatus]
        : "Статус не указан",
      statusTone:
        status === "Auction"
          ? "active"
          : status === "Finished" || status === "InProgress"
            ? "positive"
            : status === "Stopped" || status === "Canceled"
              ? "warning"
              : "neutral",
      stopTimeLabel: formatDateTime(detail.trading.stop_time),
      currentPrice: finiteNumber(detail.trading.price?.current),
      availablePrice: finiteNumber(detail.trading.price?.available),
      minPrice: finiteNumber(detail.trading.price?.min),
      maxPrice: finiteNumber(detail.trading.price?.max),
      ownLastBet: finiteNumber(detail.trading.your?.last_bet_with_vat),
      step: finiteNumber(detail.trading.price?.step),
      currencyCode: code,
    },
  };
}
