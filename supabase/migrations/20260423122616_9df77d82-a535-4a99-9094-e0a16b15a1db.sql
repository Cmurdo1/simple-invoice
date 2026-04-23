
-- AI Org infrastructure: action audit log + scheduled run history

create table if not exists public.ai_actions (
  id uuid primary key default gen_random_uuid(),
  agent_role text not null,            -- 'ceo' | 'sales' | 'ops' | 'finance' | 'marketing' | 'custodian'
  action_type text not null,           -- e.g. 'send_email', 'create_estimate', 'cancel_subscription', 'process_lead', 'report'
  target text,                         -- free text: who/what was affected (email, invoice id, etc.)
  reasoning text,                      -- why the agent did it
  payload jsonb,                       -- input args
  result jsonb,                        -- output / error
  status text not null default 'success', -- 'success' | 'error' | 'skipped'
  triggered_by text not null default 'chat', -- 'chat' | 'cron' | 'webhook'
  run_id uuid,                         -- groups actions in a single autonomous run
  created_at timestamptz not null default now()
);

create index if not exists ai_actions_created_at_idx on public.ai_actions (created_at desc);
create index if not exists ai_actions_role_idx on public.ai_actions (agent_role);
create index if not exists ai_actions_run_idx on public.ai_actions (run_id);

alter table public.ai_actions enable row level security;

-- Only the owner email can view (we check via email since this is a single-owner system)
create policy "Owner can view ai_actions"
  on public.ai_actions for select
  to authenticated
  using ((auth.jwt() ->> 'email') = 'murdochcpm_08@yahoo.com');

create policy "Service role full access ai_actions"
  on public.ai_actions for all
  to service_role
  using (true) with check (true);

-- Realtime
alter publication supabase_realtime add table public.ai_actions;

-- Scheduled autonomous runs
create table if not exists public.ai_org_runs (
  id uuid primary key default gen_random_uuid(),
  triggered_by text not null default 'cron',
  status text not null default 'running', -- 'running' | 'completed' | 'failed'
  summary text,
  actions_count integer not null default 0,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  error text
);

create index if not exists ai_org_runs_started_idx on public.ai_org_runs (started_at desc);

alter table public.ai_org_runs enable row level security;

create policy "Owner can view ai_org_runs"
  on public.ai_org_runs for select
  to authenticated
  using ((auth.jwt() ->> 'email') = 'murdochcpm_08@yahoo.com');

create policy "Service role full access ai_org_runs"
  on public.ai_org_runs for all
  to service_role
  using (true) with check (true);

alter publication supabase_realtime add table public.ai_org_runs;

-- Org settings (single row) — autonomy toggle, model, run interval
create table if not exists public.ai_org_settings (
  id integer primary key default 1,
  autonomous_enabled boolean not null default false,
  run_interval_minutes integer not null default 15,
  ceo_model text not null default 'google/gemini-2.5-pro',
  worker_model text not null default 'google/gemini-2.5-flash',
  daily_brief_hour integer not null default 8,
  last_brief_date date,
  updated_at timestamptz not null default now(),
  constraint single_row check (id = 1)
);

insert into public.ai_org_settings (id) values (1) on conflict (id) do nothing;

alter table public.ai_org_settings enable row level security;

create policy "Owner can view ai_org_settings"
  on public.ai_org_settings for select
  to authenticated
  using ((auth.jwt() ->> 'email') = 'murdochcpm_08@yahoo.com');

create policy "Owner can update ai_org_settings"
  on public.ai_org_settings for update
  to authenticated
  using ((auth.jwt() ->> 'email') = 'murdochcpm_08@yahoo.com')
  with check ((auth.jwt() ->> 'email') = 'murdochcpm_08@yahoo.com');

create policy "Service role full access ai_org_settings"
  on public.ai_org_settings for all
  to service_role
  using (true) with check (true);
