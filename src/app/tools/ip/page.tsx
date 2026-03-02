"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataValue } from "@/components/ui/data-value";
import { Skeleton } from "@/components/ui/skeleton";

import { usePublicIpInfo } from "@/components/ip/usePublicIpInfo";

export default function IpToolPage() {
  const info = usePublicIpInfo();
  const timestamp = new Date().toISOString();

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Badge variant="secondary" className="mb-4">
        Tool
      </Badge>
      <h1 className="text-3xl font-semibold tracking-tight nexo-animate-in">IP Lookup</h1>
      <p className="mt-2 text-muted-foreground">
        Best-effort IP and request metadata from your current request.
      </p>

      <Card className="mt-6 nexo-animate-in" style={{ animationDelay: "90ms" }}>
        <CardHeader>
          <CardTitle>Result</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {info.error ? (
            <div className="text-destructive">{info.error}</div>
          ) : null}
          <div>
            <span className="font-medium">IP:</span>{" "}
            {info.ip ? (
              <DataValue value={info.ip} copyText={info.ip} monospace />
            ) : info.loading ? (
              <Skeleton className="inline-block h-5 w-36 align-middle" />
            ) : (
              "Unavailable"
            )}
          </div>
          <div>
            <span className="font-medium">Country:</span>{" "}
            {info.country ?? info.countryCode ? (
              <DataValue
                value={info.country ?? info.countryCode ?? ""}
                copyText={info.country ?? info.countryCode ?? undefined}
              />
            ) : info.loading ? (
              <Skeleton className="inline-block h-5 w-24 align-middle" />
            ) : (
              "Unknown"
            )}
          </div>
          <div>
            <span className="font-medium">Region / City:</span>{" "}
            {info.loading ? (
              <Skeleton className="inline-block h-5 w-40 align-middle" />
            ) : `${info.region ?? ""}${info.city ? ` · ${info.city}` : ""}`.trim() ? (
              <DataValue
                value={`${info.region ?? ""}${info.city ? ` · ${info.city}` : ""}`.trim()}
                copyText={`${info.region ?? ""}${info.city ? ` · ${info.city}` : ""}`.trim()}
              />
            ) : (
              "Unknown"
            )}
          </div>
          <div>
            <span className="font-medium">ISP / Org:</span>{" "}
            {info.isp ?? info.org ? (
              <DataValue
                value={info.isp ?? info.org ?? ""}
                copyText={info.isp ?? info.org ?? undefined}
              />
            ) : info.loading ? (
              <Skeleton className="inline-block h-5 w-52 align-middle" />
            ) : (
              "Unknown"
            )}
          </div>
          <div>
            <span className="font-medium">ASN:</span>{" "}
            {info.asn ? (
              <DataValue value={info.asn} copyText={info.asn} monospace />
            ) : info.loading ? (
              <Skeleton className="inline-block h-5 w-20 align-middle" />
            ) : (
              "Unknown"
            )}
          </div>
          <div>
            <span className="font-medium">Timezone:</span>{" "}
            {info.timezone ? (
              <DataValue value={info.timezone} copyText={info.timezone} />
            ) : info.loading ? (
              <Skeleton className="inline-block h-5 w-28 align-middle" />
            ) : (
              "Unknown"
            )}
          </div>
          <div className="pt-2 text-muted-foreground">
            Source:{" "}
            {info.source ? (
              <DataValue value={info.source} copyText={info.source} />
            ) : (
              "-"
            )}
          </div>
          <div className="text-muted-foreground">
            Timestamp:{" "}
            <DataValue value={timestamp} copyText={timestamp} monospace />
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
