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

async function fetchIpwhoisApp(ip: string): Promise<IpEnrichment | null> {
  const r = await fetch(`https://ipwhois.app/json/${encodeURIComponent(ip)}`, {
    cache: "no-store",
  });
  if (!r.ok) return null;

  const data = asRecord((await r.json()) as unknown);
  if (!data) return null;

  // ipwhois.app includes a boolean `success`.
  if (data["success"] === false) return null;

  const out: IpEnrichment = {
    ip,
    countryCode: asString(data["country_code"]),
    country: asString(data["country"]),
    region: asString(data["region"]),
    city: asString(data["city"]),
    timezone: asString(data["timezone"]),
    asn: asString(data["asn"]) ?? asNumberString(data["asn"]),
    org: asString(data["org"]),
    isp: asString(data["isp"]),
    source: "ipwhois.app",
  };
  return out;
}

async function fetchIpapiIs(ip: string): Promise<IpEnrichment | null> {
  const url = new URL("https://api.ipapi.is/");
  url.searchParams.set("q", ip);
  const r = await fetch(url.toString(), { cache: "no-store" });
  if (!r.ok) return null;
  const data = asRecord((await r.json()) as unknown);
  if (!data) return null;

  const location = asRecord(data["location"]);
  const asn = asRecord(data["asn"]);
  const company = asRecord(data["company"]);

  const out: IpEnrichment = {
    ip,
    countryCode: asString(location?.["country_code"]),
    country: asString(location?.["country"]),
    region: asString(location?.["state"]),
    city: asString(location?.["city"]),
    timezone: asString(location?.["timezone"]),
    asn: asNumberString(asn?.["asn"]) ?? asString(asn?.["asn"]),
    org: asString(asn?.["org"]) ?? asString(company?.["name"]),
    isp: asString(asn?.["org"]) ?? asString(company?.["name"]),
    source: "ipapi.is",
  };
  return out;
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
    let out: IpEnrichment | null = null;

    // Primary: IPinfo Lite (optional token)
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
        out = {
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
      }
    }

    // Fallbacks (no key): fill missing fields or replace failures.
    const needsMore =
      !out ||
      !out.countryCode ||
      !out.region ||
      !out.city ||
      !out.timezone ||
      !out.asn ||
      !out.org;

    if (needsMore) {
      const ipwhois = await fetchIpwhoisApp(ip);
      if (ipwhois) {
        const mergedSource = out?.source
          ? `${out.source}+${ipwhois.source}`
          : ipwhois.source;
        out = {
          ...(out ?? { ip, source: mergedSource }),
          countryCode: out?.countryCode ?? ipwhois.countryCode,
          country: out?.country ?? ipwhois.country,
          region: out?.region ?? ipwhois.region,
          city: out?.city ?? ipwhois.city,
          timezone: out?.timezone ?? ipwhois.timezone,
          asn: out?.asn ?? ipwhois.asn,
          org: out?.org ?? ipwhois.org,
          isp: out?.isp ?? ipwhois.isp,
          source: mergedSource,
        };
      } else {
        const ipapi = await fetchIpapiIs(ip);
        if (ipapi) out = ipapi;
      }
    }

    if (!out) {
      return NextResponse.json(
        { error: "Enrichment failed" },
        { status: 502, headers: { "cache-control": "no-store" } }
      );
    }

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
