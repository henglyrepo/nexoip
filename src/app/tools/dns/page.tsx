"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const TYPES = ["A", "AAAA", "CNAME", "MX", "NS", "SOA", "TXT", "PTR"] as const;

export default function DnsToolPage() {
  const [name, setName] = useState("example.com");
  const [type, setType] = useState<(typeof TYPES)[number]>("A");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<unknown>(null);

  async function run() {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const r = await fetch(
        `/api/dns?name=${encodeURIComponent(name.trim())}&type=${encodeURIComponent(type)}`,
        { cache: "no-store" }
      );
      const json: unknown = await r.json();
      const errMsg =
        json &&
        typeof json === "object" &&
        "error" in json &&
        typeof (json as Record<string, unknown>).error === "string"
          ? ((json as Record<string, unknown>).error as string)
          : null;
      if (!r.ok) throw new Error(errMsg || "DNS query failed");
      setData(json);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "DNS query failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Badge variant="secondary" className="mb-4">
        Tool
      </Badge>
      <h1 className="text-3xl font-semibold tracking-tight">DNS Lookup (DoH)</h1>
      <p className="mt-2 text-muted-foreground">
        Queries Google and Cloudflare DNS-over-HTTPS and shows results side-by-side.
      </p>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Query</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="sm:col-span-2">
              <div className="mb-1 text-muted-foreground">Domain / Hostname</div>
              <input
                className="w-full rounded-md border bg-background px-3 py-2"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="example.com"
                inputMode="url"
              />
            </label>
            <label>
              <div className="mb-1 text-muted-foreground">Type</div>
              <select
                className="w-full rounded-md border bg-background px-3 py-2"
                value={type}
                onChange={(e) => {
                  const v = e.target.value;
                  if ((TYPES as readonly string[]).includes(v)) {
                    setType(v as (typeof TYPES)[number]);
                  }
                }}
              >
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <Button onClick={run} disabled={loading}>
            {loading ? "Querying..." : "Run lookup"}
          </Button>
          {error ? <div className="text-destructive">{error}</div> : null}
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Result</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          {data ? (
            <pre className="max-h-[520px] overflow-auto rounded-md border bg-muted p-3 text-xs">
              {JSON.stringify(data, null, 2)}
            </pre>
          ) : (
            <div className="text-muted-foreground">No result yet.</div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
