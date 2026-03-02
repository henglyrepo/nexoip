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
        <section className="rounded-3xl border bg-card p-8 shadow-sm sm:p-10">
          <Badge variant="secondary" className="mb-4">
            Next.js 16 + shadcn/ui
          </Badge>
          <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
            NEXO tools with lightweight, fast UX
          </h1>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            DB-less diagnostics platform. Server Components first, tiny client
            islands only when browser APIs are required.
          </p>
           <div className="mt-6 flex flex-wrap gap-3">
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

        <section className="mt-4">
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Zap className="size-4" /> Fast by default
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Static pages + cached route handlers with short TTL.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Gauge className="size-4" /> Minimal JS
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Client components only for WebRTC, fingerprint, and device checks.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="size-4" /> Privacy-first
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              No database, no accounts, no long-term user history.
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
