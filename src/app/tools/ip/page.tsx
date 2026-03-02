"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { usePublicIpInfo } from "@/components/ip/usePublicIpInfo";

export default function IpToolPage() {
  const info = usePublicIpInfo();
  const timestamp = new Date().toISOString();

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Badge variant="secondary" className="mb-4">
        Tool
      </Badge>
      <h1 className="text-3xl font-semibold tracking-tight">IP Lookup</h1>
      <p className="mt-2 text-muted-foreground">
        Best-effort IP and request metadata from your current request.
      </p>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Result</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div>
            <span className="font-medium">IP:</span>{" "}
            {info.ip ?? (info.loading ? "Loading..." : "Unavailable")}
          </div>
          <div>
            <span className="font-medium">Country:</span>{" "}
            {info.country ?? info.countryCode ?? (info.loading ? "Loading..." : "Unknown")}
          </div>
          <div>
            <span className="font-medium">Region / City:</span>{" "}
            {info.loading
              ? "Loading..."
              : `${info.region ?? ""}${info.city ? ` · ${info.city}` : ""}`.trim() || "Unknown"}
          </div>
          <div>
            <span className="font-medium">ISP / Org:</span>{" "}
            {info.isp ?? info.org ?? (info.loading ? "Loading..." : "Unknown")}
          </div>
          <div>
            <span className="font-medium">ASN:</span> {info.asn ?? (info.loading ? "Loading..." : "Unknown")}
          </div>
          <div>
            <span className="font-medium">Timezone:</span> {info.timezone ?? (info.loading ? "Loading..." : "Unknown")}
          </div>
          <div className="pt-2 text-muted-foreground">
            Source: {info.source ?? "-"}
          </div>
          <div className="text-muted-foreground">
            Timestamp: {timestamp}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
