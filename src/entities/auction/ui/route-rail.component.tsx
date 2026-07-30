import { MapPin } from "lucide-react";

import type { AuctionCardViewModel } from "../model/auction-card.vm";

type RouteRailProps = {
  route: AuctionCardViewModel["route"];
};

export function RouteRail({ route }: RouteRailProps) {
  return (
    <div className="route-rail" aria-label={`${route.load.city} — ${route.unload.city}`}>
      <div className="route-rail__point">
        <MapPin aria-hidden="true" size={16} strokeWidth={2} />
        <span>
          <strong>{route.load.city}</strong>
          <small>{route.load.dateLabel}</small>
        </span>
      </div>
      <span className="route-rail__line" aria-hidden="true" />
      <div className="route-rail__point route-rail__point--arrival">
        <MapPin aria-hidden="true" size={16} strokeWidth={2} />
        <span>
          <strong>{route.unload.city}</strong>
          <small>{route.unload.dateLabel}</small>
        </span>
      </div>
    </div>
  );
}
