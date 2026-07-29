import type { BetHistoryViewModel } from "@/entities/bet/model/bet-history.vm";
import { formatMoney } from "@/shared/lib/format-money";

type BetTableProps = {
  history: BetHistoryViewModel;
};

export function BetTable({ history }: BetTableProps) {
  return (
    <div className="bet-history__desktop" aria-label="Таблица ставок">
      <table className="bet-table">
        <thead>
          <tr>
            <th scope="col">Время</th>
            <th scope="col">Участник</th>
            <th scope="col">Ставка с НДС</th>
            <th scope="col">Без НДС</th>
            {history.canViewPlaces ? <th scope="col">Место</th> : null}
            <th scope="col">Статус</th>
          </tr>
        </thead>
        <tbody>
          {history.items.map((bet) => (
            <tr key={bet.id}>
              <td>
                {bet.createdAt ? (
                  <time dateTime={bet.createdAt}>
                    {bet.createdAtLabel ?? "—"}
                  </time>
                ) : (
                  "—"
                )}
              </td>
              <td>
                <strong>{bet.participantLabel}</strong>
                {bet.contactName ? <small>{bet.contactName}</small> : null}
              </td>
              <td className="bet-table__price">
                {bet.priceWithVat === undefined
                  ? "—"
                  : formatMoney(bet.priceWithVat, history.currencyCode)}
              </td>
              <td className="bet-table__price bet-table__price--secondary">
                {bet.priceWithoutVat === undefined
                  ? "—"
                  : formatMoney(bet.priceWithoutVat, history.currencyCode)}
              </td>
              {history.canViewPlaces ? (
                <td className="bet-table__place">{bet.place ?? "—"}</td>
              ) : null}
              <td>
                <span
                  className={`bet-status bet-status--${bet.status.tone}`}
                >
                  {bet.status.label}
                </span>
                {bet.cancelReason ? (
                  <small>{bet.cancelReason}</small>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
