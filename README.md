# Onyx Paper Trading

A paper-trading web app for prediction markets. Pulls live market data from the [Onyx Predictions API](https://predictions.dev-onyxodds.com/docs), lets authenticated users place simulated YES/NO orders at current prices, and tracks each user's balance, positions, and unrealized P&L. No real orders ever hit the upstream API.

## Local Setup

**Prerequisites:** Node 22, pnpm 11, a [Neon](https://neon.tech) Postgres database

```bash
git clone https://github.com/michikogo/paper-trading.git
cd paper-trading
pnpm install
```

Create `.env.local`:

```
DATABASE_URL=your_neon_connection_string
NEXTAUTH_SECRET=any_random_secret
NEXTAUTH_URL=http://localhost:3000
ONYX_API_BASE=https://predictions.dev-onyxodds.com
```

Push the schema and start the dev server:

```bash
pnpm drizzle-kit push
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 16 (App Router) | Server components + API routes in one repo |
| Auth | NextAuth.js v5 (Credentials) | Simple email/password with JWT sessions |
| ORM | Drizzle + Neon HTTP | Serverless-compatible, no connection pooling needed |
| UI | Material UI v9 | Full component library, fast to build with |
| Data fetching | SWR | Client-side polling for live prices and balance |
| Deploy | Vercel | Zero-config Next.js deploys |

## Key Decisions

**P&L computed at render time.** Portfolio is a server component that hits the Onyx API for current prices on each position. No WebSocket, no background job — users check their portfolio occasionally and a full server render is fast enough.

**No database transactions.** The Neon HTTP driver doesn't support persistent connections, so `db.transaction()` isn't available. Order placement uses sequential `await` calls (insert order → upsert position → update balance) wrapped in try/catch.

**`window.location.href` after sign in.** Next.js `router.push` is client-side navigation and doesn't re-run the server layout, which meant the Nav bar wouldn't appear after login. A full page reload with `window.location.href` forces the server to re-render the layout with the new session.

**`force-dynamic` on layout.** Without it, Next.js caches the root layout and the Nav balance goes stale. `export const dynamic = "force-dynamic"` sets `Cache-Control: no-store` on every response.

## What's Next

- Sell / close positions
- WebSocket prices for live updates without polling
- Rate-limit caching on Onyx API calls
- Market search and filtering
