"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataValue } from "@/components/ui/data-value";
import { Skeleton } from "@/components/ui/skeleton";
import { type PublicIpInfo, usePublicIpInfo } from "@/components/ip/usePublicIpInfo";
import { countryCodeToFlagEmoji } from "@/lib/i18n/flags";

export function IpOverviewCards({
  initial,
}: {
  initial?: Partial<PublicIpInfo>;
}) {
  const info = usePublicIpInfo(initial);

  const ipValue = info.ip;
  const countryFlag = countryCodeToFlagEmoji(info.countryCode);
  const countryValue = info.country ?? info.countryCode;
  const regionCityValue = (info.region || info.city) && !info.loading
    ? `${info.region ?? ""}${info.city ? ` · ${info.city}` : ""}`.trim()
    : null;
  const ispValue = info.isp ?? info.org;

  return (
    <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">IP Address</CardTitle>
        </CardHeader>
        <CardContent className="text-base font-medium">
          {ipValue ? (
            <DataValue value={ipValue} copyText={ipValue} monospace />
          ) : info.loading ? (
            <Skeleton className="h-6 w-40" />
          ) : (
            "Unavailable"
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Country</CardTitle>
        </CardHeader>
        <CardContent className="text-base font-medium">
          {countryValue ? (
            <span className="inline-flex max-w-full items-center gap-2">
              {countryFlag ? (
                <span aria-hidden="true" className="leading-none opacity-90">
                  {countryFlag}
                </span>
              ) : null}
              <DataValue value={countryValue} copyText={countryValue} />
            </span>
          ) : info.loading ? (
            <Skeleton className="h-6 w-28" />
          ) : (
            "Unknown"
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Region / City</CardTitle>
        </CardHeader>
        <CardContent className="text-base font-medium">
          {regionCityValue ? (
            <DataValue value={regionCityValue} copyText={regionCityValue} />
          ) : info.loading ? (
            <Skeleton className="h-6 w-44" />
          ) : (
            "Unknown"
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">ISP / Org</CardTitle>
        </CardHeader>
        <CardContent className="text-base font-medium">
          {ispValue ? (
            <DataValue value={ispValue} copyText={ispValue} />
          ) : info.loading ? (
            <Skeleton className="h-6 w-56" />
          ) : (
            "Unknown"
          )}
        </CardContent>
      </Card>
    </section>
  );
}
