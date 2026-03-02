import { headers } from "next/headers";

export function getBestEffortIpFromHeaders(h: Headers): string | null {
  const xff = h.get("x-forwarded-for");
  const first = xff ? xff.split(",")[0]?.trim() : null;
  return (
    normalizeIp(first) ??
    normalizeIp(h.get("x-real-ip")) ??
    normalizeIp(h.get("cf-connecting-ip")) ??
    null
  );
}

export function normalizeIp(ip: string | null | undefined): string | null {
  if (!ip) return null;
  let s = ip.trim();

  // Strip brackets for IPv6 in URLs: [::1]
  if (s.startsWith("[") && s.endsWith("]")) s = s.slice(1, -1);

  // Strip zone index (e.g. fe80::1%en0)
  const zoneIndex = s.indexOf("%");
  if (zoneIndex !== -1) s = s.slice(0, zoneIndex);

  // Strip port for IPv4 like 1.2.3.4:1234
  if (s.includes(":")) {
    const v4PortMatch = s.match(/^([0-9]{1,3}(?:\.[0-9]{1,3}){3}):(\d{1,5})$/);
    if (v4PortMatch) s = v4PortMatch[1];
  }

  // IPv4-mapped IPv6: ::ffff:1.2.3.4
  const v4Mapped = s.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i);
  if (v4Mapped) s = v4Mapped[1];

  return s || null;
}

export function isLikelyPublicIp(ip: string | null): boolean {
  if (!ip) return false;

  // IPv4
  const v4 = ip.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (v4) {
    const o = v4.slice(1).map((n) => Number(n));
    if (o.some((n) => Number.isNaN(n) || n < 0 || n > 255)) return false;
    const [a, b] = o;

    // RFC1918
    if (a === 10) return false;
    if (a === 172 && b >= 16 && b <= 31) return false;
    if (a === 192 && b === 168) return false;

    // Loopback, link-local, CGNAT, unspecified, docs
    if (a === 127) return false;
    if (a === 169 && b === 254) return false;
    if (a === 100 && b >= 64 && b <= 127) return false;
    if (a === 0) return false;
    if (a === 192 && b === 0) return false;
    if (a === 198 && (b === 18 || b === 19)) return false;
    if (a === 198 && b === 51) return false;
    if (a === 203 && b === 0) return false;
    if (a >= 224) return false;
    return true;
  }

  // IPv6
  const s = ip.toLowerCase();
  if (s === "::" || s === "::1") return false;
  if (s.startsWith("fe80:")) return false; // link-local
  if (s.startsWith("fc") || s.startsWith("fd")) return false; // unique local fc00::/7
  return true;
}

export async function getBestEffortIpFromRequestHeaders(): Promise<string | null> {
  const h = await headers();
  return getBestEffortIpFromHeaders(h);
}
