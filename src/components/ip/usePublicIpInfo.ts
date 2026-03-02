"use client";

import { useEffect, useState } from "react";

type IpApi = {
  ip: string | null;
  // Note: `/api/ip` returns a country *code* here.
  country: string | null;
  region?: string | null;
  city?: string | null;
  timezone?: string | null;
  isPublicIp?: boolean;
};

type IpEnrich = {
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

export type PublicIpInfo = {
  ip: string | null;
  countryCode: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  timezone: string | null;
  asn: string | null;
  org: string | null;
  isp: string | null;
  source: string | null;
  loading: boolean;
  error: string | null;
};

async function getJson<T>(url: string): Promise<T> {
  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) throw new Error("request_failed");
  return (await r.json()) as T;
}

function countryNameFromCode(code: string | null): string | null {
  if (!code) return null;
  try {
    const dn = new Intl.DisplayNames(["en"], { type: "region" });
    return dn.of(code) ?? null;
  } catch {
    return null;
  }
}

export function usePublicIpInfo(initial?: Partial<PublicIpInfo>): PublicIpInfo {
  const [state, setState] = useState<PublicIpInfo>({
    ip: initial?.ip ?? null,
    countryCode: initial?.countryCode ?? null,
    country: initial?.country ?? null,
    region: initial?.region ?? null,
    city: initial?.city ?? null,
    timezone: initial?.timezone ?? null,
    asn: initial?.asn ?? null,
    org: initial?.org ?? null,
    isp: initial?.isp ?? null,
    source: initial?.source ?? null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function run() {
      let finalError: string | null = null;
      try {
        const api = await getJson<IpApi>("/api/ip");
        if (cancelled) return;

        const headerIp = api.ip;
        const headerCountryCode = api.country;
        const headerCountryName = countryNameFromCode(headerCountryCode);
        const headerIsPublic = api.isPublicIp === true;

        setState((s) => ({
          ...s,
          ip: s.ip ?? headerIp,
          countryCode: s.countryCode ?? headerCountryCode,
          country: s.country ?? headerCountryName,
          region: s.region ?? api.region ?? null,
          city: s.city ?? api.city ?? null,
          timezone: s.timezone ?? api.timezone ?? null,
          source: s.source ?? "request-headers",
        }));

        let ip = headerIsPublic ? headerIp : null;
        if (!ip) {
          // Browser-based IP discovery (works in local dev too)
          const ipify = await getJson<{ ip: string }>(
            "https://api.ipify.org?format=json"
          );
          if (cancelled) return;
          ip = ipify.ip;
          setState((s) => ({ ...s, ip, source: "ipify" }));
        }

        if (ip) {
          try {
            const enrich = await getJson<IpEnrich>(
              `/api/ip/enrich?ip=${encodeURIComponent(ip)}`
            );
            if (cancelled) return;
            setState((s) => ({
              ...s,
              ip: enrich.ip ?? s.ip,
              countryCode: enrich.countryCode ?? s.countryCode,
              country: enrich.country ?? s.country,
              region: enrich.region ?? s.region,
              city: enrich.city ?? s.city,
              timezone: enrich.timezone ?? s.timezone,
              asn: enrich.asn ?? s.asn,
              org: enrich.org ?? s.org,
              isp: enrich.isp ?? s.isp,
              source: enrich.source ?? s.source,
            }));
          } catch {
            finalError = "Enrichment unavailable";
          }
        }
      } catch {
        if (cancelled) return;
        finalError = "Failed to load IP";
      } finally {
        if (cancelled) return;
        setState((s) => ({ ...s, loading: false, error: s.error ?? finalError }));
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
