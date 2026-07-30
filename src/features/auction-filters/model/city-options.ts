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
  city(11, "Клуж-Напока"),
  city(12, "Будапешт"),
  city(13, "Львов"),
  city(14, "Краков"),
  city(15, "Брест"),
  city(16, "Вильнюс"),
  city(17, "Гданьск"),
  city(18, "Берлин"),
  city(19, "Прага"),
  city(20, "Вена"),
  city(21, "Братислава"),
  city(22, "Загреб"),
  city(23, "Белград"),
  city(24, "Скопье"),
  city(25, "Салоники"),
  city(26, "Стамбул"),
  city(27, "Констанца"),
  city(28, "Русе"),
  city(29, "Черновцы"),
  city(30, "Дебрецен"),
  city(31, "Люблин"),
  city(32, "Кошице"),
  city(33, "Рига"),
  city(34, "Таллин"),
  city(35, "Варшава"),
  city(36, "Познань"),
];

export function findCityOption(name: string | undefined): CityOption | null {
  return cityOptions.find((option) => option.name === name) ?? null;
}
