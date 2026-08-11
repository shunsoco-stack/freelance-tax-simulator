export function formatYen(value: number): string {
  return `${Math.round(value).toLocaleString("ja-JP")}円`;
}

export function formatCompactYen(value: number): string {
  const absolute = Math.abs(value);
  if (absolute >= 10_000) {
    return `${(value / 10_000).toLocaleString("ja-JP", { maximumFractionDigits: 1 })}万円`;
  }
  return formatYen(value);
}

export function formatPercent(value: number): string {
  return `${(value * 100).toLocaleString("ja-JP", { maximumFractionDigits: 1 })}%`;
}
