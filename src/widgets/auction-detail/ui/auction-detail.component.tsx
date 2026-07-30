import type { AuctionDetailViewModel } from "@/entities/auction/model/auction-detail.vm";

import { AuctionCargoSection } from "./auction-cargo-section.component";
import { AuctionMainSection } from "./auction-main-section.component";
import { AuctionOrganizerSection } from "./auction-organizer-section.component";
import { AuctionPaymentSection } from "./auction-payment-section.component";

type AuctionDetailProps = {
  auction: AuctionDetailViewModel;
};

export function AuctionDetail({ auction }: AuctionDetailProps) {
  return (
    <div className="auction-detail__content">
      <AuctionMainSection route={auction.route} />
      <AuctionCargoSection cargo={auction.cargo} />
      <AuctionPaymentSection payment={auction.payment} />
      <AuctionOrganizerSection organizer={auction.organizer} />
    </div>
  );
}
