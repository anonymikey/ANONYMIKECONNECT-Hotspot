# ANONYMIKECONNECT

ANONYMIKECONNECT is a local-first Windows hotspot manager with a customtkinter desktop UI, voucher-based guest access, and a Flask captive portal.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Windows app: install `anonymikeconnect/requirements.txt`, then run `python -m anonymikeconnect.main` from an elevated PowerShell session.

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `anonymikeconnect/main.py` — desktop UI and page navigation.
- `anonymikeconnect/network.py` — Windows adapters, Hosted Network, ICS, ARP, and firewall helpers.
- `anonymikeconnect/portal.py` — Flask splash page and optional DNS redirector.
- `anonymikeconnect/database.py` — local SQLite voucher and session persistence.
- `anonymikeconnect/README.md` — Windows run and PyInstaller instructions.

## Architecture decisions

- The Windows desktop client is kept as a standalone Python package because it needs local `netsh`, PowerShell COM, ARP, and firewall access that the web artifacts do not provide.
- SQLite is the source of truth for vouchers and portal sessions; the UI and Flask thread share the store through a re-entrant lock.
- Hosted Network and Internet Connection Sharing are attempted through native Windows tools, but command failures are surfaced instead of silently falling back.
- The DNS responder is optional and independent from the Flask portal so port 53 conflicts do not prevent the local splash page from starting.

## Product

The app lets an operator select upstream and broadcast adapters, start a local WPA hotspot, generate time-limited guest vouchers, view ARP-discovered clients, expose a local login splash page, and package the app into a Windows executable.

## User preferences

No additional preferences recorded.

## Gotchas

- The Windows app needs administrator privileges for Hosted Network, ICS, firewall rules, and UDP port 53.
- Many modern Wi-Fi drivers do not support `netsh wlan set hostednetwork`; the app reports this explicitly and documents Windows Mobile Hotspot as the fallback.
- The captive portal should not be treated as a complete security boundary without a properly configured gateway/firewall.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
