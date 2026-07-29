import { Link, useLoaderData } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";

import type { SetBetViewModel } from "@/features/set-bet/model/set-bet.vm";
import { SetBetForm } from "@/features/set-bet/ui/set-bet-form.component";
import { SetBetUnavailable } from "@/features/set-bet/ui/set-bet-unavailable.component";
import { formatMoney } from "@/shared/lib/format-money";

export type AuctionBetLoaderData =
  | {
      availability: "available";
      auction: SetBetViewModel;
    }
  | {
      availability: "unavailable";
      auctionUuid: string;
      cargoNumber: string;
    };

export function AuctionBetPage() {
  const data = useLoaderData({ from: "/auctions/$auctionUuid/bet" });

  if (data.availability === "unavailable") {
    return (
      <SetBetUnavailable
        auctionUuid={data.auctionUuid}
        cargoNumber={data.cargoNumber}
      />
    );
  }

  const { auction } = data;

  return (
    <article className="set-bet-page" aria-labelledby="auction-bet-title">
      <header className="set-bet-page__header">
        <Link
          className="auction-detail__back"
          to="/auctions/$auctionUuid"
          params={{ auctionUuid: auction.auctionUuid }}
          activeOptions={{ exact: true }}
        >
          <ChevronLeft size={16} aria-hidden="true" />
          К аукциону
        </Link>
        <p className="auction-detail__eyebrow">Участие в торгах</p>
        <h1 id="auction-bet-title">Ставка на {auction.cargoNumber}</h1>
        <p className="set-bet-page__route">{auction.routeLabel}</p>
      </header>
      <div className="set-bet-page__layout">
        <section
          className="set-bet-page__conditions"
          aria-labelledby="set-bet-conditions-title"
        >
          <p className="set-bet-page__section-code">Условия / 01</p>
          <h2 id="set-bet-conditions-title">Проверьте цену перед отправкой</h2>
          <dl>
            <div>
              <dt>Текущая цена</dt>
              <dd>
                {auction.currentPrice == null
                  ? "Не указана"
                  : formatMoney(auction.currentPrice, auction.currencyCode)}
              </dd>
            </div>
            <div>
              <dt>Доступная ставка</dt>
              <dd>
                {auction.constraints.available == null
                  ? "По условиям торгов"
                  : formatMoney(
                      auction.constraints.available,
                      auction.currencyCode,
                    )}
              </dd>
            </div>
            <div>
              <dt>Направление</dt>
              <dd>
                {auction.constraints.direction === "Down"
                  ? "На понижение"
                  : auction.constraints.direction === "Up"
                    ? "На повышение"
                    : "По условиям аукциона"}
              </dd>
            </div>
          </dl>
          <p className="set-bet-page__notice">
            После подтверждения цена обновится в карточке, деталях и протоколе
            торгов.
          </p>
        </section>
        <SetBetForm auction={auction} />
      </div>
    </article>
  );
}

export function AuctionBetPendingPage() {
  return (
    <section className="auction-detail-state" aria-live="polite">
      <p className="auction-detail__eyebrow">Канал ставки</p>
      <h1>Загружаем условия торгов…</h1>
      <div className="auction-detail-state__line" aria-hidden="true" />
    </section>
  );
}
