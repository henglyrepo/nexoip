# Project: NEXO
DB-less Next.js plan for fast diagnostics and utility tooling.

Updated: 2026-03-02

---

## 1) Goals
- Fast Next.js site for diagnostics/utilities/landing pages.
- No database and no user account requirement.
- Lean infra: CDN + serverless/edge route handlers.

Non-goals:
- No long-term user history.
- No persistent personal profile storage.

---

## 2) Stack (DB-less)
### Core
- Next.js `16.1.6` (App Router)
- React `19.2.3`
- TypeScript
- Tailwind CSS v4
- `shadcn/ui` only for UI components and theme tokens

### Runtime / Hosting
Pick one:
- Vercel (tightest Next.js integration)
- Cloudflare Pages + Functions (edge-first)

### Storage policy
- No relational/NoSQL database.
- Stateless route handlers first.
- Optional short cache only if required:
  - CDN cache headers
  - Platform edge cache
  - KV cache (strictly optional)

---

## 3) App Architecture
### Rendering
- Marketing pages: SSG where possible.
- Tool pages: Server Components first.
- Client Components only for browser-only APIs (WebRTC, canvas/audio fingerprint checks, device details).

### Suggested file layout
```
src/app/
  page.tsx
  tools/
    ip/page.tsx
    dns/page.tsx
    webrtc/page.tsx
    fingerprint/page.tsx
  api/
    ip/route.ts
    headers/route.ts
    whois/route.ts
    health/route.ts
src/components/ui/...
src/lib/net/...
src/lib/validators/...
```

---

## 4) Core Features Without a DB
### Server-side
- Best-effort public IP from trusted forwarding headers.
- Header echo/debug endpoint (filtered, never include cookies).
- User-Agent parsing.
- Optional IP enrichment (geo/asn/org) via external APIs.

### Client-side
- Timezone, locale, screen, hardware hints.
- WebRTC candidate leak checks.
- Basic fingerprint surface reporting (transparent UX, user education first).

---

## 5) Public API Research (Free Tier / Public Access)
Use one primary provider per endpoint and keep a fallback chain.

### A) Network / IP / DNS APIs (best fit for NEXO)
1. `ipify`
- URL: https://www.ipify.org/
- Use: Get client public IPv4/IPv6 quickly.
- Notes: Simple unauth endpoint for IP discovery.

2. `ipapi.is`
- URL: https://ipapi.is/
- Use: IP geolocation + ASN + hosting/proxy signals.
- Notes: Free tier available.

3. `ipwho.is`
- URL: https://ipwhois.io/
- Use: Geolocation and ASN-style enrichment.
- Notes: Free endpoint without signup.

4. `IPinfo`
- URL: https://ipinfo.io/developers
- Use: Geo + ASN + org enrichment; optional privacy/proxy signals depending on plan.
- Notes:
  - Official OpenAPI spec: https://ipinfo.io/developers/openapi.yaml
  - LLM docs:
    - https://ipinfo.io/developers/llms.txt
    - https://ipinfo.io/developers/llms-full.txt
  - SDKs: https://ipinfo.io/developers/libraries
  - API base: https://api.ipinfo.io
  - Lite (free tier; country/continent + basic ASN):
    - https://api.ipinfo.io/lite/me?token=$TOKEN
    - https://api.ipinfo.io/lite/8.8.8.8?token=$TOKEN
  - Core (geo + ASN + network flags):
    - https://api.ipinfo.io/lookup/me?token=$TOKEN
    - https://api.ipinfo.io/lookup/8.8.8.8?token=$TOKEN
  - ASN API (Core+): https://ipinfo.io/AS7922/json?token=$TOKEN
  - IP ranges (Enterprise): https://ipinfo.io/ranges/nytimes.com?token=$TOKEN
  - Hosted domains / reverse IP (Enterprise): https://ipinfo.io/domains/198.35.26.96?token=$TOKEN&page=0&limit=1000
  - IP WHOIS (Enterprise): https://ipinfo.io/developers/whois
  - Legacy JSON endpoint (still documented): https://ipinfo.io/8.8.8.8/json?token=$TOKEN
  - Legal:
    - Terms: https://ipinfo.io/terms-of-service
    - Acceptable Use: https://ipinfo.io/acceptable-use-policy

5. `IP2Location.io`
- URL: https://www.ip2location.io/
- Use: Geolocation and proxy/VPN style metadata.
- Notes: Free API key tier available.

6. `RDAP` (IANA bootstrap + RIR servers)
- URL: https://www.iana.org/assignments/rdap-dns/rdap-dns.xhtml
- Use: WHOIS-like registration data via modern HTTP API.
- Notes: Better than raw WHOIS scraping.

