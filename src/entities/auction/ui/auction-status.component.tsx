import type { AuctionCardViewModel } from "../model/auction-card.vm";

type AuctionStatusProps = {
  status: AuctionCardViewModel["status"];
};

export function AuctionStatus({ status }: AuctionStatusProps) {
  return (
    <span className={`auction-status auction-status--${status.tone}`}>
      <span aria-hidden="true" />
      {status.label}
    </span>
  );
}
