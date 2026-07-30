import { createMobileFiltersStore } from "./mobile-filters.store";

describe("mobile filters store", () => {
  it("opens, closes and resets drawer visibility", () => {
    const store = createMobileFiltersStore();

    store.getState().openDrawer();
    expect(store.getState().isOpen).toBe(true);

    store.getState().closeDrawer();
    expect(store.getState().isOpen).toBe(false);

    store.getState().openDrawer();
    store.getState().reset();
    expect(store.getState().isOpen).toBe(false);
  });

  it("keeps factory-created instances isolated", () => {
    const first = createMobileFiltersStore();
    const second = createMobileFiltersStore();

    first.getState().openDrawer();

    expect(first.getState().isOpen).toBe(true);
    expect(second.getState().isOpen).toBe(false);
  });
});
