import { Dialog } from "@base-ui/react/dialog";
import { SlidersHorizontal, X } from "lucide-react";
import { useEffect } from "react";
import { useStore } from "zustand";

import type { AuctionSearch } from "../model/auction-search.schema";
import { mobileFiltersStore } from "../model/mobile-filters.store";
import { AuctionFilters } from "./auction-filters.component";

type MobileAuctionFiltersProps = {
  onApply: (patch: Partial<AuctionSearch>) => void;
  onReset: () => void;
  search: AuctionSearch;
};

export function MobileAuctionFilters(props: MobileAuctionFiltersProps) {
  const closeDrawer = useStore(
    mobileFiltersStore,
    (state) => state.closeDrawer,
  );
  const isOpen = useStore(mobileFiltersStore, (state) => state.isOpen);
  const reset = useStore(mobileFiltersStore, (state) => state.reset);
  const setOpen = useStore(mobileFiltersStore, (state) => state.setOpen);

  useEffect(() => reset, [reset]);

  return (
    <div className="mobile-filters">
      <Dialog.Root open={isOpen} onOpenChange={setOpen}>
        <Dialog.Trigger className="mobile-filters__trigger">
          <SlidersHorizontal aria-hidden="true" size={17} />
          Фильтры
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Backdrop className="filter-drawer__backdrop" />
          <Dialog.Popup className="filter-drawer">
            <header className="filter-drawer__header">
              <Dialog.Title>Фильтры аукционов</Dialog.Title>
              <Dialog.Close className="filter-drawer__close" aria-label="Закрыть">
                <X aria-hidden="true" size={20} />
              </Dialog.Close>
            </header>
            <AuctionFilters
              {...props}
              compact
              onApply={(patch) => {
                closeDrawer();
                props.onApply(patch);
              }}
              onReset={() => {
                closeDrawer();
                props.onReset();
              }}
            />
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
