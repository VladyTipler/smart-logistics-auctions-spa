import { Combobox } from "@base-ui/react/combobox";
import { Check, ChevronDown, X } from "lucide-react";
import { useId } from "react";

import {
  cityOptions,
  type CityOption,
} from "../model/city-options";

type CityComboboxProps = {
  label: string;
  onValueChange: (value: CityOption | null) => void;
  placeholder: string;
  value: CityOption | null;
};

export function CityCombobox({
  label,
  onValueChange,
  placeholder,
  value,
}: CityComboboxProps) {
  const inputId = useId();

  return (
    <Combobox.Root
      items={cityOptions}
      value={value}
      onValueChange={onValueChange}
      isItemEqualToValue={(item, selected) => item.id === selected.id}
    >
      <div className="filter-field filter-field--city">
        <label htmlFor={inputId}>{label}</label>
        <Combobox.InputGroup className="combobox-control">
          <Combobox.Input
            className="combobox-input"
            id={inputId}
            placeholder={placeholder}
          />
          <Combobox.Clear
            className="combobox-clear"
            aria-label={`Очистить: ${label.toLocaleLowerCase()}`}
          >
            <X aria-hidden="true" size={14} />
          </Combobox.Clear>
          <Combobox.Trigger
            className="combobox-trigger"
            aria-label={`Открыть список: ${label.toLocaleLowerCase()}`}
          >
            <ChevronDown aria-hidden="true" size={16} />
          </Combobox.Trigger>
        </Combobox.InputGroup>
      </div>
      <Combobox.Portal>
        <Combobox.Positioner className="select-positioner" sideOffset={6}>
          <Combobox.Popup className="select-popup combobox-popup">
            <Combobox.Empty className="combobox-empty">
              Город не найден
            </Combobox.Empty>
            <Combobox.List className="combobox-list">
              {(option: CityOption) => (
                <Combobox.Item
                  className="select-item"
                  key={option.id}
                  value={option}
                >
                  <Combobox.ItemIndicator>
                    <Check aria-hidden="true" size={15} />
                  </Combobox.ItemIndicator>
                  <span>{option.name}</span>
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}
