export function formatTokens(n: unknown): string {
  const v = Number(n);
  if (!isFinite(v)) return "0";
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return v.toString();
}

export function formatUSD(n: unknown): string {
  const v = Number(n);
  if (!isFinite(v)) return "$0.00";
  return `$${v.toFixed(2)}`;
}

export function formatBytes(n: unknown): string {
  const v = Number(n);
  if (!isFinite(v)) return "0 B";
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)} MB`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)} KB`;
  return `${v} B`;
}

export function formatPercent(n: unknown): string {
  const v = Number(n);
  if (!isFinite(v)) return "0%";
  return `${v.toFixed(1)}%`;
}

export function safeNumber(n: unknown, fallback = 0): number {
  const v = Number(n);
  return isFinite(v) ? v : fallback;
}
