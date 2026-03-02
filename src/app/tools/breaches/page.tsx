"use client";

import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CopyButton } from "@/components/ui/copy-button";
import { DataValue } from "@/components/ui/data-value";
import { Skeleton } from "@/components/ui/skeleton";

type Breach = {
  Name?: string;
  Title?: string;
  Domain?: string;
  BreachDate?: string;
  AddedDate?: string;
  PwnCount?: number;
  DataClasses?: string[];
  IsVerified?: boolean;
  IsSensitive?: boolean;
  IsSpamList?: boolean;
  IsMalware?: boolean;
  IsSubscriptionFree?: boolean;
};

type ApiResponse =
  | { domain: string; breaches: Breach[]; timestamp: string; source: string }
  | { error: string };

function asBreaches(data: unknown): Breach[] {
  return Array.isArray(data) ? (data as Breach[]) : [];
}

function isErrorResponse(v: ApiResponse): v is { error: string } {
  return !!v && typeof v === "object" && "error" in v;
}

export default function BreachesToolPage() {
  const [domain, setDomain] = useState("example.com");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [breaches, setBreaches] = useState<Breach[] | null>(null);
  const [raw, setRaw] = useState<unknown>(null);

  const count = breaches?.length ?? 0;

  const sorted = useMemo(() => {
    const b = breaches ? breaches.slice() : [];
    b.sort((a, z) => String(a.BreachDate || "").localeCompare(String(z.BreachDate || "")));
    return b;
  }, [breaches]);

  async function run() {
    setLoading(true);
    setError(null);
    setBreaches(null);
    setRaw(null);
    try {
      const r = await fetch(`/api/breaches?domain=${encodeURIComponent(domain.trim())}`, {
        cache: "no-store",
      });
      const json = (await r.json()) as ApiResponse;
      if (!r.ok || isErrorResponse(json)) {
        const msg = isErrorResponse(json) && typeof json.error === "string" ? json.error : "Lookup failed";
        throw new Error(msg);
      }
      setRaw(json);
      setBreaches(asBreaches(json.breaches));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Lookup failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Badge variant="secondary" className="mb-4">
        Tool
      </Badge>
      <h1 className="text-3xl font-semibold tracking-tight nexo-animate-in">
        Domain Breach History
      </h1>
      <p className="mt-2 text-muted-foreground">
        Checks whether a website domain appears in public breach records.
      </p>

      <Card className="mt-6 nexo-animate-in" style={{ animationDelay: "90ms" }}>
        <CardHeader>
          <CardTitle>Lookup</CardTitle>
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
              {loading ? "Checking..." : "Check domain"}
            </Button>
          </div>
          {error ? <div className="text-destructive">{error}</div> : null}
        </CardContent>
      </Card>

      <Card className="mt-4 nexo-animate-in" style={{ animationDelay: "140ms" }}>
        <CardHeader>
          <CardTitle>Result</CardTitle>
          {raw ? (
            <CardAction>
              <CopyButton text={JSON.stringify(raw, null, 2)} label="Copy JSON" />
            </CardAction>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {loading ? <Skeleton className="h-5 w-48" /> : null}
          {breaches === null && !loading ? (
            <div className="text-muted-foreground">No lookup yet.</div>
          ) : null}

          {breaches && !loading ? (
            <>
              <div className="text-muted-foreground">
                Found <span className="font-medium">{count}</span> breach record(s) for{" "}
                <DataValue value={domain.trim().toLowerCase()} copyText={domain.trim().toLowerCase()} monospace />.
              </div>

              {sorted.length === 0 ? (
                <div className="pt-1">No public breach records found for this domain.</div>
              ) : (
                <div className="space-y-2">
                  {sorted.map((b) => {
                    const title = b.Title || b.Name || "Unknown";
                    const date = b.BreachDate || "-";
                    const pwn = typeof b.PwnCount === "number" ? b.PwnCount : null;
                    const classes = Array.isArray(b.DataClasses) ? b.DataClasses.slice(0, 6) : [];
                    return (
                      <div key={`${b.Name || title}-${date}`} className="rounded-md border bg-muted/30 p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="font-medium">{title}</div>
                          <div className="text-xs text-muted-foreground">
                            <DataValue value={date} copyText={date} monospace />
                          </div>
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {pwn !== null ? (
                            <span>
                              Accounts: <span className="font-medium">{pwn.toLocaleString()}</span>
                            </span>
                          ) : null}
                          {classes.length ? (
                            <span>
                              {pwn !== null ? " · " : ""}Data: {classes.join(", ")}
                              {Array.isArray(b.DataClasses) && b.DataClasses.length > classes.length
                                ? "…"
                                : ""}
                            </span>
                          ) : null}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs">
                          {b.IsVerified ? (
                            <span className="rounded-full border bg-background px-2 py-0.5">Verified</span>
                          ) : (
                            <span className="rounded-full border bg-background px-2 py-0.5">Unverified</span>
                          )}
                          {b.IsSensitive ? (
                            <span className="rounded-full border bg-background px-2 py-0.5">Sensitive</span>
                          ) : null}
                          {b.IsSpamList ? (
                            <span className="rounded-full border bg-background px-2 py-0.5">Spam list</span>
                          ) : null}
                          {b.IsMalware ? (
                            <span className="rounded-full border bg-background px-2 py-0.5">Malware</span>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : null}
        </CardContent>
      </Card>

      <div className="mt-4 text-xs text-muted-foreground">
        Data source: <a className="underline" href="https://haveibeenpwned.com/" target="_blank" rel="noreferrer">Have I Been Pwned</a>
      </div>
    </main>
  );
}
