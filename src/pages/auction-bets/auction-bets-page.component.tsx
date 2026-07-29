import { ChevronLeft } from "lucide-react";
import { Link, useLoaderData } from "@tanstack/react-router";

import type { BetHistoryViewModel } from "@/entities/bet/model/bet-history.vm";
import { BetHistory } from "@/widgets/bet-history/ui/bet-history.component";
import { BetHistoryHidden } from "@/widgets/bet-history/ui/bet-history-hidden.component";

export type AuctionBetsLoaderData = {
  auctionUuid: string;
  cargoNumber: string;
} & (
  | {
      visibility: "hidden";
    }
  | {
      visibility: "visible";
      history: BetHistoryViewModel;
    }
);

export function AuctionBetsPage() {
  const data = useLoaderData({ from: "/auctions/$auctionUuid/bets" });

  return (
    <article className="bet-history-page" aria-labelledby="auction-bets-title">
      <header className="bet-history-page__header">
        <Link
          className="auction-detail__back"
          to="/auctions/$auctionUuid"
          params={{ auctionUuid: data.auctionUuid }}
        >
          <ChevronLeft size={16} aria-hidden="true" />
          К аукциону
        </Link>
        <div className="bet-history-page__title-row">
          <div>
            <p className="auction-detail__eyebrow">Протокол торгов</p>
            <h1 id="auction-bets-title">
              История ставок {data.cargoNumber}
            </h1>
          </div>
          {data.visibility === "visible" ? (
            <p className="bet-history-page__participants">
              {data.history.participantCountLabel}
            </p>
          ) : null}
        </div>
      </header>

      {data.visibility === "hidden" ? (
        <BetHistoryHidden />
      ) : (
        <BetHistory history={data.history} />
      )}
    </article>
  );
}

export function AuctionBetsPendingPage() {
  return (
    <section className="auction-detail-state" aria-live="polite">
      <p className="auction-detail__eyebrow">Протокол торгов</p>
      <h1>Загружаем историю ставок…</h1>
      <div className="auction-detail-state__line" aria-hidden="true" />
    </section>
  );
}
