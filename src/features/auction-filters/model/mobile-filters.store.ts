import { createStore } from "zustand/vanilla";

export interface MobileFiltersState {
  closeDrawer: () => void;
  isOpen: boolean;
  openDrawer: () => void;
  reset: () => void;
  setOpen: (isOpen: boolean) => void;
}

export function createMobileFiltersStore() {
  return createStore<MobileFiltersState>((set) => ({
    isOpen: false,
    closeDrawer: () => set({ isOpen: false }),
    openDrawer: () => set({ isOpen: true }),
    reset: () => set({ isOpen: false }),
    setOpen: (isOpen) => set({ isOpen }),
  }));
}

export const mobileFiltersStore = createMobileFiltersStore();
