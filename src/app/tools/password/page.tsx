"use client";

import { useMemo, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CopyButton } from "@/components/ui/copy-button";
import { DataValue } from "@/components/ui/data-value";
import { Skeleton } from "@/components/ui/skeleton";

type Result =
  | {
      ok: true;
      sha1: string;
      prefix: string;
      count: number;
      padded: boolean;
    }
  | { ok: false; error: string };

function toHexUpper(bytes: ArrayBuffer): string {
  const a = new Uint8Array(bytes);
  let out = "";
  for (const b of a) out += b.toString(16).padStart(2, "0");
  return out.toUpperCase();
}

async function sha1Upper(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-1", data);
  return toHexUpper(digest);
}

function parseRangeText(text: string): Map<string, number> {
  const map = new Map<string, number>();
  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    const t = line.trim();
    if (!t) continue;
    const idx = t.indexOf(":");
    if (idx === -1) continue;
    const suffix = t.slice(0, idx).trim().toUpperCase();
    const countRaw = t.slice(idx + 1).trim();
    const count = Number.parseInt(countRaw, 10);
    if (!suffix || !Number.isFinite(count)) continue;
    map.set(suffix, count);
  }
  return map;
}

export default function PasswordToolPage() {
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  const canRun = password.trim().length > 0 && !loading;

  const severity = useMemo(() => {
    if (!result || !result.ok) return null;
    if (result.count === 0) return "good";
    if (result.count < 100) return "warn";
    return "bad";
  }, [result]);

  async function run() {
    const p = password;
    if (!p.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      if (typeof crypto === "undefined" || !crypto.subtle) {
        throw new Error("Web Crypto not available");
      }
      const sha1 = await sha1Upper(p);
      const prefix = sha1.slice(0, 5);
      const suffix = sha1.slice(5);

      const r = await fetch(`/api/pwned-password/range?prefix=${encodeURIComponent(prefix)}`);
      if (!r.ok) {
        const j = (await r.json().catch(() => null)) as unknown;
        const rec = j && typeof j === "object" ? (j as Record<string, unknown>) : null;
        const err = rec && typeof rec.error === "string" ? rec.error : "Request failed";
        throw new Error(err);
      }
      const text = await r.text();
      const map = parseRangeText(text);
      const count = map.get(suffix) ?? 0;
      const padded = Array.from(map.values()).some((v) => v === 0);

      setResult({ ok: true, sha1, prefix, count, padded });
    } catch (e: unknown) {
      setResult({ ok: false, error: e instanceof Error ? e.message : "Check failed" });
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
        Password Exposure Check
      </h1>
      <p className="mt-2 text-muted-foreground">
        Checks whether a password appears in known breach corpuses using a privacy-preserving hash
        range query. Your password never leaves your device.
      </p>

      <Card className="mt-6 nexo-animate-in" style={{ animationDelay: "90ms" }}>
        <CardHeader>
          <CardTitle>Check</CardTitle>
          <CardAction>
            <Button variant="outline" size="sm" onClick={() => setPassword("")}>
              Clear
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <label>
            <div className="mb-1 text-muted-foreground">Password</div>
            <div className="flex items-stretch gap-2">
              <input
                className="w-full rounded-md border bg-background px-3 py-2 font-mono"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type={show ? "text" : "password"}
                placeholder="Enter a password"
                autoComplete="off"
                spellCheck={false}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => setShow((s) => !s)}
                aria-label={show ? "Hide password" : "Show password"}
              >
                {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </Button>
            </div>
          </label>
          <div className="flex flex-wrap gap-3">
            <Button onClick={run} disabled={!canRun}>
              {loading ? "Checking..." : "Check password"}
            </Button>
            <div className="text-xs text-muted-foreground">
              Tip: avoid checking high-value passwords on shared devices.
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-4 nexo-animate-in" style={{ animationDelay: "140ms" }}>
        <CardHeader>
          <CardTitle>Result</CardTitle>
          {result && result.ok ? (
            <CardAction>
              <CopyButton text={JSON.stringify(result, null, 2)} label="Copy JSON" />
            </CardAction>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {loading ? <Skeleton className="h-5 w-56" /> : null}
          {!result ? (
            <div className="text-muted-foreground">No check yet.</div>
          ) : result.ok ? (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">Exposure:</span>
                <span
                  className={
                    severity === "good"
                      ? "text-emerald-600"
                      : severity === "warn"
                        ? "text-amber-600"
                        : "text-destructive"
                  }
                >
                  {result.count === 0
                    ? "Not found"
                    : `Seen ${result.count.toLocaleString()} times`}
                </span>
              </div>

              <div className="text-muted-foreground">
                Range query prefix: <DataValue value={result.prefix} copyText={result.prefix} monospace />
              </div>

              <div className="text-muted-foreground">
                SHA-1: <DataValue value={result.sha1} copyText={result.sha1} monospace />
              </div>

              <div className="text-muted-foreground">
                Note: results are based on a k-anonymity range query{result.padded ? " (padded)" : ""}.
              </div>

              {result.count > 0 ? (
                <div className="pt-1">
                  If you use this password anywhere, change it and enable MFA. Avoid reusing passwords.
                </div>
              ) : (
                <div className="pt-1">
                  Good sign, but still use a password manager and avoid reuse.
                </div>
              )}
            </>
          ) : (
            <div className="text-destructive">{result.error}</div>
          )}
        </CardContent>
      </Card>

      <div className="mt-4 text-xs text-muted-foreground">
        Data source: Pwned Passwords (Have I Been Pwned)
      </div>
    </main>
  );
}
