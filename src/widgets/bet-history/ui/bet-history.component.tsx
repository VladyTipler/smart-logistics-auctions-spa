import type { BetHistoryViewModel } from "@/entities/bet/model/bet-history.vm";
import { BetCard } from "@/entities/bet/ui/bet-card.component";
import { BetTable } from "@/entities/bet/ui/bet-table.component";

import { BetHistoryEmpty } from "./bet-history-empty.component";

type BetHistoryProps = {
  history: BetHistoryViewModel;
};

export function BetHistory({ history }: BetHistoryProps) {
  if (history.items.length === 0) {
    return <BetHistoryEmpty />;
  }

  return (
    <>
      <BetTable history={history} />
      <div className="bet-history__mobile" aria-label="Карточки ставок">
        <ul className="bet-card-list">
          {history.items.map((bet) => (
            <BetCard
              key={bet.id}
              bet={bet}
              canViewPlaces={history.canViewPlaces}
              currencyCode={history.currencyCode}
            />
          ))}
        </ul>
      </div>
    </>
  );
}
