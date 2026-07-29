export function AuctionListSkeleton() {
  return (
    <div
      className="auction-list auction-list--skeleton"
      data-testid="auction-list-skeleton"
      aria-label="Загрузка аукционов"
    >
      {[0, 1, 2].map((item) => (
        <div className="auction-skeleton" key={item} aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      ))}
    </div>
  );
}
