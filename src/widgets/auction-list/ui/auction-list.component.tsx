import { useQuery } from "@tanstack/react-query";

import { auctionListQueryOptions } from "@/entities/auction/api/auction.queries";
import { mapAuctionCard } from "@/entities/auction/model/map-auction-card";
import { AuctionCard } from "@/entities/auction/ui/auction-card.component";
import { AuctionPagination } from "@/features/auction-pagination/ui/auction-pagination.component";
import type { AuctionListRequest } from "@/shared/api/contracts";

import { AuctionListEmpty } from "./auction-list-empty.component";
import { AuctionListError } from "./auction-list-error.component";
import { AuctionListSkeleton } from "./auction-list-skeleton.component";

type AuctionListProps = {
  onReset: () => void;
  request: AuctionListRequest;
};

export function AuctionList({ onReset, request }: AuctionListProps) {
  const query = useQuery(auctionListQueryOptions(request));

  if (query.isPending) {
    return <AuctionListSkeleton />;
  }

  if (query.isError) {
    return <AuctionListError onRetry={() => void query.refetch()} />;
  }

  const cards = (query.data.data ?? []).map(mapAuctionCard);
  const total = query.data.meta?.total ?? cards.length;

  if (cards.length === 0) {
    return (
      <>
        <p className="auction-list-summary" aria-live="polite">
          Найдено: {total}
        </p>
        <AuctionListEmpty onReset={onReset} />
      </>
    );
  }

  return (
    <>
      <p className="auction-list-summary" aria-live="polite">
        Найдено: {total}
      </p>
      <div className="auction-list">
        {cards.map((auction, index) => (
          <AuctionCard
            auction={auction}
            key={auction.auctionUuid ?? `auction-${index}`}
          />
        ))}
      </div>
      <AuctionPagination
        currentPage={query.data.meta?.current_page ?? request.page ?? 1}
        lastPage={query.data.meta?.last_page ?? 1}
      />
    </>
  );
}
