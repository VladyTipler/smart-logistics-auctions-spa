import { getRouteApi, useNavigate } from "@tanstack/react-router";

import { AuctionFilters } from "@/features/auction-filters/ui/auction-filters.component";
import { MobileAuctionFilters } from "@/features/auction-filters/ui/mobile-auction-filters.component";
import { buildAuctionListRequest } from "@/features/auction-filters/model/build-auction-list-request";
import type { AuctionSearch } from "@/features/auction-filters/model/auction-search.schema";
import { AuctionList } from "@/widgets/auction-list/ui/auction-list.component";

const routeApi = getRouteApi("/auctions");

export function AuctionListPage() {
  const search = routeApi.useSearch();
  const filterStateKey = JSON.stringify(search);
  const navigate = useNavigate({ from: "/auctions" });
  const updateFilters = (patch: Partial<AuctionSearch>) => {
    void navigate({
      replace: true,
      search: (previous) => ({ ...previous, ...patch, page: 1 }),
    });
  };
  const resetFilters = () => {
    void navigate({
      replace: true,
      search: (previous) => ({ page: 1, perPage: previous.perPage }),
    });
  };

  return (
    <section className="auction-workspace" aria-labelledby="auction-list-title">
      <header className="auction-workspace__header">
        <div>
          <p className="route-page__eyebrow">Диспетчерская / активные рейсы</p>
          <h1 id="auction-list-title">Аукционы грузов</h1>
        </div>
        <p className="auction-workspace__hint">
          Сравните маршрут, условия и текущую цену до открытия торгов.
        </p>
      </header>
      <div className="desktop-filters">
        <AuctionFilters
          key={filterStateKey}
          search={search}
          onApply={updateFilters}
          onReset={resetFilters}
        />
      </div>
      <MobileAuctionFilters
        key={filterStateKey}
        search={search}
        onApply={updateFilters}
        onReset={resetFilters}
      />
      <AuctionList
        request={buildAuctionListRequest(search)}
        onReset={resetFilters}
      />
    </section>
  );
}
