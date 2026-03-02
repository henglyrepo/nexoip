"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type PortsResponse =
  | {
      ip: string;
      portsScanned: number[];
      opened: number[];
      results: Array<{ port: number; open: boolean; error?: string }>;
      note: string;
      timestamp: string;
    }
  | { error: string };

export default function PortsToolPage() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PortsResponse | null>(null);

  async function run() {
    setLoading(true);
    setData(null);
    try {
      const r = await fetch("/api/ports", { cache: "no-store" });
      const json = (await r.json()) as PortsResponse;
      setData(json);
    } finally {
      setLoading(false);
    }
  }

  const ok = data && !("error" in data);

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Badge variant="secondary" className="mb-4">
        Tool
      </Badge>
      <h1 className="text-3xl font-semibold tracking-tight">Port Scan (Common Ports)</h1>
      <p className="mt-2 text-muted-foreground">
        Runs a TCP connect check from our server to your public IP on a small list of common ports.
      </p>

      <div className="mt-6">
        <Button onClick={run} disabled={loading}>
          {loading ? "Scanning..." : "Start scan"}
        </Button>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Result</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {!data ? (
            <div className="text-muted-foreground">No scan yet.</div>
          ) : "error" in data ? (
            <div className="text-destructive">{data.error}</div>
          ) : (
            <>
              <div>
                <span className="font-medium">Target IP:</span> {data.ip}
              </div>
              <div>
                <span className="font-medium">Open ports:</span>{" "}
                {data.opened.length ? data.opened.join(", ") : "None detected"}
              </div>
              <div className="text-muted-foreground">{data.note}</div>
              <pre className="max-h-[520px] overflow-auto rounded-md border bg-muted p-3 text-xs">
                {JSON.stringify(data.results, null, 2)}
              </pre>
            </>
          )}

          {ok ? (
            <div className="text-muted-foreground">
              Tip: If you’re behind NAT, your router/firewall policy controls what’s reachable.
            </div>
          ) : null}
        </CardContent>
      </Card>
    </main>
  );
}
