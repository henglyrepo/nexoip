"use client";

import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CopyButton } from "@/components/ui/copy-button";
import { DataValue } from "@/components/ui/data-value";
import { Skeleton } from "@/components/ui/skeleton";

type CheckStatus = "pass" | "warn" | "fail";

type Check = {
  status: CheckStatus;
  records: string[];
  detected?: string | null;
};

type ApiOk = {
  domain: string;
  checks: {
    mx: Check;
    spf: Check;
    dmarc: Check;
    mtaSts: Check;
    tlsRpt: Check;
    bimi: Check;
  };
  timestamp: string;
};

type ApiResponse = ApiOk | { error: string };

function isErrorResponse(v: ApiResponse): v is { error: string } {
  return !!v && typeof v === "object" && "error" in v;
}

function statusClass(s: CheckStatus): string {
  if (s === "pass") return "text-emerald-600";
  if (s === "warn") return "text-amber-600";
  return "text-destructive";
}

function statusLabel(s: CheckStatus): string {
  if (s === "pass") return "Pass";
  if (s === "warn") return "Warn";
  return "Fail";
}

function Records({ records }: { records: string[] }) {
  if (!records.length) return <div className="text-muted-foreground">No records found.</div>;
  return (
    <div className="space-y-1">
      {records.map((r, i) => (
        <div key={`${r}-${i}`}>
          <DataValue value={r} copyText={r} monospace />
        </div>
      ))}
    </div>
  );
}

function CheckCard({
  title,
  help,
  check,
}: {
  title: string;
  help: string;
  check: Check;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-3">
          <span>{title}</span>
          <span className={statusClass(check.status)}>{statusLabel(check.status)}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="text-muted-foreground">{help}</div>
        {typeof check.detected === "string" && check.detected ? (
          <div>
            <span className="font-medium">Detected:</span>{" "}
            <DataValue value={check.detected} copyText={check.detected} monospace />
          </div>
        ) : null}
        <Records records={check.records} />
      </CardContent>
    </Card>
  );
}

export default function EmailSecurityToolPage() {
  const [domain, setDomain] = useState("example.com");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ApiOk | null>(null);

  const rawJson = useMemo(() => (data ? JSON.stringify(data, null, 2) : null), [data]);

  async function run() {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const r = await fetch(`/api/email-security?domain=${encodeURIComponent(domain.trim())}`, {
        cache: "no-store",
      });
      const json = (await r.json()) as ApiResponse;
      if (!r.ok || isErrorResponse(json)) {
        const msg = isErrorResponse(json) && typeof json.error === "string" ? json.error : "Lookup failed";
        throw new Error(msg);
      }
      setData(json);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Lookup failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <Badge variant="secondary" className="mb-4">
        Tool
      </Badge>
      <h1 className="text-3xl font-semibold tracking-tight nexo-animate-in">
        Email Domain Security
      </h1>
      <p className="mt-2 text-muted-foreground">
        Checks DNS records commonly used to protect email sending and transport security.
      </p>

      <Card className="mt-6 nexo-animate-in" style={{ animationDelay: "90ms" }}>
        <CardHeader>
          <CardTitle>Domain</CardTitle>
          {rawJson ? (
            <CardAction>
              <CopyButton text={rawJson} label="Copy JSON" />
            </CardAction>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <label>
            <div className="mb-1 text-muted-foreground">Domain</div>
            <input
              className="w-full rounded-md border bg-background px-3 py-2 font-mono"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="example.com"
              inputMode="url"
              spellCheck={false}
            />
          </label>
          <div className="flex flex-wrap gap-3">
            <Button onClick={run} disabled={loading}>
              {loading ? "Checking..." : "Run checks"}
            </Button>
          </div>
          {error ? <div className="text-destructive">{error}</div> : null}
        </CardContent>
      </Card>

      {loading ? (
        <div className="mt-4">
          <Skeleton className="h-5 w-56" />
        </div>
      ) : null}

      {data ? (
        <section className="mt-4 grid gap-4 md:grid-cols-2">
          <CheckCard
            title="MX"
            help="Mail exchangers (where inbound mail is delivered)."
            check={data.checks.mx}
          />
          <CheckCard
            title="SPF"
            help="Sender Policy Framework (authorized senders)."
            check={data.checks.spf}
          />
          <CheckCard
            title="DMARC"
            help="Authentication policy and reporting for SPF/DKIM."
            check={data.checks.dmarc}
          />
          <CheckCard
            title="MTA-STS"
            help="Policy signal for enforcing TLS to receiving MTAs."
            check={data.checks.mtaSts}
          />
          <CheckCard
            title="TLS-RPT"
            help="TLS reporting endpoint for failed deliveries and TLS issues."
            check={data.checks.tlsRpt}
          />
          <CheckCard
            title="BIMI"
            help="Brand Indicators for Message Identification (optional)."
            check={data.checks.bimi}
          />
        </section>
      ) : null}
    </main>
  );
}
