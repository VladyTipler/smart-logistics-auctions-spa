import { ChevronLeft } from "lucide-react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, useLoaderData } from "@tanstack/react-router";

import { auctionBetHistoryQueryOptions } from "@/entities/bet/api/bet.queries";
import { mapBetHistory } from "@/entities/bet/model/map-bet-history";
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
      canViewPlaces: boolean;
      currencyCode?: string;
    }
);

type VisibleBetHistoryProps = {
  auctionUuid: string;
  canViewPlaces: boolean;
  currencyCode?: string;
};

function VisibleBetHistory({
  auctionUuid,
  canViewPlaces,
  currencyCode,
}: VisibleBetHistoryProps) {
  const { data } = useSuspenseQuery(
    auctionBetHistoryQueryOptions(auctionUuid),
  );
  const history = mapBetHistory(data, {
    canViewPlaces,
    ...(currencyCode ? { currencyCode } : {}),
  });

  return (
    <>
      <p className="bet-history-page__participants">
        {history.participantCountLabel}
      </p>
      <BetHistory history={history} />
    </>
  );
}

export function AuctionBetsPage() {
  const data = useLoaderData({ from: "/auctions/$auctionUuid/bets" });

  return (
    <article className="bet-history-page" aria-labelledby="auction-bets-title">
      <header className="bet-history-page__header">
        <Link
          className="auction-detail__back"
          to="/auctions/$auctionUuid"
          params={{ auctionUuid: data.auctionUuid }}
          activeOptions={{ exact: true }}
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
        </div>
      </header>

      {data.visibility === "hidden" ? (
        <BetHistoryHidden />
      ) : (
        <VisibleBetHistory
          auctionUuid={data.auctionUuid}
          canViewPlaces={data.canViewPlaces}
          {...(data.currencyCode
            ? { currencyCode: data.currencyCode }
            : {})}
        />
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
