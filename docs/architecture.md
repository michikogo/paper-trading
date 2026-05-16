# Architecture & Tradeoffs

## System Diagram

```
Browser
  │
  ├── Server Components (Next.js App Router)
  │     markets/page.tsx          → fetches market list from Onyx at request time
  │     markets/[symbol]/page.tsx → fetches initial market data, passes to client
  │     portfolio/page.tsx        → fetches positions + orders from DB, enriches with live prices
  │
  ├── Client Components
  │     MarketDetail.tsx          → SWR polls /api/markets/{symbol} every 15s
  │     OrderForm.tsx             → POST /api/orders, mutates /api/balance on success
  │     Nav.tsx                   → SWR fetches /api/balance, refreshes every 30s
  │
  └── API Routes (Next.js Route Handlers)
        POST /api/orders          → validates, fetches live price, writes order + position + balance
        GET  /api/positions       → returns positions enriched with live prices and unrealized P&L
        GET  /api/balance         → returns authenticated user's current balance
        GET  /api/auth/[...]      → NextAuth handlers (signin, session, signout)
        POST /api/auth/signup     → creates user with bcrypt-hashed password

Onyx Predictions API (read-only)
  GET /markets                    → market list (fetched server-side)
  GET /markets/{symbol}           → single market with current yes_price
  GET /markets/{symbol}/prices    → bid/ask/last prices

Neon Postgres (via @neondatabase/serverless HTTP driver)
  users       → id, email, password_hash, balance
  orders      → append-only fill history per user
  positions   → one row per (user, symbol, side), updated on each fill
```

The app is intentionally split between server and client rendering: market browsing and portfolio are server-rendered for fast initial loads, while the market detail page and nav balance are client-hydrated for live updates.

**On the three tables:** each has a distinct purpose and access pattern.

- **`users`** holds identity and account state. The `balance` column is the single source of truth for how much paper money a user has left — debited on every fill, read by the nav chip and portfolio page.
- **`orders`** is an append-only ledger. Every fill writes one new row and nothing is ever updated. This preserves a complete, auditable history used for the Order History table on the portfolio page.
- **`positions`** is a pre-materialized summary of current holdings. A unique constraint on `(user_id, symbol, side)` means one row per market/side per user. Buying more updates the row in place — quantity increases, weighted average fill price is recalculated. This makes P&L computation a single cheap read rather than an aggregation across all order history.

---

## Tradeoffs

### Next.js App Router vs. separate frontend + API

Chosen: monorepo with Next.js handling both UI and API routes.

The alternative — a React SPA talking to a standalone Express or Fastify API — would give cleaner separation of concerns and make it easier to scale the API independently. For a take-home with a 90-minute constraint, the overhead of standing up two services, configuring CORS, and managing two deployment targets wasn't worth it. The App Router's server components also let us fetch market data and DB records at render time with zero client-side waterfall, which is a real architectural win for pages like the portfolio.

The tradeoff: API routes in Next.js are not well-suited for long-running connections (WebSockets, SSE), which would matter if we wanted real-time price streaming instead of polling.

---

### Drizzle ORM vs. Prisma

Chosen: Drizzle.

Prisma is more ergonomic for complex relational queries and has a richer ecosystem. We chose Drizzle because it treats SQL as a first-class citizen (queries compose like SQL, not like an object graph), it has no binary engine dependency, and its `@neondatabase/serverless` integration is first-party. The schema-as-TypeScript-types approach also means Drizzle's inferred types flow through to query results without extra codegen steps.

The tradeoff: Drizzle's migration tooling (`drizzle-kit push` vs. a full migration history) is less mature. For a production app with multiple environments and a team, Prisma's migration history would be preferable.

---

### Neon (serverless Postgres) vs. PlanetScale or Supabase

Chosen: Neon.

All three are viable managed Postgres/MySQL options. Neon was chosen because it offers a true serverless HTTP driver (`@neondatabase/serverless`) that works inside Vercel's edge runtime without connection pooling configuration. PlanetScale is MySQL-only, which ruled it out for Drizzle's Postgres dialect. Supabase would have worked but brings a larger surface area (realtime, storage, auth) we didn't need — and its connection pooler adds latency overhead in the serverless context.

The critical constraint this decision exposed: the HTTP driver does **not** support persistent connections, which means `db.transaction()` is unavailable. Order placement — which needs to atomically debit a balance, insert an order, and upsert a position — runs as three sequential `await` calls with a try-catch. If any step fails mid-way, the DB can be left in an inconsistent state. In production this would need either a proper transaction-capable connection pooler (PgBouncer in session mode) or an explicit compensation pattern.

---

### SWR polling vs. WebSockets for live prices

Chosen: SWR polling at 15-second intervals on the market detail page.

WebSockets (or Server-Sent Events) would give true real-time prices with lower latency and bandwidth. The reason we didn't go that route: the Onyx API is a REST API with no WebSocket endpoint, so we'd be polling it on the server anyway and fanning out to clients via our own WebSocket server. That's a meaningful infrastructure addition — a persistent server process, connection management, reconnect logic — that wasn't justified for a take-home.

SWR's `refreshInterval` is simple, stateless, and restarts cleanly on reconnect. For a prediction market where prices move on the timescale of minutes rather than milliseconds, 15-second polling is good enough to feel live.

---

## Performance

**Server-rendered pages for fast initial load.** The markets list and portfolio page are server components — the browser receives fully-rendered HTML with no client-side data waterfall. This is the biggest performance win in the architecture; pages like portfolio (which need DB data + Onyx prices) would otherwise require multiple sequential client fetches before anything renders.

