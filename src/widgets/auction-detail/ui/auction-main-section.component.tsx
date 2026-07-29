import { RouteTimeline } from "@/entities/auction/ui/route-timeline.component";
import type { AuctionDetailViewModel } from "@/entities/auction/model/auction-detail.vm";

type AuctionMainSectionProps = {
  route: AuctionDetailViewModel["route"];
};

export function AuctionMainSection({ route }: AuctionMainSectionProps) {
  return (
    <section className="detail-section" aria-labelledby="route-title">
      <div className="detail-section__heading">
        <p>Маршрут</p>
        <h2 id="route-title">Путь груза</h2>
      </div>
      <RouteTimeline points={route} />
    </section>
  );
}
