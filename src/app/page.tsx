import { headers } from "next/headers";
import { ArrowUpRight, Gauge, ShieldCheck, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IpOverviewCards } from "@/components/ip/IpOverviewCards";
import { getBestEffortIpFromHeaders, isLikelyPublicIp } from "@/lib/net/ip";

export default async function Home() {
  const h = await headers();
  const userAgent = h.get("user-agent");

  const headerIp = getBestEffortIpFromHeaders(h);
  const headerCountryCode =
    h.get("cf-ipcountry") ??
    h.get("x-vercel-ip-country") ??
    h.get("x-country") ??
    null;
  const headerCountryName = (() => {
    if (!headerCountryCode) return null;
    try {
      const dn = new Intl.DisplayNames(["en"], { type: "region" });
      return dn.of(headerCountryCode) ?? null;
    } catch {
      return null;
    }
  })();
  const headerRegion = h.get("x-vercel-ip-country-region") ?? null;
  const headerCity = h.get("x-vercel-ip-city") ?? null;

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-5xl px-6 py-12 sm:px-8">
        <section className="nexo-animate-in rounded-3xl border bg-card p-8 shadow-sm sm:p-10">
          <Badge variant="secondary" className="mb-4">
            IP &amp; Network Checker
          </Badge>
          <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
            Check your IP. Diagnose your network.
          </h1>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            Check your public IP, location hints, and network signals in seconds.
            Run DNS lookups, WebRTC leak checks, RDAP/WHOIS, and quick port
            reachability tests - no signup.
          </p>
          <div
            className="mt-6 flex flex-wrap gap-3 nexo-animate-in"
            style={{ animationDelay: "70ms" }}
          >
            <Button asChild>
              <a href="/tools/ip">
                Open IP Tool
                <ArrowUpRight className="size-4" />
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/tools/webrtc">WebRTC Leak Check</a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/tools/dns">DNS Lookup</a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/tools/ports">Port Scan</a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/tools/whois">WHOIS (RDAP)</a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/api/health">API Health</a>
            </Button>
          </div>
        </section>

        <div className="nexo-animate-in" style={{ animationDelay: "120ms" }}>
          <IpOverviewCards
          initial={{
            ip: headerIp,
            countryCode: headerCountryCode,
            country: headerCountryName,
            region: headerRegion,
            city: headerCity,
            source: headerIp && isLikelyPublicIp(headerIp) ? "request-headers" : null,
          }}
          />
        </div>

        <section className="mt-4 nexo-animate-in" style={{ animationDelay: "170ms" }}>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">User-Agent</CardTitle>
            </CardHeader>
            <CardContent className="break-words text-sm text-muted-foreground">
              {userAgent ?? "Unavailable"}
            </CardContent>
          </Card>
        </section>

        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          <Card className="nexo-animate-in" style={{ animationDelay: "210ms" }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Zap className="size-4" /> Fast by default
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Quick results with sensible caching and timeouts.
            </CardContent>
          </Card>
          <Card className="nexo-animate-in" style={{ animationDelay: "270ms" }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Gauge className="size-4" /> Minimal JS
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Loads only what&apos;s needed - browser-only checks run only when you open them.
            </CardContent>
          </Card>
          <Card className="nexo-animate-in" style={{ animationDelay: "330ms" }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="size-4" /> Privacy-first
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              No accounts. No database. No long-term history.
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
