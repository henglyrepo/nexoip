# NexoIP

DB-less IP and network diagnostics built with Next.js (App Router) + TypeScript.

- Live demo: https://nexoip.vercel.app/
- Support: https://buymeacoffee.com/hengly

## What It Does

- IP lookup with enrichment (country/region/city/ASN/ORG/ISP)
- DNS lookup via DNS-over-HTTPS (Google + Cloudflare)
- WebRTC leak check (ICE candidate inspection)
- WHOIS via RDAP (modern WHOIS-over-HTTP)
- Common-port reachability checks (server-side TCP connect)

## Tools (UI)

- IP Lookup: `/tools/ip`
- DNS Lookup (DoH): `/tools/dns`
- WebRTC Leak Check: `/tools/webrtc`
- WHOIS (RDAP): `/tools/whois`
- Port Scan (Common Ports): `/tools/ports`

## API

- Health: `GET /api/health`
- Best-effort request IP + metadata: `GET /api/ip`
- IP enrichment (public IPs only): `GET /api/ip/enrich?ip=8.8.8.8`
- DNS over HTTPS (Google + Cloudflare): `GET /api/dns?name=example.com&type=A`
- RDAP lookup (public IP or ASCII domain): `GET /api/rdap?q=8.8.8.8`
- Safe request header echo (allowlist): `GET /api/headers`
- Server-side TCP connect checks to your detected public IP: `GET /api/ports`

Examples:

```bash
curl -s http://localhost:3000/api/health | jq
curl -s http://localhost:3000/api/ip | jq
curl -s "http://localhost:3000/api/ip/enrich?ip=8.8.8.8" | jq
curl -s "http://localhost:3000/api/dns?name=example.com&type=A" | jq
curl -s "http://localhost:3000/api/rdap?q=example.com" | jq
```

Note: `GET /api/ports` runs from the server to your detected public IP. NAT/firewalls and hosting provider egress policies can affect results.

## External Services (Public APIs)

This project calls the following public endpoints at runtime:

- Public IP discovery (client fallback): https://api.ipify.org?format=json
- IP enrichment (server):
  - IPinfo Lite (optional token): https://api.ipinfo.io/lite/<ip>?token=...
  - ipwhois.app (no key): https://ipwhois.app/json/<ip>
  - ipapi.is (fallback): https://api.ipapi.is/?q=<ip>
- DNS over HTTPS (server):
  - Google DoH (JSON): https://dns.google/resolve?name=<domain>&type=<type>
  - Cloudflare DoH (JSON): https://cloudflare-dns.com/dns-query?name=<domain>&type=<type>
- RDAP (server):
  - IP: https://rdap.org/ip/<ip>
  - Domain: https://rdap.org/domain/<domain>
- WebRTC STUN server (client): stun:stun.l.google.com:19302

These services have their own terms, rate limits, and availability.

## Privacy

- No database. No accounts.
- `/api/headers` returns an allowlisted subset of request headers and never returns cookies/authorization.

## Environment Variables

- Optional: `IPINFO_TOKEN` (if set, `/api/ip/enrich` will use IPinfo Lite and fill missing fields using ipwhois.app)

## Development

Requirements: Node.js 18+.

```bash
npm install
npm run dev
```

Other commands:

```bash
npm run lint
npm run build
npm run start
```

## Contributing

See `CONTRIBUTING.md`.

## License

MIT - see `LICENSE`.
