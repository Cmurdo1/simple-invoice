
## Goals

1. **Production-ready light mode** across every page (currently the dark navy gradient is hardcoded in AppLayout and several pages, so light mode looks broken).
2. **Fix visual/UX issues** surfaced by the hardcoded-color audit.
3. **AI-generated invoices/estimates** always return full descriptions + complete line items.
4. **Regional pricing database** (`job_pricing_benchmarks`) that stores canonical labor/material rates by trade + region tier.
5. **Deterministic pricing**: same job description + same location → same total, every time.

---

## 1. Light Mode (visual only)

**Root cause**: `src/components/layout/AppLayout.tsx` sets `background: linear-gradient(...hsl(220 45% 12%)...)` inline — a hard navy that ignores the theme. Similar hardcoded darks in `Index.tsx`, `PayLanding.tsx`, `InvoiceTemplates.tsx`, `Settings.tsx`, `InvoiceEditor.tsx`, `PitchDeck.tsx`.

**Fix**:
- Add two new CSS custom properties in `index.css`:
  - `--gradient-app`: page background gradient (light: soft paper/blue; dark: navy currently used)
  - `--gradient-accent-glow`: radial glow tint
- Replace all inline `style={{ background: 'linear-gradient(...)' }}` with `style={{ background: 'var(--gradient-app)' }}` and radial glows with `var(--gradient-accent-glow)`.
- Swap `bg-slate-900`, `text-white`, `bg-black` etc. in pages for semantic tokens (`bg-background`, `text-foreground`, `bg-card`, etc.).
- Verify `ThemeToggle` cycles light/dark/system and persists (already wired via `ThemeContext`).

**Light palette** (already defined, refined slightly for contrast): paper white background, deep navy primary, subtle blue accents. Same Libre Baskerville + IBM Plex Sans.

## 2. Site issues to fix in this pass

- Duplicate `NEXT_PUBLIC_SUPABASE_URL` in `.env` (unused Firebase-migration leftover) — leave (memory says migration in progress), but stop referencing wrong project in `supabase/config.toml` (`project_id = "uslfzmfnkhkgklaoofny"` while real project is `skhdbdmyrrpvgxkhytfm`). This is Lovable-managed so we don't touch it — flag only.
- Mobile menu overlay has a hardcoded dark gradient — swap to token.
- Ensure sidebar remains dark-authority in **both** themes (financial apps convention) OR flip to match theme. Plan: **keep sidebar dark navy in both themes** (Stripe/Linear pattern) — this is a deliberate design choice, not a bug. Confirmed via existing `--sidebar-*` tokens.

## 3. AI Estimates/Invoices: Full descriptions + complete line items

**Changes in `supabase/functions/extract-line-items/index.ts`**:

- **Temperature 0** (not 0.1) everywhere for determinism.
- **Add `seed` parameter** to model calls (Gemini supports it) derived from a hash of `(job_description + location)` so the same input yields the same output.
- **Remove Perplexity live search path entirely** (non-deterministic by design — pulls fresh web results each call). Replace with the new pricing DB lookup (step 4).
- **Force minimum detail** in each line item:
  - `description`: full sentence including scope, location on property, materials used
  - Every job returns at least: 1 labor line + N material lines + optional disposal/prep lines
  - Add JSON schema validation (reject items missing description ≥ 15 chars or unit_price ≤ 0)
- **Retry with corrective feedback** if the audit step reduces line count below 2.

## 4. Regional pricing database

**New table** `public.pricing_benchmarks`:

| column | type | notes |
|---|---|---|
| trade | text | 'painting', 'plumbing', 'electrical', 'roofing', 'drywall', 'flooring', 'hvac', 'general' |
| item_type | text | 'labor' or 'material' |
| item_key | text | e.g. 'interior_paint_gallon', 'painter_hourly', 'drywall_sheet_4x8' |
| description | text | Full human description |
| base_price | numeric | National-average USD |
| unit | text | 'hour', 'gallon', 'sheet', 'sq_ft', 'each' |

Seed ~80 canonical rows covering the trades already referenced in the prompt.

**Region multiplier**: reuse the existing `col_multiplier` from `profiles.col_multiplier` (already stored per user via zip lookup — see `useGeolocation.ts`). Final price = `base_price × col_multiplier`, rounded to nearest dollar.

**Deterministic lookup**: new edge function helper `getPriceReference(trade, location)` queries the table, returns a stable price sheet string, and injects it into the AI prompt instead of asking the AI to invent prices.

RLS: table is read-only for `authenticated`, admin-managed via `service_role`. GRANT + policies included.

## 5. Consistency guarantee (same job → same price)

Combined effect of:
1. `temperature: 0`
2. Deterministic seed derived from input hash
3. Pricing sheet from DB (not model knowledge)
4. Removing Perplexity live-search branch
5. Audit prompt runs deterministically on the same prices

Result: identical `(job_description, col_multiplier, trade)` → identical line items every call.

---

## Deliverables

**Files edited**:
- `src/index.css` — add gradient tokens
- `src/components/layout/AppLayout.tsx` — theme-aware gradients
- `src/pages/{Index,PayLanding,InvoiceTemplates,Settings,InvoiceEditor,PitchDeck}.tsx` — swap hardcoded colors to tokens
- `supabase/functions/extract-line-items/index.ts` — deterministic pricing + DB lookup + strict schema

**Files created**:
- Migration: `pricing_benchmarks` table + seed data (single migration)

**Not touched**: sidebar dark aesthetic (intentional), business logic outside the AI pricing prompt, MCP/nerve-agent flows.

Ready to build if this scope looks right.
