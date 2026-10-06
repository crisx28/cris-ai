-- ============================================================================
-- Automation runs (agentform) — plan → approve → apply records
-- ----------------------------------------------------------------------------
-- Run after schema.sql: SQL Editor → New query → paste → Run.
--
-- Who can do what:
--   * The runner (Cloud Run job, service-role key) inserts runs and records
--     apply results. Service role bypasses RLS.
--   * A signed-in person can READ their own runs, and can move a run from
--     "planned" to "approved"/"rejected" only through the two functions below,
--     which also require the plan hash they reviewed. There is no direct
--     insert/update/delete policy, so nothing else is writable from the app.
-- ============================================================================

create table if not exists public.automation_runs (
  id                  text primary key,
  user_id             uuid not null references auth.users (id) on delete cascade,
  created_at          timestamptz not null default now(),
  status              text not null check (status in (
                        'planned', 'no_changes', 'approved', 'rejected', 'applying',
                        'applied', 'partially_applied', 'stale', 'failed')),
  plan                jsonb not null,
  plan_hash           text not null,
  approved_plan_hash  text,
  approved_at         timestamptz,
  approved_by         uuid references auth.users (id),
  applied_at          timestamptz,
  results             jsonb,
  error               text
);

create index if not exists automation_runs_user_created
  on public.automation_runs (user_id, created_at desc);

alter table public.automation_runs enable row level security;

drop policy if exists "own_runs_select" on public.automation_runs;
create policy "own_runs_select" on public.automation_runs
  for select using (auth.uid() = user_id);

-- Approve exactly the plan that was reviewed. Fails if the run is not the
-- caller's, is no longer awaiting approval, or its plan changed since it was
-- shown (hash mismatch).
create or replace function public.approve_automation_run(p_id text, p_plan_hash text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.automation_runs
     set status = 'approved',
         approved_plan_hash = p_plan_hash,
         approved_at = now(),
         approved_by = auth.uid()
   where id = p_id
     and user_id = auth.uid()
     and status = 'planned'
     and plan_hash = p_plan_hash;
  if not found then
    raise exception 'Run not found, no longer awaiting approval, or its plan changed';
  end if;
end;
$$;

create or replace function public.reject_automation_run(p_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.automation_runs
     set status = 'rejected'
   where id = p_id
     and user_id = auth.uid()
     and status = 'planned';
  if not found then
    raise exception 'Run not found or no longer awaiting approval';
  end if;
end;
$$;

revoke all on function public.approve_automation_run(text, text) from public, anon;
revoke all on function public.reject_automation_run(text) from public, anon;
grant execute on function public.approve_automation_run(text, text) to authenticated;
grant execute on function public.reject_automation_run(text) to authenticated;
