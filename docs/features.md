# Features

## Authentication

- **Sign up** — email + password, bcrypt hashed (cost 12), user created with $1,000.00 starting balance
- **Sign in** — credentials validated against DB, JWT session issued
- **Protected routes** — middleware redirects unauthenticated users to `/auth/signin` for all market, portfolio, and API routes
- **Sign out** — clears session, redirects to sign in

## Market Browsing

- **Market list** — all active prediction markets fetched from the Onyx API, displayed as cards with YES and NO prices
- **Market detail** — full market view with sport/category label, status chip, live YES/NO price cards, and order form
- **Live prices** — market detail polls the Onyx API every 15 seconds and updates prices without a page reload
- **Breadcrumb navigation** — "Markets > [market name]" link above the market title for easy back-navigation

## Order Placement

- **Buy YES** — purchase shares in a market resolving YES at the current YES price
- **Buy NO** — purchase shares in a market resolving NO at the current NO price
- **Instant fill** — orders fill immediately at the current Onyx API price (no order book, no slippage)
- **Cost preview** — total cost shown before confirming (`quantity × fill_price`)
- **Balance check** — order rejected with an error if balance is insufficient
- **Balance update** — nav balance updates immediately after a successful order via SWR revalidation

## Portfolio

- **Cash balance** — current paper balance displayed at the top
- **Unrealized P&L** — total P&L across all open positions, color-coded green/red
- **Positions table** — one row per market/side with quantity, avg fill price, current price, and per-position P&L
- **Order history** — full fill history, most recent first, with market, side, quantity, fill price, total cost, and timestamp
- **Empty states** — friendly messages when no positions or orders exist yet

## Navigation

- **Top nav** — always visible when signed in; shows app name, Markets and Portfolio links, and live balance
- **Balance polling** — nav balance refreshes every 30 seconds automatically
