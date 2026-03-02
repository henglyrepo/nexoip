# Contributing

Thanks for contributing to NexoIP.

## Development

Requirements: Node.js 18+.

```bash
npm install
npm run dev
```

Before opening a PR:

```bash
npm run lint
npm run build
```

## Project Structure

- Tool pages (UI): `src/app/tools/<tool>/page.tsx`
- API routes: `src/app/api/<name>/route.ts`
- Shared utilities: `src/lib/**`
- UI components: `src/components/**`

## Guidelines

- No database and no persistent user data.
- Validate user-supplied inputs (ip/domain/url). Reject private/reserved IPs where a public IP is required.
- Do not echo secrets. Avoid returning cookies/authorization headers in debug endpoints.
- Prefer documented public APIs and normalize responses behind our server endpoints.

## Pull Requests

- Keep PRs focused and small when possible.
- Include a short description of what changed and why.
- If you add a new tool, update `README.md` with the new route and API.
