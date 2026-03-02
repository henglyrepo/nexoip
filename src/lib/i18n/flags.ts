export function countryCodeToFlagEmoji(
  code: string | null | undefined
): string | null {
  const cc = code?.trim().toUpperCase() ?? "";
  if (!/^[A-Z]{2}$/.test(cc)) return null;
  if (cc === "XX") return null;

  const base = 0x1f1e6;
  const a = cc.charCodeAt(0) - 65;
  const b = cc.charCodeAt(1) - 65;
  if (a < 0 || a > 25 || b < 0 || b > 25) return null;

  return String.fromCodePoint(base + a, base + b);
}
