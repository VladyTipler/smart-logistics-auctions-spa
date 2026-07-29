import { ChevronLeft } from "lucide-react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, useParams } from "@tanstack/react-router";

import { auctionDetailQueryOptions } from "@/entities/auction/api/auction.queries";
import { mapAuctionDetail } from "@/entities/auction/model/map-auction-detail";
import { AuctionDetail } from "@/widgets/auction-detail/ui/auction-detail.component";
import { AuctionTradingPanel } from "@/widgets/auction-trading-panel/ui/auction-trading-panel.component";

export function AuctionDetailPage() {
  const { auctionUuid } = useParams({ from: "/auctions/$auctionUuid" });
  const { data } = useSuspenseQuery(auctionDetailQueryOptions(auctionUuid));
  const auction = mapAuctionDetail(data);

  return (
    <article
      className={`auction-detail${
        auction.access.canSetBet
          ? " auction-detail--with-mobile-action"
          : ""
      }`}
      aria-labelledby="auction-detail-title"
    >
      <header className="auction-detail__header">
        <Link className="auction-detail__back" to="/auctions">
          <ChevronLeft size={16} aria-hidden="true" />
          Все аукционы
        </Link>
        <div className="auction-detail__title-row">
          <div>
            <p className="auction-detail__eyebrow">
              {auction.identity.auctionType} ·{" "}
              <span>{auction.identity.createdAtLabel ?? "дата не указана"}</span>
            </p>
            <h1 id="auction-detail-title">
              Аукцион {auction.identity.cargoNumber}
            </h1>
          </div>
          <code>{auctionUuid}</code>
        </div>
      </header>

      <div className="auction-detail__layout">
        <AuctionDetail auction={auction} />
        <AuctionTradingPanel
          access={auction.access}
          auctionUuid={auctionUuid}
          trading={auction.trading}
        />
      </div>
    </article>
  );
}

export function AuctionDetailPendingPage() {
  return (
    <section className="auction-detail-state" aria-live="polite">
      <p className="auction-detail__eyebrow">Маршрутный лист</p>
      <h1>Загружаем условия перевозки…</h1>
      <div className="auction-detail-state__line" aria-hidden="true" />
    </section>
  );
}

export function AuctionDetailNotFoundPage() {
  return (
    <section
      className="auction-detail-state auction-detail-state--missing"
      aria-labelledby="auction-missing-title"
    >
      <p className="auction-detail__eyebrow">Аукцион · 404</p>
      <h1 id="auction-missing-title">Аукцион не найден</h1>
      <p>Он завершён, удалён или ссылка содержит неверный идентификатор.</p>
      <Link className="auction-detail-state__link" to="/auctions">
        Вернуться к аукционам
      </Link>
    </section>
  );
}
