import { ArrowRight, Clock3 } from "lucide-react";
import { Link } from "@tanstack/react-router";

import type { AuctionDetailViewModel } from "@/entities/auction/model/auction-detail.vm";
import { formatMoney } from "@/shared/lib/format-money";


type AuctionTradingPanelProps = {
  access: AuctionDetailViewModel["access"];
  auctionUuid: string;
  trading: AuctionDetailViewModel["trading"];
};

export function AuctionTradingPanel({
  access,
  auctionUuid,
  trading,
}: AuctionTradingPanelProps) {
  return (
    <aside className="trading-panel" aria-labelledby="trading-title">
      <div className="trading-panel__status">
        <span
          className={`trading-panel__signal trading-panel__signal--${trading.statusTone}`}
          aria-hidden="true"
        />
        <span>{trading.statusLabel}</span>
      </div>
      <p className="trading-panel__label">Текущая ставка</p>
      <h2 id="trading-title">
        {trading.currentPrice === undefined
          ? "Цена не указана"
          : formatMoney(
              trading.currentPrice,
              trading.currencyCode,
            )}
      </h2>
      {trading.availablePrice !== undefined ? (
        <p className="trading-panel__available">
          Доступная цена{" "}
          <strong>
            {formatMoney(
              trading.availablePrice,
              trading.currencyCode,
            )}
          </strong>
        </p>
      ) : null}
      {trading.stopTimeLabel ? (
        <p className="trading-panel__time">
          <Clock3 size={16} aria-hidden="true" />
          До {trading.stopTimeLabel}
        </p>
      ) : null}
      {access.canSetBet && auctionUuid ? (
        <div className="trading-panel__bid-dock">
          <span className="trading-panel__dock-price" aria-hidden="true">
            {trading.currentPrice === undefined
              ? "Цена не указана"
              : formatMoney(trading.currentPrice, trading.currencyCode)}
          </span>
          <Link
            className="trading-panel__action"
            to="/auctions/$auctionUuid/bet"
            params={{ auctionUuid }}
            aria-label="Сделать ставку"
          >
            <span className="trading-panel__action-full">Сделать ставку</span>
            <span className="trading-panel__action-short" aria-hidden="true">
              Ставка
            </span>
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>
      ) : (
        <p className="trading-panel__unavailable">
          Ставка сейчас недоступна
        </p>
      )}
      {trading.ownLastBet !== undefined ? (
        <p className="trading-panel__own-bid">
          Ваша ставка{" "}
          <strong>
            {formatMoney(trading.ownLastBet, trading.currencyCode)}
          </strong>
        </p>
      ) : null}
      {trading.step !== undefined ? (
        <p className="trading-panel__step">
          Шаг торгов: {formatMoney(trading.step, trading.currencyCode)}
        </p>
      ) : null}
      {trading.minPrice !== undefined || trading.maxPrice !== undefined ? (
        <p className="trading-panel__bounds">
          Диапазон:{" "}
          {trading.minPrice === undefined
            ? "без минимума"
            : formatMoney(trading.minPrice, trading.currencyCode)}
          {" — "}
          {trading.maxPrice === undefined
            ? "без максимума"
            : formatMoney(trading.maxPrice, trading.currencyCode)}
        </p>
      ) : null}
    </aside>
  );
}
