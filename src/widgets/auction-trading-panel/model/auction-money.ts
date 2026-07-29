const currencyByNumericCode: Record<string, string> = {
  "498": "MDL",
  "643": "RUB",
  "840": "USD",
  "978": "EUR",
};

export function formatAuctionMoney(
  value: number,
  numericCurrencyCode?: string,
) {
  const currency = numericCurrencyCode
    ? currencyByNumericCode[numericCurrencyCode]
    : undefined;

  if (!currency) {
    return new Intl.NumberFormat("ru-RU", {
      maximumFractionDigits: 0,
    }).format(value);
  }

  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}