7. `RIPEstat Data API`
- URL: https://stat.ripe.net/docs/data-api
- Use: ASN, prefix, routing and operational network data.
- Notes: Strong for BGP/routing context.

8. `Hurricane Electric BGP Toolkit`
- URL: https://bgp.he.net/
- Use: ASN and prefix intelligence.
- Notes: Helpful as secondary human-validation source.

9. `Cloudflare DNS over HTTPS`
- URL: https://developers.cloudflare.com/1.1.1.1/encryption/dns-over-https/
- Use: DNS test queries for resolver checks.
- Notes: Useful for DNS tool modules.

10. `Google Public DNS JSON API`
- URL: https://developers.google.com/speed/public-dns/docs/doh/json
- Use: DNS query diagnostics over HTTPS.
- Notes: Good alternative resolver for comparison.

11. `Whoer.net` (reference tools; APIs appear internal/undocumented)
- URL: https://whoer.net/
- Use: Human-facing reference for “what is my IP”, DNS leak test, and port scan UX.
- Notes:
  - Privacy Policy claims “public APIs and embeddable widgets”, but there is no stable, documented API contract (auth/limits/terms) published.
  - Robots disallows crawling internal endpoints: https://whoer.net/robots.txt
  - Observed internal endpoints (do not rely on for production):
    - https://whoer.net/en/main/api/ip
    - https://whoer.net/ports
    - https://whoer.net/dns?domain=...
  - Get written permission / official API details first: https://whoer.net/contacts (who@whoer.net)

### B) Optional Utility APIs (for extra tool pages)
1. `Open-Meteo`
- URL: https://open-meteo.com/
- Use: Weather/timezone utility examples.
- Notes: Free, no API key for core endpoints.

2. `Nominatim (OpenStreetMap)`
- URL: https://nominatim.org/release-docs/develop/api/Overview/
- Use: Geocoding/reverse geocoding utility tool.
- Notes: Respect usage policy and rate limits.

3. `CoinGecko API`
- URL: https://docs.coingecko.com/
- Use: Crypto market snapshots.
- Notes: Free/demo access is available.

4. `Frankfurter`
- URL: https://www.frankfurter.app/
- Use: Fiat exchange rates.
- Notes: Simple public endpoint design.

5. `Open Library API`
- URL: https://openlibrary.org/developers/api
- Use: Book lookup/search utilities.
- Notes: Fully public endpoints.

6. `MediaWiki API`
- URL: https://www.mediawiki.org/wiki/API:Main_page
- Use: Wikipedia-style content/search examples.
- Notes: Mature public API ecosystem.

7. `GitHub REST API`
- URL: https://docs.github.com/en/rest
- Use: Repo/user/activity utility cards.
- Notes: Public data available with rate limits.

8. `PokeAPI`
- URL: https://pokeapi.co/docs/v2
- Use: Demo/testing data source.
- Notes: Free and widely used for prototyping.

9. `TheCatAPI`
- URL: https://thecatapi.com/
- Use: Demo/image randomizer examples.
- Notes: Free plan available.

10. `NASA APIs`
- URL: https://api.nasa.gov/
- Use: Space data demos (APOD, etc.).
- Notes: Free with API key (`DEMO_KEY` for low-volume testing).

---

## 6) Recommended Normalized Types
Create one normalized contract to avoid vendor lock-in.

```ts
export type NormalizedIpInfo = {
  ip: string | null;
  countryCode?: string;
  country?: string;
  region?: string;
  city?: string;
  asn?: string;
  org?: string;
  isProxy?: boolean;
  isHosting?: boolean;
  source: string;
  fetchedAt: string;
};
```

---

## 7) Route Contracts (Current)
### `/api/health`
- Returns service status and timestamp.

### `/api/ip`
- Returns best-effort IP + user-agent + timestamp.
- Future: optional enrichment with one provider adapter.

### `/api/headers`
- Returns an allowlisted subset of safe request headers.

---

## 8) Security / Privacy Guardrails
- Never echo cookies or authorization headers.
- Validate any user-supplied domain/IP input with `zod`.
- Block private/reserved ranges when endpoint expects public IP.
- Add route-level timeouts for external API calls.
- Add clear "What we collect" and "No long-term storage" copy.

---

## 9) Performance Rules
- Server Components by default.
- Keep client islands small and route-scoped.
- Use short cache TTL for enrichment endpoints (`60-300s`).
- Lazy-load heavy browser diagnostics.

---

## 10) MVP Checklist
1. Next.js + TypeScript + shadcn setup.
2. Landing page + tool index.
3. `/api/health`, `/api/ip`, `/api/headers`.
4. Add provider adapters in `src/lib/net/providers.ts`.
5. Add `tools/webrtc`, `tools/dns`, `tools/fingerprint`.
6. Add privacy + terms pages.
7. Deploy and verify edge headers.
