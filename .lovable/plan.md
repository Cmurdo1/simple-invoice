
## Root Cause Analysis

There are **two separate issues** to fix:

### Issue 1: Expired JWT on `check-subscription`
The error `token is expired` means the app is passing a stale `session.access_token` to `check-subscription`. The `AuthContext` memoizes `checkSubscription` on `session?.access_token` — but if the token expires between calls (60s interval), it sends the old one. The fix is to call `supabase.auth.getSession()` fresh inside `checkSubscription` to always get a live, auto-refreshed token instead of the one captured in closure.

### Issue 2: Webhook secret name mismatch
The webhook function reads `Deno.env.get("STRIPE_WEBHOOK_SECRET")` but the secret is stored as `STRIPE_INVOICE_WEBHOOK`. This means signature verification silently falls back to unverified mode (parses raw body without validation) — a security hole.

### Issue 3: `config.toml` missing webhook function entry
`stripe-invoice-webhook` is not listed in `config.toml` with `verify_jwt = false`. Stripe calls it without a JWT, so it may fail JWT validation.

---

## Plan

### 1. Fix `AuthContext` — always use fresh session token
In `src/contexts/AuthContext.tsx`, change `checkSubscription` to call `supabase.auth.getSession()` internally instead of using the stale `session.access_token` from closure:

```ts
const checkSubscription = useCallback(async () => {
  const { data: { session: freshSession } } = await supabase.auth.getSession();
  if (!freshSession?.access_token) { ... return; }
  // use freshSession.access_token
}, []); // no dependency on session
```

Also remove the `session?.access_token` dependency from both `useEffect` hooks that call `checkSubscription` — they should watch `session` (the object) or user ID instead so re-renders don't cascade.

### 2. Fix webhook secret env var name
In `supabase/functions/stripe-invoice-webhook/index.ts`, change:
```ts
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
```
to:
```ts
const webhookSecret = Deno.env.get("STRIPE_INVOICE_WEBHOOK");
```
This matches the actual secret name set by the user.

### 3. Add webhook function to `config.toml`
Add:
```toml
[functions.stripe-invoice-webhook]
verify_jwt = false

[functions.create-public-invoice-payment]
verify_jwt = false

[functions.get-public-invoice]
verify_jwt = false
```
These three are called without auth tokens (by Stripe or by unauthenticated clients), so they need `verify_jwt = false`.

---

## Files to change
- `src/contexts/AuthContext.tsx` — fresh token fetch
- `supabase/functions/stripe-invoice-webhook/index.ts` — secret name fix
- `supabase/config.toml` — add 3 missing function entries
