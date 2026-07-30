import type { BetHistoryItemViewModel } from "@/entities/bet/model/bet-history.vm";
import { formatMoney } from "@/shared/lib/format-money";

type BetCardProps = {
  bet: BetHistoryItemViewModel;
  canViewPlaces: boolean;
  currencyCode?: string;
};

export function BetCard({
  bet,
  canViewPlaces,
  currencyCode,
}: BetCardProps) {
  return (
    <li className="bet-card">
      <div className="bet-card__heading">
        <div>
          <strong>{bet.participantLabel}</strong>
          {bet.contactName ? <small>{bet.contactName}</small> : null}
        </div>
        <span className={`bet-status bet-status--${bet.status.tone}`}>
          {bet.status.label}
        </span>
      </div>

      <div className="bet-card__price">
        <span>Ставка с НДС</span>
        <strong>
          {bet.priceWithVat === undefined
            ? "—"
            : formatMoney(bet.priceWithVat, currencyCode)}
        </strong>
      </div>

      <div className="bet-card__meta">
        {bet.createdAt ? (
          <time dateTime={bet.createdAt}>{bet.createdAtLabel ?? "—"}</time>
        ) : (
          <span>Время не указано</span>
        )}
        {canViewPlaces && bet.place !== undefined ? (
          <span>Место {bet.place}</span>
        ) : null}
        {bet.priceWithoutVat !== undefined ? (
          <span>
            Без НДС: {formatMoney(bet.priceWithoutVat, currencyCode)}
          </span>
        ) : null}
      </div>
      {bet.cancelReason ? (
        <p className="bet-card__reason">{bet.cancelReason}</p>
      ) : null}
    </li>
  );
}
