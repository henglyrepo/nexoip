"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CopyButton } from "@/components/ui/copy-button";
import { DataValue } from "@/components/ui/data-value";

type RdapResponse =
  | {
      query: string;
      sourceUrl: string;
      data: unknown;
      timestamp: string;
    }
  | { error: string };

export default function WhoisToolPage() {
  const [q, setQ] = useState("8.8.8.8");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<RdapResponse | null>(null);

  async function run() {
    setLoading(true);
    setData(null);
    try {
      const r = await fetch(`/api/rdap?q=${encodeURIComponent(q.trim())}`, {
        cache: "no-store",
      });
      const json = (await r.json()) as RdapResponse;
      setData(json);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Badge variant="secondary" className="mb-4">
        Tool
      </Badge>
      <h1 className="text-3xl font-semibold tracking-tight nexo-animate-in">WHOIS (RDAP)</h1>
      <p className="mt-2 text-muted-foreground">
        Uses RDAP (modern WHOIS-over-HTTP). Supports public IPs and ASCII domains.
      </p>

      <Card className="mt-6 nexo-animate-in" style={{ animationDelay: "90ms" }}>
        <CardHeader>
          <CardTitle>Lookup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <label>
            <div className="mb-1 text-muted-foreground">IP or Domain</div>
            <input
              className="w-full rounded-md border bg-background px-3 py-2"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="8.8.8.8 or example.com"
            />
          </label>
          <Button onClick={run} disabled={loading}>
            {loading ? "Looking up..." : "Run lookup"}
          </Button>
        </CardContent>
      </Card>

      <Card className="mt-4 nexo-animate-in" style={{ animationDelay: "140ms" }}>
        <CardHeader>
          <CardTitle>Result</CardTitle>
          {data && !("error" in data) ? (
            <CardAction>
              <CopyButton text={JSON.stringify(data.data, null, 2)} label="Copy JSON" />
            </CardAction>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {!data ? (
            <div className="text-muted-foreground">No result yet.</div>
          ) : "error" in data ? (
            <div className="text-destructive">{data.error}</div>
          ) : (
            <>
              <div>
                <span className="font-medium">Source:</span>{" "}
                <DataValue value={data.sourceUrl} copyText={data.sourceUrl} monospace />
              </div>
              <pre className="max-h-[520px] overflow-auto rounded-md border bg-muted p-3 text-xs">
                {JSON.stringify(data.data, null, 2)}
              </pre>
            </>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
