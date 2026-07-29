import { Link } from "@tanstack/react-router";

type AuctionPaginationProps = {
  currentPage: number;
  lastPage: number;
};

export function AuctionPagination({
  currentPage,
  lastPage,
}: AuctionPaginationProps) {
  if (lastPage <= 1) {
    return null;
  }

  return (
    <nav className="auction-pagination" aria-label="Страницы аукционов">
      {Array.from({ length: lastPage }, (_, index) => index + 1).map(
        (page) => (
          <Link
            key={page}
            className="auction-pagination__link"
            to="/auctions"
            search={(previous) => ({
              ...previous,
              page,
              perPage: previous.perPage ?? 10,
            })}
            aria-label={`Страница ${page}`}
            aria-current={page === currentPage ? "page" : undefined}
          >
            {String(page).padStart(2, "0")}
          </Link>
        ),
      )}
    </nav>
  );
}