**Market list is fetched fresh on every request.** There is currently no caching on `GET /markets`. For a low-traffic take-home this is fine, but at scale this is the first thing to fix — the market list changes infrequently and could be cached at the CDN layer with a 30–60 second TTL, eliminating the Onyx API call entirely for most visitors.

**Portfolio page fans out Onyx API calls in parallel.** For each position, we fetch the current price from Onyx to compute P&L. These calls run concurrently via `Promise.all`, so render time grows with the number of unique symbols held, not the total number of calls.

**The first bottleneck under load** is the Neon HTTP driver. Each request opens a new HTTP connection to Neon — there is no connection pool. Under concurrent traffic, this adds per-request latency. The fix is to switch to a pooled connection (Neon's connection pooler, or an external PgBouncer) once traffic justifies it.

---

## Reliability

**Order writes are not atomic.** The three DB writes for an order (insert order row, upsert position, debit balance) run as sequential awaits with no transaction wrapping. If the process crashes between steps, the DB is left in an inconsistent state — e.g., an order is recorded but the balance isn't debited. This is a known limitation of the `@neondatabase/serverless` HTTP driver, documented in the Neon tradeoff above. For production, this would need a transaction-capable connection or a compensation pattern.

**Onyx API failures degrade gracefully.** On the portfolio page and positions route, if the Onyx price fetch fails for a position, we fall back to the position's average fill price — P&L shows as $0.00 rather than crashing the page. On order placement, a failed price fetch returns a 502 and the order is not written.

**No retry logic on Onyx API calls.** If the upstream is temporarily unavailable, the request fails immediately. A production implementation would add a short retry with exponential backoff before surfacing an error to the user.

---

## Scalability

The app is entirely stateless — no in-memory session store, no persistent server process. Each request is handled independently, which means it scales horizontally on Vercel's serverless infrastructure with no configuration.

The two components that don't scale linearly:

1. **Neon connections** — as noted above, each request opens a new HTTP connection. At high concurrency this creates pressure on the database. Switching to a pooled driver is the lever.

2. **Portfolio page Onyx fan-out** — a user with 50 positions triggers 50 parallel Onyx API calls on every portfolio load. This could hit upstream rate limits and slow render time. The fix is to cache Onyx prices server-side (Redis or Vercel KV) with a short TTL and share the cached value across all users viewing the same market.

---

## Security

- **Passwords** are hashed with bcrypt at cost factor 12 before storage. The plain-text password never touches the database.
- **Sessions** use JWT tokens signed with `NEXTAUTH_SECRET`. Tokens are short-lived and verified server-side on every protected request.
- **Route protection** is enforced in `proxy.ts` (Next.js middleware). Unauthenticated requests to `/markets`, `/portfolio`, and all `/api/orders` and `/api/positions` routes are redirected to the sign-in page before they reach any route handler.
- **All API routes** re-verify the session independently — middleware is a first line of defense, not the only one.
- **No user input reaches the database unparameterized.** Drizzle uses parameterized queries exclusively; there is no raw SQL with string interpolation.

---

## Caching Strategy

### What's cached now

Nothing. Every request to the markets list hits the Onyx API fresh, and every portfolio load hits both Neon and Onyx with no intermediate cache. For a take-home this is acceptable, but it's the first thing to address before production traffic.

### What should be cached

**Market list (`GET /markets`)** — the list of available markets changes infrequently (new markets are added, statuses change, but not on every request). This is a strong candidate for CDN-level caching with a 30–60 second TTL. In Next.js this can be done with zero infrastructure by replacing `cache: "no-store"` with a `revalidate` value in the `onyxFetch` call, or wrapping the fetch in `unstable_cache` for finer-grained control. For higher traffic, a Vercel Edge Config or CDN cache rule would serve the cached response without the request ever reaching the origin.

**Onyx prices (per symbol)** — the market detail page polls `/markets/{symbol}/prices` every 15 seconds per client. If 100 users are watching the same market, that's 100 upstream calls per 15 seconds for identical data. The right fix is a server-side cache (Vercel KV or Redis) keyed by symbol with a 10–15 second TTL. All clients would share one upstream poll, and the SWR interval on the client would just be fetching from our own cache.

### What must never be cached

**Balance, positions, and order history** are user-specific and must always reflect the latest DB state. Caching these — even briefly — risks showing a user a stale balance after a fill, which would be a correctness bug. These routes have `cache: "no-store"` implicitly via the NextAuth session check, which opts them out of any static caching.

### Recommended cache hierarchy for production

```
Client (SWR, 15s)
  → Next.js API route
      → Vercel KV (10s TTL, per symbol)         ← shared across all users
          → Onyx API (only on cache miss)
```

This reduces Onyx API calls from O(users × polls) to O(1 per TTL interval) for any given market.

---

## Accessibility

Material UI ships with ARIA roles, keyboard navigation, and focus management baked into its components — buttons, inputs, chips, and tables are all accessible out of the box. We did not do explicit a11y testing (screen reader audit, keyboard-only flow test, color contrast check) within the 90-minute scope.

Known gaps to address before a production release:

- **Color as the only signal for P&L.** Green/red text is used to indicate positive/negative P&L. Users with color vision deficiency need a secondary indicator (e.g., +/− prefix, which is already present, but should be verified with a contrast tool).
- **Form error messages** are rendered as MUI `Alert` components — these should be verified to be associated with their inputs via `aria-describedby` for screen reader users.
- **Page titles** are set globally but not per-page — each route should have a unique `<title>` so screen reader users can orient themselves.
