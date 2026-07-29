export type PaginationItem = number | `ellipsis-${number}-${number}`;

export function buildPaginationItems(
  currentPage: number,
  lastPage: number,
): PaginationItem[] {
  const safeLastPage = Math.max(1, Math.trunc(lastPage));
  const safeCurrentPage = Math.min(
    safeLastPage,
    Math.max(1, Math.trunc(currentPage)),
  );
  const pages = new Set<number>([1, safeLastPage]);

  for (
    let page = Math.max(1, safeCurrentPage - 2);
    page <= Math.min(safeLastPage, safeCurrentPage + 2);
    page += 1
  ) {
    pages.add(page);
  }

  const sortedPages = [...pages].sort((left, right) => left - right);

  return sortedPages.flatMap((page, index) => {
    const previousPage = sortedPages[index - 1];

    return previousPage !== undefined && page - previousPage > 1
      ? [`ellipsis-${previousPage}-${page}` as const, page]
      : [page];
  });
}
