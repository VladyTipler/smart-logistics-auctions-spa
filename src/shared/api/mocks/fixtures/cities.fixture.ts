export interface MockCity {
  gcId: number;
  name: string;
}

export const cityFixtures = [
  { gcId: 1, name: "Кишинёв" },
  { gcId: 2, name: "Бухарест" },
  { gcId: 3, name: "Одесса" },
  { gcId: 4, name: "Киев" },
  { gcId: 5, name: "Бельцы" },
  { gcId: 6, name: "Яссы" },
  { gcId: 7, name: "Тирасполь" },
  { gcId: 8, name: "София" },
] as const satisfies readonly MockCity[];
