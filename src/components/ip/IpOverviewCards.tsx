"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type PublicIpInfo, usePublicIpInfo } from "@/components/ip/usePublicIpInfo";

export function IpOverviewCards({
  initial,
}: {
  initial?: Partial<PublicIpInfo>;
}) {
  const info = usePublicIpInfo(initial);

  return (
    <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">IP Address</CardTitle>
        </CardHeader>
        <CardContent className="text-base font-medium">
          {info.ip ?? (info.loading ? "Loading..." : "Unavailable")}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Country</CardTitle>
        </CardHeader>
        <CardContent className="text-base font-medium">
          {info.country ?? info.countryCode ?? (info.loading ? "Loading..." : "Unknown")}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Region / City</CardTitle>
        </CardHeader>
        <CardContent className="text-base font-medium">
          {(info.region || info.city) && !info.loading
            ? `${info.region ?? ""}${info.city ? ` · ${info.city}` : ""}`.trim()
            : info.loading
              ? "Loading..."
              : "Unknown"}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">ISP / Org</CardTitle>
        </CardHeader>
        <CardContent className="text-base font-medium">
          {info.isp ?? info.org ?? (info.loading ? "Loading..." : "Unknown")}
        </CardContent>
      </Card>
    </section>
  );
}
