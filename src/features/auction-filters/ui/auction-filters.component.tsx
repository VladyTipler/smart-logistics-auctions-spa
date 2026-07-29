import { Select } from "@base-ui/react/select";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { type FormEvent, useId, useState } from "react";

import {
  findCityOption,
  type CityOption,
} from "../model/city-options";
import type { AuctionSearch } from "../model/auction-search.schema";
import { CityCombobox } from "./city-combobox.component";

type AuctionFiltersProps = {
  compact?: boolean;
  onApply: (patch: Partial<AuctionSearch>) => void;
  onReset: () => void;
  search: AuctionSearch;
};

const participationStatuses = [
  { label: "Все статусы", value: "all" },
  { label: "Не участвую", value: "NotParticipating" },
  { label: "Лидирую", value: "Leading" },
  { label: "Ставка перебита", value: "Losing" },
  { label: "Победитель", value: "Winner" },
] as const;

export function AuctionFilters({
  compact = false,
  onApply,
  onReset,
  search,
}: AuctionFiltersProps) {
  const [cargoNumber, setCargoNumber] = useState(search.cargoNum ?? "");
  const [status, setStatus] = useState<string>(
    search.status?.[0] ?? "all",
  );
  const [loadCity, setLoadCity] = useState<CityOption | null>(
    findCityOption(search.loadCity),
  );
  const [unloadCity, setUnloadCity] = useState<CityOption | null>(
    findCityOption(search.unloadCity),
  );
  const statusLabelId = `auction-status-label-${useId().replaceAll(":", "")}`;

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onApply({
      cargoNum: cargoNumber.trim() || undefined,
      loadCity: loadCity?.name,
      unloadCity: unloadCity?.name,
      status:
        status === "all"
          ? undefined
          : ([status] as AuctionSearch["status"]),
    });
  };

  return (
    <form
      className={`auction-filters${compact ? " auction-filters--compact" : ""}`}
      onSubmit={submit}
      aria-label="Фильтры аукционов"
    >
      <label className="filter-field filter-field--search">
        <span>Номер груза</span>
        <span className="filter-field__control">
          <Search aria-hidden="true" size={16} />
          <input
            name="cargoNum"
            value={cargoNumber}
            onChange={(event) => setCargoNumber(event.target.value)}
            placeholder="Например, SL-1001"
          />
        </span>
      </label>

      <div className="filter-field">
        <span id={statusLabelId}>Мой статус</span>
        <Select.Root
          value={status}
          onValueChange={(value) => setStatus(value ?? "all")}
        >
          <Select.Trigger
            className="select-trigger"
            aria-labelledby={statusLabelId}
          >
            <Select.Value>
              {participationStatuses.find((item) => item.value === status)
                ?.label ?? "Все статусы"}
            </Select.Value>
            <Select.Icon>
              <ChevronDown aria-hidden="true" size={16} />
            </Select.Icon>
          </Select.Trigger>
          <Select.Portal>
            <Select.Positioner className="select-positioner" sideOffset={6}>
              <Select.Popup className="select-popup">
                <Select.List>
                  {participationStatuses.map((item) => (
                    <Select.Item
                      className="select-item"
                      key={item.value}
                      value={item.value}
                    >
                      <Select.ItemText>{item.label}</Select.ItemText>
                      <Select.ItemIndicator>
                        <Check aria-hidden="true" size={15} />
                      </Select.ItemIndicator>
                    </Select.Item>
                  ))}
                </Select.List>
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>
      </div>

      <CityCombobox
        label="Город погрузки"
        placeholder="Откуда"
        value={loadCity}
        onValueChange={setLoadCity}
      />
      <CityCombobox
        label="Город выгрузки"
        placeholder="Куда"
        value={unloadCity}
        onValueChange={setUnloadCity}
      />

      <button className="filter-submit" type="submit">
        Применить фильтры
      </button>
      <button className="filter-reset" type="button" onClick={onReset}>
        <X aria-hidden="true" size={15} />
        Сбросить
      </button>
    </form>
  );
}
