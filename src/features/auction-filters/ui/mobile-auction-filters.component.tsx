import { Dialog } from "@base-ui/react/dialog";
import { SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";

import type { AuctionSearch } from "../model/auction-search.schema";
import { AuctionFilters } from "./auction-filters.component";

type MobileAuctionFiltersProps = {
  onApply: (patch: Partial<AuctionSearch>) => void;
  onReset: () => void;
  search: AuctionSearch;
};

export function MobileAuctionFilters(props: MobileAuctionFiltersProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mobile-filters">
      <Dialog.Root open={open} onOpenChange={setOpen}>
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
                props.onApply(patch);
                setOpen(false);
              }}
            />
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
