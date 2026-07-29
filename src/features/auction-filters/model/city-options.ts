export interface CityOption {
  id: number;
  label: string;
  name: string;
  value: string;
}

function city(id: number, name: string): CityOption {
  return { id, label: name, name, value: String(id) };
}

export const cityOptions: readonly CityOption[] = [
  city(1, "Кишинёв"),
  city(2, "Бухарест"),
  city(3, "Одесса"),
  city(4, "Киев"),
  city(5, "Бельцы"),
  city(6, "Яссы"),
  city(7, "Тирасполь"),
  city(8, "София"),
  city(9, "Комрат"),
  city(10, "Варна"),
];

export function findCityOption(name: string | undefined): CityOption | null {
  return cityOptions.find((option) => option.name === name) ?? null;
}
