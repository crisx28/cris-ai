// Peso (PHP) formatting helpers used across the whole app.

export function peso(amount: number, opts?: { decimals?: boolean }): string {
  const decimals = opts?.decimals ?? false;
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: decimals ? 2 : 0,
    maximumFractionDigits: decimals ? 2 : 0,
  }).format(isFinite(amount) ? amount : 0);
}

// Compact form for tight spaces, e.g. ₱1.2k, ₱45k, ₱1.1M
export function pesoCompact(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? "-" : "";
  if (abs >= 1_000_000) return `${sign}₱${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}₱${(abs / 1_000).toFixed(abs >= 100_000 ? 0 : 1)}k`;
  return `${sign}₱${abs.toFixed(0)}`;
}

export function pct(value: number): string {
  if (!isFinite(value)) return "0%";
  return `${Math.round(value)}%`;
}
