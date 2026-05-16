# Bug Fixes

Bugs encountered during development and how they were resolved.

---

## Nav balance doesn't update after placing an order

**Symptom:** User buys YES/NO, balance in the top nav stays at the old value until a full page reload.

**Root cause:** The root layout is a server component rendered once on navigation. It has no way to reactively update the balance shown in Nav after a client-side order submission.

**Fix:** Nav fetches balance via `useSWR("/api/balance")` independently of the layout. OrderForm calls `mutate("/api/balance")` after a successful fill, which triggers an immediate SWR revalidation and updates the nav balance without a page reload.

---

## Nav bar disappears after sign in

**Symptom:** After signing in, the app redirects to `/markets` but the Nav bar is missing. A manual page refresh brings it back.

**Root cause:** `router.push("/markets")` is client-side navigation — it swaps the page content without re-running the server layout. The layout renders Nav conditionally on whether a session exists, and since the session is only available server-side, it never re-checks after client-side navigation.

**Fix:** Use `window.location.href = "/markets"` in SignInForm instead of `router.push`. This triggers a full browser navigation, forces the server to re-render the layout, and picks up the new session correctly.

---

## Nav balance stale after Vercel domain rename / redeployment

**Symptom:** After a domain change or redeploy, the Nav bar would stop showing or balance would be stale. Browser showed a cached version of the layout.

**Root cause:** Next.js caches the root layout by default. If the layout was cached before the session existed, it would serve the cached no-session version.

**Fix:** Add `export const dynamic = "force-dynamic"` to `src/app/layout.tsx`. This sets `Cache-Control: no-store` on every response from the root layout, ensuring the session is always read fresh.

---

## `db.transaction()` throws at runtime

**Symptom:** Order placement crashes with a runtime error when attempting to use Drizzle's `db.transaction()`.

**Root cause:** The `@neondatabase/serverless` HTTP driver makes stateless HTTP requests to Neon. It doesn't support persistent connections, so Drizzle's transaction API (which requires holding a connection open) is unavailable.

**Fix:** Replace the transaction block with sequential `await` calls — insert order, upsert position, update balance — wrapped in a try/catch. If any step fails, an error is returned to the client. The lack of atomicity is acceptable for a paper-trading context.

---

## MUI `<Link component={Link}>` crashes in server components

**Symptom:** Auth pages throw "Functions cannot be passed directly to Client Components unless you explicitly expose it by marking it with 'use client'".

**Root cause:** Next.js App Router does not allow passing the Next.js `Link` component as a prop (e.g. `component={Link}`) across the server/client boundary. MUI's `Link` with `component={Link}` attempts to do exactly this.

**Fix:** Replace `<MuiLink component={Link} href="...">` with a plain `<a href="...">` on any server component page. Since these are simple navigation links, no client-side routing behavior is needed.

---

## CI fails with pnpm version mismatch on Node 20

**Symptom:** GitHub Actions CI fails at the `pnpm` setup step on Node 20.

**Root cause:** pnpm 11 requires Node 22.

**Fix:** Update the `node-version` in `.github/workflows/ci.yml` from `20` to `22`.
