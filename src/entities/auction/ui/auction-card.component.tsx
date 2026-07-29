import { useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";

import { auctionDetailQueryOptions } from "../api/auction.queries";
import type { AuctionCardViewModel } from "../model/auction-card.vm";
import { AuctionStatus } from "./auction-status.component";
import { RouteRail } from "./route-rail.component";

type AuctionCardProps = {
  auction: AuctionCardViewModel;
};

export function AuctionCard({ auction }: AuctionCardProps) {
  const queryClient = useQueryClient();
  const detailPath = auction.action.kind === "bid"
    ? "/auctions/$auctionUuid/bet"
    : "/auctions/$auctionUuid";
  const prefetch = () => {
    if (auction.auctionUuid) {
      void queryClient.prefetchQuery(
        auctionDetailQueryOptions(auction.auctionUuid),
      );
    }
  };

  return (
    <article className="auction-card">
      <div className="auction-card__identity">
        <span className="auction-card__type">{auction.auctionType}</span>
        <strong className="auction-card__number">{auction.cargoNumber}</strong>
        <AuctionStatus status={auction.status} />
      </div>
      <RouteRail route={auction.route} />
      <p className="auction-card__cargo">{auction.cargoSummary}</p>
      <div className="auction-card__trading">
        <span className="auction-card__price-label">Текущая цена</span>
        <strong className="auction-card__price">
          {auction.currentPrice?.label ?? "Не указана"}
        </strong>
        {auction.ownBidLabel ? (
          <small className="auction-card__own-bid">{auction.ownBidLabel}</small>
        ) : null}
      </div>
      {auction.auctionUuid ? (
        <Link
          className={`auction-card__action auction-card__action--${auction.action.kind}`}
          to={detailPath}
          params={{ auctionUuid: auction.auctionUuid }}
          onMouseEnter={prefetch}
          onFocus={prefetch}
          aria-label={`${auction.action.label}: ${auction.cargoNumber}, ${auction.route.load.city} — ${auction.route.unload.city}`}
        >
          {auction.action.label}
          <ArrowUpRight aria-hidden="true" size={17} />
        </Link>
      ) : (
        <span className="auction-card__action auction-card__action--disabled">
          Недоступно
        </span>
      )}
    </article>
  );
}
