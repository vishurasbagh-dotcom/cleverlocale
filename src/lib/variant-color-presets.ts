/** Preset swatches for variant colors — safe for Client Components. */

export const VARIANT_COLOR_PRESETS = [
  "#1a1a1a",
  "#ffffff",
  "#6b7280",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#0ea5e9",
  "#3b82f6",
  "#6366f1",
  "#a855f7",
  "#ec4899",
  "#92400e",
  "#78716c",
  "#f5f5f4",
] as const;

export function isValidVariantHex(s: string | null | undefined): s is string {
  return typeof s === "string" && /^#[0-9A-Fa-f]{6}$/.test(s);
}

/** Normalize client input: valid #RRGGBB or null. */
export function normalizeVariantColor(s: unknown): string | null {
  if (s == null) return null;
  const t = String(s).trim();
  if (t === "") return null;
  return isValidVariantHex(t) ? t : null;
}
