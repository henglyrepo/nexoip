import { NextRequest, NextResponse } from "next/server";

function isValidAsciiHostname(name: string): boolean {
  const s = name.trim().toLowerCase();
  if (!s || s.length > 253) return false;
  if (s.includes("..")) return false;
  const labels = s.split(".").filter(Boolean);
  if (labels.length < 2) return false;
  for (const label of labels) {
    if (label.length < 1 || label.length > 63) return false;
    if (!/^[a-z0-9-]+$/.test(label)) return false;
    if (label.startsWith("-") || label.endsWith("-")) return false;
  }
  return true;
}

export async function GET(req: NextRequest) {
  const domain = (req.nextUrl.searchParams.get("domain") || "").trim();
  if (!isValidAsciiHostname(domain)) {
    return NextResponse.json(
      { error: "Invalid domain (ASCII only)." },
      { status: 400, headers: { "cache-control": "no-store" } }
    );
  }

  const url = new URL("https://haveibeenpwned.com/api/v3/breaches");
  url.searchParams.set("domain", domain);

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 8000);

  try {
    const r = await fetch(url.toString(), {
      headers: {
        "User-Agent": "NEXO",
        accept: "application/json",
      },
      // Breaches change slowly; allow platform caching.
      next: { revalidate: 60 * 60 * 12 },
      signal: controller.signal,
    });

    if (r.status === 404) {
      return NextResponse.json(
        {
          domain,
          breaches: [],
          timestamp: new Date().toISOString(),
          source: "haveibeenpwned.com",
        },
        { status: 200 }
      );
    }

    if (!r.ok) {
      return NextResponse.json(
        { error: "Breach lookup failed" },
        { status: 502, headers: { "cache-control": "no-store" } }
      );
    }

    const breaches = (await r.json()) as unknown;
    return NextResponse.json(
      {
        domain,
        breaches,
        timestamp: new Date().toISOString(),
        source: "haveibeenpwned.com",
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { error: "Breach lookup failed" },
      { status: 502, headers: { "cache-control": "no-store" } }
    );
  } finally {
    clearTimeout(t);
  }
}
