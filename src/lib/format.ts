export function formatPrice(value: number | null | undefined, currency?: string | null) {
  if (value === null || value === undefined) {
    return "未取得";
  }

  const suffix = currency === "JPY" ? "円" : currency ? ` ${currency}` : "";
  return `${new Intl.NumberFormat("ja-JP", { maximumFractionDigits: 2 }).format(value)}${suffix}`;
}

export function formatPercent(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "未計算";
  }

  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "未取得";
  }

  return new Intl.DateTimeFormat("ja-JP", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Tokyo"
  }).format(new Date(value));
}
