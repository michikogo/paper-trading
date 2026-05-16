# Features

## Authentication

- **Sign up** with email and password — account is created with a $1,000 starting balance
- **Sign in / sign out** with session persistence via JWT
- All routes and API endpoints are protected — unauthenticated users are redirected to the sign-in page

## Market Browsing

- **Market list** — browse all available prediction markets from the Onyx API, showing live YES and NO prices in cents
- **Search** — filter markets by name in real time, client-side with no extra API call
- **Market detail** — click any market to see a dedicated page with live price updates every 15 seconds

## Order Placement

- **Buy YES or Buy NO** on any open market
- Orders fill instantly at the current market price fetched at submission time — no order book, no slippage simulation
- **Cost preview** — shows total cost before confirming (quantity × price)
- Balance is validated server-side before any order is written — insufficient funds returns an error
- **Inline feedback** — success and error states shown directly in the order form without a page reload

## Portfolio

- **Cash balance** — displayed in the nav header and on the portfolio page, updates instantly after each order
- **Positions table** — all current holdings with market name, side (YES/NO), quantity, average fill price, current price, and unrealized P&L per position
- **Unrealized P&L** — computed live at page load using current Onyx prices; green for profit, red for loss
- **Total P&L** — sum of all open position P&L shown as a summary card
- **Order history** — full log of every fill with symbol, side, quantity, fill price, total cost, and timestamp; sorted most recent first
- Empty states for both positions and order history when the user has no activity yet
