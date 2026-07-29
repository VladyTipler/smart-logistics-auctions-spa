import { Link } from "@tanstack/react-router";

import { buildPaginationItems } from "../model/build-pagination-items";

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
      {buildPaginationItems(currentPage, lastPage).map((item) =>
        typeof item === "number" ? (
          <Link
            key={item}
            className="auction-pagination__link"
            to="/auctions"
            search={(previous) => ({
              ...previous,
              page: item,
              perPage: previous.perPage ?? 10,
            })}
            aria-label={`Страница ${item}`}
            aria-current={item === currentPage ? "page" : undefined}
          >
            {String(item).padStart(2, "0")}
          </Link>
        ) : (
          <span
            aria-hidden="true"
            className="auction-pagination__ellipsis"
            key={item}
          >
            …
          </span>
        ),
      )}
    </nav>
  );
}
