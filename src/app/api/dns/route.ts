import { NextRequest, NextResponse } from "next/server";

const ALLOWED_TYPES = [
  "A",
  "AAAA",
  "CNAME",
  "MX",
  "NS",
  "SOA",
  "TXT",
  "PTR",
] as const;
type DnsType = (typeof ALLOWED_TYPES)[number];

function isValidAsciiHostname(name: string): boolean {
  const s = name.trim().toLowerCase();
  if (!s || s.length > 253) return false;
  if (s.includes("..")) return false;
  const labels = s.split(".").filter(Boolean);
  if (labels.length < 1) return false;
  for (const label of labels) {
    if (label.length < 1 || label.length > 63) return false;
    if (!/^[a-z0-9-]+$/.test(label)) return false;
    if (label.startsWith("-") || label.endsWith("-")) return false;
  }
  return true;
}

async function fetchGoogle(name: string, type: DnsType) {
  const url = new URL("https://dns.google/resolve");
  url.searchParams.set("name", name);
  url.searchParams.set("type", type);
  const r = await fetch(url.toString(), { cache: "no-store" });
  if (!r.ok) throw new Error("google_doh_failed");
  return await r.json();
}

async function fetchCloudflare(name: string, type: DnsType) {
  const url = new URL("https://cloudflare-dns.com/dns-query");
  url.searchParams.set("name", name);
  url.searchParams.set("type", type);
  const r = await fetch(url.toString(), {
    cache: "no-store",
    headers: { accept: "application/dns-json" },
  });
  if (!r.ok) throw new Error("cloudflare_doh_failed");
  return await r.json();
}

export async function GET(req: NextRequest) {
  const name = (req.nextUrl.searchParams.get("name") || "").trim();
  const typeParam = (req.nextUrl.searchParams.get("type") || "A")
    .trim()
    .toUpperCase();
  const type = (ALLOWED_TYPES as readonly string[]).includes(typeParam)
    ? (typeParam as DnsType)
    : null;

  if (!type) {
    return NextResponse.json(
      { error: `Invalid type. Use: ${ALLOWED_TYPES.join(", ")}` },
      { status: 400, headers: { "cache-control": "no-store" } }
    );
  }

  if (!isValidAsciiHostname(name)) {
    return NextResponse.json(
      { error: "Invalid domain/hostname (ASCII only)." },
      { status: 400, headers: { "cache-control": "no-store" } }
    );
  }

  try {
    const [google, cloudflare] = await Promise.allSettled([
      fetchGoogle(name, type),
      fetchCloudflare(name, type),
    ]);

    return NextResponse.json(
      {
        name,
        type,
        google: google.status === "fulfilled" ? google.value : null,
        cloudflare:
          cloudflare.status === "fulfilled" ? cloudflare.value : null,
        timestamp: new Date().toISOString(),
      },
      { status: 200, headers: { "cache-control": "no-store" } }
    );
  } catch {
    return NextResponse.json(
      { error: "DNS query failed" },
      { status: 502, headers: { "cache-control": "no-store" } }
    );
  }
}
