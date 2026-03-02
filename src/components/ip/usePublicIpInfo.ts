"use client";

import { useEffect, useState } from "react";

type IpApi = {
  ip: string | null;
  country: string | null;
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
      try {
        const api = await getJson<IpApi>("/api/ip");
        if (cancelled) return;

        const headerIp = api.ip;
        const headerCountry = api.country;
        const headerIsPublic = api.isPublicIp === true;

        setState((s) => ({
          ...s,
          ip: s.ip ?? headerIp,
          countryCode: s.countryCode,
          country: s.country ?? headerCountry,
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
        }

        setState((s) => ({ ...s, loading: false }));
      } catch {
        if (cancelled) return;
        setState((s) => ({ ...s, loading: false, error: "Failed to load IP" }));
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
