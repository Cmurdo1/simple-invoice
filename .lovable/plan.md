## Goal

Produce a single `.sql` file you can run against a fresh Supabase project to recreate this database exactly — schema, functions, triggers, RLS policies, all row data, and auth users.

## What I'll generate

One file: `/mnt/documents/honest_invoice_migration.sql`

Organized in this order so it runs top-to-bottom without FK/order errors:

1. **Preamble** — `SET` statements, extensions (`pgcrypto` for `gen_random_uuid`).
2. **Enums** — `invoice_status`.
3. **Tables (public schema)** — exact DDL for: `profiles`, `clients`, `invoices`, `invoice_items`, `invoice_feedback`, `referrals`, `usage_tracking`, `leads`, `site_settings`, `ai_actions`, `ai_org_runs`, `ai_org_settings`. Includes defaults, FKs, unique constraints.
4. **GRANTs** for `anon` / `authenticated` / `service_role` on every public table.
5. **Functions** — all 7 existing functions (`update_updated_at_column`, `handle_new_user`, `generate_invoice_number`, `generate_referral_code`, `validate_feedback_token`, `process_referral_reward`, `increment_usage`).
6. **Triggers** — `updated_at` triggers, `handle_new_user` on `auth.users`, invoice number + referral code generators.
7. **RLS** — `ENABLE ROW LEVEL SECURITY` + every existing policy verbatim.
8. **Auth users** — `INSERT INTO auth.users (...)` for all 20 users, copying `id`, `email`, `encrypted_password`, `email_confirmed_at`, `raw_user_meta_data`, `raw_app_meta_data`, `created_at`, etc. so logins keep working.
9. **Data INSERTs** — every row from every public table, in FK-safe order (profiles → clients → invoices → invoice_items / invoice_feedback, then the rest). ~743 total rows.

## How to run it on the new Supabase project

```text
1. Create the new Supabase project.
2. Open SQL Editor → paste the file → Run.
3. Update your app's VITE_SUPABASE_URL / keys to the new project.
```

## Important caveats (please read)

- **Passwords**: Supabase hashes are bcrypt and portable between Supabase projects, so logins will work. Google OAuth users will need to re-link on first login (the OAuth provider identity lives in `auth.identities` — I'll include that table's rows too).
- **Storage buckets** (`business-assets`, `email-assets`) and uploaded files are **not** included — those live in Supabase Storage, not Postgres. You'd need to copy them via the Storage API or re-upload.
- **Edge function secrets** (`RESEND_API_KEY`, `STRIPE_SECRET_KEY`, etc.) must be re-added in the new project's secrets panel.
- **Edge functions themselves** redeploy from your repo automatically when you point Lovable at the new project.
- This is a **point-in-time snapshot**. Any data written after the export won't be in the new DB.

## Deliverable

When you approve and switch to build mode, I'll:
1. Query every row from every table (including `auth.users` and `auth.identities`).
2. Write the assembled SQL to `/mnt/documents/honest_invoice_migration.sql`.
3. Return it as a downloadable artifact.