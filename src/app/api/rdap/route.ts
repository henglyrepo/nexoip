import { NextRequest, NextResponse } from "next/server";

import { isLikelyPublicIp, normalizeIp } from "@/lib/net/ip";

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
  const qRaw = (req.nextUrl.searchParams.get("q") || "").trim();
  if (!qRaw) {
    return NextResponse.json(
      { error: "Missing q" },
      { status: 400, headers: { "cache-control": "no-store" } }
    );
  }

  const ip = normalizeIp(qRaw);
  let url: string | null = null;

  if (ip && isLikelyPublicIp(ip)) {
    url = `https://rdap.org/ip/${encodeURIComponent(ip)}`;
  } else if (isValidAsciiHostname(qRaw)) {
    url = `https://rdap.org/domain/${encodeURIComponent(qRaw)}`;
  }

  if (!url) {
    return NextResponse.json(
      { error: "Provide a public IP or a valid ASCII domain." },
      { status: 400, headers: { "cache-control": "no-store" } }
    );
  }

  try {
    const r = await fetch(url, {
      cache: "no-store",
      headers: { accept: "application/rdap+json, application/json" },
    });

    if (!r.ok) {
      return NextResponse.json(
        { error: "RDAP lookup failed" },
        { status: 502, headers: { "cache-control": "no-store" } }
      );
    }

    const data = await r.json();
    return NextResponse.json(
      {
        query: qRaw,
        sourceUrl: url,
        data,
        timestamp: new Date().toISOString(),
      },
      { status: 200, headers: { "cache-control": "no-store" } }
    );
  } catch {
    return NextResponse.json(
      { error: "RDAP lookup failed" },
      { status: 502, headers: { "cache-control": "no-store" } }
    );
  }
}
