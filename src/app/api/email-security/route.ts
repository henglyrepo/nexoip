import { NextRequest, NextResponse } from "next/server";

type DnsJsonAnswer = { name?: string; type?: number; TTL?: number; data?: string };
type DnsJson = { Answer?: DnsJsonAnswer[] };

function isValidAsciiHostname(name: string): boolean {
  const s = name.trim().toLowerCase();
  if (!s || s.length > 253) return false;
  if (s.includes("..")) return false;
  const labels = s.split(".").filter(Boolean);
  if (labels.length < 2) return false;
  for (const label of labels) {
    if (label.length < 1 || label.length > 63) return false;
    if (!/^[a-z0-9-]+$/.test(label)) return false;
    if (label.startsWith("-") || label.endsWith("-")) return false;
  }
  return true;
}

function unquoteTxt(s: string): string {
  const t = s.trim();
  if (t.startsWith('"') && t.endsWith('"') && t.length >= 2) {
    return t.slice(1, -1);
  }
  return t;
}

async function dohJson(provider: "google" | "cloudflare", name: string, type: string) {
  const url =
    provider === "google"
      ? new URL("https://dns.google/resolve")
      : new URL("https://cloudflare-dns.com/dns-query");
  url.searchParams.set("name", name);
  url.searchParams.set("type", type);
  const r = await fetch(url.toString(), {
    cache: "no-store",
    headers:
      provider === "cloudflare"
        ? { accept: "application/dns-json" }
        : { accept: "application/json" },
  });
  if (!r.ok) throw new Error(`${provider}_doh_failed`);
  return (await r.json()) as DnsJson;
}

async function resolveRecords(name: string, type: string): Promise<string[]> {
  const [g, c] = await Promise.allSettled([
    dohJson("google", name, type),
    dohJson("cloudflare", name, type),
  ]);

  const answers: DnsJsonAnswer[] = [];
  if (g.status === "fulfilled" && Array.isArray(g.value.Answer)) answers.push(...g.value.Answer);
  if (c.status === "fulfilled" && Array.isArray(c.value.Answer)) answers.push(...c.value.Answer);

  const out: string[] = [];
  const seen = new Set<string>();
  for (const a of answers) {
    const d = typeof a.data === "string" ? a.data : "";
    const v = d ? unquoteTxt(d) : "";
    if (!v) continue;
    if (seen.has(v)) continue;
    seen.add(v);
    out.push(v);
  }
  return out;
}

function verdictForTxt(records: string[], predicate: (v: string) => boolean) {
  if (records.length === 0) return { status: "fail" as const, match: null as string | null };
  const hit = records.find(predicate) ?? null;
  return hit
    ? { status: "pass" as const, match: hit }
    : { status: "warn" as const, match: null as string | null };
}

export async function GET(req: NextRequest) {
  const domain = (req.nextUrl.searchParams.get("domain") || "").trim();
  if (!isValidAsciiHostname(domain)) {
    return NextResponse.json(
      { error: "Invalid domain (ASCII only)." },
      { status: 400, headers: { "cache-control": "no-store" } }
    );
  }

  try {
    const [mx, txtRoot, txtDmarc, txtMtaSts, txtTlsRpt, txtBimi] = await Promise.all([
      resolveRecords(domain, "MX"),
      resolveRecords(domain, "TXT"),
      resolveRecords(`_dmarc.${domain}`, "TXT"),
      resolveRecords(`_mta-sts.${domain}`, "TXT"),
      resolveRecords(`_smtp._tls.${domain}`, "TXT"),
      resolveRecords(`default._bimi.${domain}`, "TXT"),
    ]);

    const spf = verdictForTxt(txtRoot, (v) => /^v=spf1\b/i.test(v));
    const dmarc = verdictForTxt(txtDmarc, (v) => /^v=dmarc1\b/i.test(v));
    const mtaSts = verdictForTxt(txtMtaSts, (v) => /^v=stsv1\b/i.test(v));
    const tlsRpt = verdictForTxt(txtTlsRpt, (v) => /^v=tlsrptv1\b/i.test(v));
    const bimi = verdictForTxt(txtBimi, (v) => /^v=bimi1\b/i.test(v));

    return NextResponse.json(
      {
        domain,
        checks: {
          mx: {
            status: mx.length ? "pass" : "fail",
            records: mx,
          },
          spf: {
            status: spf.status,
            records: txtRoot,
            detected: spf.match,
          },
          dmarc: {
            status: dmarc.status,
            records: txtDmarc,
            detected: dmarc.match,
          },
          mtaSts: {
            status: mtaSts.status,
            records: txtMtaSts,
            detected: mtaSts.match,
          },
          tlsRpt: {
            status: tlsRpt.status,
            records: txtTlsRpt,
            detected: tlsRpt.match,
          },
          bimi: {
            status: bimi.status,
            records: txtBimi,
            detected: bimi.match,
          },
        },
        timestamp: new Date().toISOString(),
      },
      { status: 200, headers: { "cache-control": "no-store" } }
    );
  } catch {
    return NextResponse.json(
      { error: "DNS lookup failed" },
      { status: 502, headers: { "cache-control": "no-store" } }
    );
  }
}
