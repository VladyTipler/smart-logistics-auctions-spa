const currencyByNumericCode: Record<string, string> = {
  "498": "MDL",
  "643": "RUB",
  "840": "USD",
  "978": "EUR",
};

export function formatMoney(value: number, numericCurrencyCode?: string) {
  const currency = numericCurrencyCode
    ? currencyByNumericCode[numericCurrencyCode]
    : undefined;
  const formatted = new Intl.NumberFormat("ru-RU", {
    ...(currency ? { style: "currency", currency } : {}),
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);

  return formatted.replace(/\s/g, " ");
}
