import { useParams } from "@tanstack/react-router";

export function AuctionDetailPage() {
  const { auctionUuid } = useParams({ strict: false });

  return (
    <section className="route-page" aria-labelledby="auction-detail-title">
      <p className="route-page__eyebrow">
        Условия перевозки · <span>{auctionUuid}</span>
      </p>
      <h1 id="auction-detail-title">Карточка аукциона</h1>
      <p className="route-page__description">
        Здесь появятся маршрут, груз и актуальные условия торгов.
      </p>
    </section>
  );
}
