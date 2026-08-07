-- ============================================================================
-- Cris Budget OS — Supabase schema + Row Level Security
-- ----------------------------------------------------------------------------
-- Run this in your Supabase project: SQL Editor → New query → paste → Run.
-- It creates one set of tables per feature, all keyed to the logged-in user,
-- with RLS so each household only ever sees its own data.
-- ============================================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ---------- INCOME ----------------------------------------------------------
create table if not exists public.incomes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  date        date not null default current_date,
  source      text not null,
  amount      numeric(12,2) not null check (amount >= 0),
  notes       text,
  created_at  timestamptz not null default now()
);

-- ---------- EXPENSES --------------------------------------------------------
create table if not exists public.expenses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  date        date not null default current_date,
  description text not null,
  category    text not null,
  amount      numeric(12,2) not null check (amount >= 0),
  notes       text,
  created_at  timestamptz not null default now()
);

-- ---------- FIXED (RECURRING) EXPENSES --------------------------------------
create table if not exists public.fixed_expenses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  name        text not null,
  category    text not null,
  amount      numeric(12,2) not null check (amount >= 0),
  due_day     int not null check (due_day between 1 and 31),
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ---------- DEBTS -----------------------------------------------------------
create table if not exists public.debts (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  name            text not null,
  balance         numeric(12,2) not null check (balance >= 0),
  interest_rate   numeric(6,3) not null default 0,
  monthly_payment numeric(12,2) not null default 0,
  due_day         int not null default 1 check (due_day between 1 and 31),
  created_at      timestamptz not null default now()
);

-- ---------- SAVINGS GOALS ---------------------------------------------------
create table if not exists public.savings_goals (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  name        text not null,
  target      numeric(12,2) not null check (target >= 0),
  current     numeric(12,2) not null default 0,
  deadline    date,
  created_at  timestamptz not null default now()
);

-- ---------- TRAVEL FUNDS ----------------------------------------------------
create table if not exists public.travel_funds (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  destination  text not null,
  target       numeric(12,2) not null check (target >= 0),
  current      numeric(12,2) not null default 0,
  travel_date  date,
  created_at   timestamptz not null default now()
);

-- Helpful indexes for per-user, date-ordered queries.
create index if not exists idx_incomes_user_date  on public.incomes (user_id, date desc);
create index if not exists idx_expenses_user_date on public.expenses (user_id, date desc);

-- ============================================================================
-- ROW LEVEL SECURITY — each user sees only their own rows.
-- ============================================================================
alter table public.incomes        enable row level security;
alter table public.expenses       enable row level security;
alter table public.fixed_expenses enable row level security;
alter table public.debts          enable row level security;
alter table public.savings_goals  enable row level security;
alter table public.travel_funds   enable row level security;

-- One reusable policy pattern per table (select/insert/update/delete).
do $$
declare t text;
begin
  foreach t in array array[
    'incomes','expenses','fixed_expenses','debts','savings_goals','travel_funds'
  ]
  loop
    execute format('drop policy if exists "own_rows_select" on public.%I;', t);
    execute format('drop policy if exists "own_rows_insert" on public.%I;', t);
    execute format('drop policy if exists "own_rows_update" on public.%I;', t);
    execute format('drop policy if exists "own_rows_delete" on public.%I;', t);

    execute format(
      'create policy "own_rows_select" on public.%I for select using (auth.uid() = user_id);', t);
    execute format(
      'create policy "own_rows_insert" on public.%I for insert with check (auth.uid() = user_id);', t);
    execute format(
      'create policy "own_rows_update" on public.%I for update using (auth.uid() = user_id) with check (auth.uid() = user_id);', t);
    execute format(
      'create policy "own_rows_delete" on public.%I for delete using (auth.uid() = user_id);', t);
  end loop;
end $$;
