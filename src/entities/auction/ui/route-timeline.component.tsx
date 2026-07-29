import { MapPin, PackageCheck } from "lucide-react";

import type { AuctionRoutePointViewModel } from "../model/auction-detail.vm";

type RouteTimelineProps = {
  points: readonly AuctionRoutePointViewModel[];
};

export function RouteTimeline({ points }: RouteTimelineProps) {
  if (points.length === 0) {
    return <p className="detail-empty">Маршрут пока не указан.</p>;
  }

  return (
    <ol className="route-timeline" aria-label="Маршрут перевозки">
      {points.map((point, index) => (
        <li className="route-timeline__point" key={point.id}>
          <div className="route-timeline__marker" aria-hidden="true">
            {index === points.length - 1 ? (
              <PackageCheck size={17} strokeWidth={1.8} />
            ) : (
              <MapPin size={17} strokeWidth={1.8} />
            )}
          </div>
          <div className="route-timeline__body">
            <div className="route-timeline__heading">
              <span>{point.operationLabel}</span>
              {point.dateLabel ? <time>{point.dateLabel}</time> : null}
            </div>
            <strong>{point.city}</strong>
            {point.address ? <p>{point.address}</p> : null}
            {point.cargo.name ? (
              <p className="route-timeline__cargo">
                {point.cargo.name}
                {point.cargo.weight ? ` · ${point.cargo.weight} т` : ""}
                {point.cargo.volume ? ` · ${point.cargo.volume} м³` : ""}
              </p>
            ) : null}
            {point.contact ? (
              <address>
                {point.contact.name}
                {point.contact.name && point.contact.phone ? " · " : ""}
                {point.contact.phone}
              </address>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
