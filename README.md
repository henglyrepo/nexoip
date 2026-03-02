# NexoIP (NEXO)

DB-less network diagnostics and utility tools built with Next.js (App Router) + TypeScript.

## Tools

- IP Lookup: `/tools/ip`
- WebRTC Leak Check: `/tools/webrtc`
- DNS Lookup (DoH): `/tools/dns`
- Port Scan (common ports): `/tools/ports`
- WHOIS (RDAP): `/tools/whois`

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

## Environment

- Optional: `IPINFO_TOKEN` (if set, `/api/ip/enrich` will use IPinfo Lite; otherwise it falls back to ipwho.is)

## Development

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

## Notes

- No database and no user accounts.
- Privacy: header debug endpoint is allowlisted (never echoes cookies/authorization).
