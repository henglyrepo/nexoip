import { NextRequest, NextResponse } from "next/server";

import { isLikelyPublicIp, normalizeIp } from "@/lib/net/ip";

type IpEnrichment = {
  ip: string;
  countryCode?: string;
  country?: string;
  region?: string;
  city?: string;
  timezone?: string;
  asn?: string;
  org?: string;
  isp?: string;
  source: string;
};

function asRecord(v: unknown): Record<string, unknown> | null {
  if (!v || typeof v !== "object") return null;
  return v as Record<string, unknown>;
}

function asString(v: unknown): string | undefined {
  return typeof v === "string" && v.trim() ? v : undefined;
}

function asNumberString(v: unknown): string | undefined {
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  if (typeof v === "string" && v.trim() && /^\d+$/.test(v.trim())) return v.trim();
  return undefined;
}

export async function GET(req: NextRequest) {
  const ip = normalizeIp(req.nextUrl.searchParams.get("ip"));
  if (!ip) {
    return NextResponse.json(
      { error: "Missing ip" },
      { status: 400, headers: { "cache-control": "no-store" } }
    );
  }

  if (!isLikelyPublicIp(ip)) {
    return NextResponse.json(
      { error: "IP must be a public address" },
      { status: 400, headers: { "cache-control": "no-store" } }
    );
  }

  const ipinfoToken = process.env.IPINFO_TOKEN;

  try {
    if (ipinfoToken) {
      const r = await fetch(
        `https://api.ipinfo.io/lite/${encodeURIComponent(ip)}?token=${encodeURIComponent(
          ipinfoToken
        )}`,
        { cache: "no-store" }
      );

      if (r.ok) {
        const data = asRecord((await r.json()) as unknown);
        if (!data) throw new Error("invalid_response");
        const out: IpEnrichment = {
          ip,
          countryCode: asString(data["country_code"]),
          country: asString(data["country"]),
          region: asString(data["region"]),
          city: asString(data["city"]),
          timezone: asString(data["timezone"]),
          asn: asString(data["asn"]) ?? asNumberString(data["asn"]),
          org: asString(data["as_name"]) ?? asString(data["org"]),
          source: "ipinfo-lite",
        };
        return NextResponse.json(out, {
          status: 200,
          headers: { "cache-control": "no-store" },
        });
      }
    }

    // Fallback: ipwho.is (no key)
    const r = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}`, {
      cache: "no-store",
    });
    if (!r.ok) {
      return NextResponse.json(
        { error: "Enrichment failed" },
        { status: 502, headers: { "cache-control": "no-store" } }
      );
    }
    const data = asRecord((await r.json()) as unknown);
    if (!data) throw new Error("invalid_response");
    if (data["success"] === false) {
      return NextResponse.json(
        { error: "Enrichment failed" },
        { status: 502, headers: { "cache-control": "no-store" } }
      );
    }

    const connection = asRecord(data["connection"]);
    const timezone = asRecord(data["timezone"]);

    const out: IpEnrichment = {
      ip,
      countryCode: asString(data["country_code"]),
      country: asString(data["country"]),
      region: asString(data["region"]),
      city: asString(data["city"]),
      timezone: asString(timezone?.["id"]) ?? asString(data["timezone"]),
      asn: asNumberString(connection?.["asn"]) ?? asString(data["asn"]),
      org: asString(connection?.["org"]) ?? asString(data["org"]),
      isp: asString(connection?.["isp"]) ?? asString(data["isp"]),
      source: "ipwho.is",
    };

    return NextResponse.json(out, {
      status: 200,
      headers: { "cache-control": "no-store" },
    });
  } catch {
    return NextResponse.json(
      { error: "Enrichment failed" },
      { status: 502, headers: { "cache-control": "no-store" } }
    );
  }
}
