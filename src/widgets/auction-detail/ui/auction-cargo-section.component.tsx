import type { AuctionDetailViewModel } from "@/entities/auction/model/auction-detail.vm";

import { formatMoney } from "@/shared/lib/format-money";

type AuctionCargoSectionProps = {
  cargo: AuctionDetailViewModel["cargo"];
};

export function AuctionCargoSection({ cargo }: AuctionCargoSectionProps) {
  const facts = [
    cargo.bodyType ? ["Кузов", cargo.bodyType] : undefined,
    cargo.truckCount ? ["Машин", String(cargo.truckCount)] : undefined,
    cargo.distanceKm ? ["Дистанция", `${cargo.distanceKm} км`] : undefined,
    cargo.loadingLabels.length
      ? ["Погрузка", cargo.loadingLabels.join(", ")]
      : undefined,
    cargo.documentLabels.length
      ? ["Документы", cargo.documentLabels.join(", ")]
      : undefined,
    cargo.value
      ? [
          "Стоимость груза",
          formatMoney(cargo.value.amount, cargo.value.currencyCode),
        ]
      : undefined,
    cargo.isInternational ? ["Перевозка", "Международная"] : undefined,
    cargo.temperatureLabel
      ? ["Температура", cargo.temperatureLabel]
      : undefined,
    cargo.adrClass !== undefined
      ? ["ADR", `Класс ${cargo.adrClass}`]
      : undefined,
    cargo.equipmentLabels.length
      ? ["Оснащение", cargo.equipmentLabels.join(", ")]
      : undefined,
    cargo.vehicle?.type ? ["Тип ТС", cargo.vehicle.type] : undefined,
    cargo.vehicle?.weightTons !== undefined
      ? ["Грузоподъёмность ТС", `${cargo.vehicle.weightTons} т`]
      : undefined,
    cargo.vehicle?.volumeCubicMeters !== undefined
      ? ["Объём ТС", `${cargo.vehicle.volumeCubicMeters} м³`]
      : undefined,
    cargo.vehicle &&
    [
      cargo.vehicle.lengthMeters,
      cargo.vehicle.widthMeters,
      cargo.vehicle.heightMeters,
    ].some((value) => value !== undefined)
      ? [
          "Габариты ТС",
          [
            cargo.vehicle.lengthMeters ?? "—",
            cargo.vehicle.widthMeters ?? "—",
            cargo.vehicle.heightMeters ?? "—",
          ].join(" × ") + " м",
        ]
      : undefined,
  ].filter((fact): fact is string[] => fact !== undefined);

  return (
    <section className="detail-section" aria-labelledby="cargo-title">
      <div className="detail-section__heading">
        <p>Груз</p>
        <h2 id="cargo-title">Требования к перевозке</h2>
      </div>
      {facts.length ? (
        <dl className="detail-facts">
          {facts.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="detail-empty">Дополнительные требования не указаны.</p>
      )}
    </section>
  );
}
