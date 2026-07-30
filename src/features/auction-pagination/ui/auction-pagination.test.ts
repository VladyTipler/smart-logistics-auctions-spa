import { buildPaginationItems } from "../model/build-pagination-items";

describe("buildPaginationItems", () => {
  it("windows a large page range around the current page", () => {
    expect(buildPaginationItems(50, 100)).toEqual([
      1,
      "ellipsis-1-48",
      48,
      49,
      50,
      51,
      52,
      "ellipsis-52-100",
      100,
    ]);
  });

  it("keeps edges without duplicate pages", () => {
    expect(buildPaginationItems(2, 100)).toEqual([
      1,
      2,
      3,
      4,
      "ellipsis-4-100",
      100,
    ]);
  });
});
