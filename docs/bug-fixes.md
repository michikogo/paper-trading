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

## MUI `<Link component={Link}>` crashes in server components

**Symptom:** Auth pages throw "Functions cannot be passed directly to Client Components unless you explicitly expose it by marking it with 'use client'".

**Root cause:** Next.js App Router does not allow passing the Next.js `Link` component as a prop (e.g. `component={Link}`) across the server/client boundary. MUI's `Link` with `component={Link}` attempts to do exactly this.

**Fix:** Replace `<MuiLink component={Link} href="...">` with a plain `<a href="...">` on any server component page. Since these are simple navigation links, no client-side routing behavior is needed.
