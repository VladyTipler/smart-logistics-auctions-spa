import { Link } from "@tanstack/react-router";
import { LockKeyhole } from "lucide-react";

type SetBetUnavailableProps = {
  auctionUuid: string;
  cargoNumber: string;
};

export function SetBetUnavailable({
  auctionUuid,
  cargoNumber,
}: SetBetUnavailableProps) {
  return (
    <section
      className="set-bet-unavailable"
      aria-labelledby="set-bet-unavailable-title"
    >
      <LockKeyhole aria-hidden="true" size={24} />
      <p className="auction-detail__eyebrow">Доступ к торгам · {cargoNumber}</p>
      <h1 id="set-bet-unavailable-title">Ставка недоступна</h1>
      <p>
        Условия аукциона не разрешают новую ставку. Можно вернуться к карточке
        и проверить актуальный статус торгов.
      </p>
      <Link
        className="set-bet-unavailable__link"
        to="/auctions/$auctionUuid"
        params={{ auctionUuid }}
      >
        К аукциону
      </Link>
    </section>
  );
}
