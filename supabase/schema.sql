-- AI Progress Tracker — database schema, security, and verification logic.
-- Run this in the Supabase SQL Editor (or `supabase db push`) on a fresh project.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

-- Lightweight mirror of auth.users so we can attribute submissions.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  created_at timestamptz not null default now()
);

create table if not exists public.fields (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  color text not null default '#6366f1',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.benchmarks (
  id uuid primary key default gen_random_uuid(),
  field_id uuid not null references public.fields (id) on delete cascade,
  slug text not null,
  name text not null,
  description text,
  unit text not null default 'score',          -- e.g. '%', 'Elo'
  higher_is_better boolean not null default true,
  source_url text,
  created_at timestamptz not null default now(),
  unique (field_id, slug)
);

create table if not exists public.data_points (
  id uuid primary key default gen_random_uuid(),
  benchmark_id uuid not null references public.benchmarks (id) on delete cascade,
  model_name text not null,
  organization text,
  score numeric not null,
  achieved_on date not null,
  source_url text,
  notes text,
  submitted_by uuid references auth.users (id) on delete set null,
  status text not null default 'pending'
    check (status in ('pending', 'verified', 'rejected')),
  vote_score int not null default 0,
  protected boolean not null default false,    -- curated seed rows keep their status
  created_at timestamptz not null default now()
);

create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(),
  data_point_id uuid not null references public.data_points (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  value smallint not null check (value in (-1, 1)),
  created_at timestamptz not null default now(),
  unique (data_point_id, user_id)
);

-- Per-field time series: popularity (research-activity proxy) and market value
-- ("net worth"). Curated reference rows are verified+protected; the community can
-- also submit points (pending) and vote them in, like data_points.
create table if not exists public.field_metrics (
  id uuid primary key default gen_random_uuid(),
  field_id uuid not null references public.fields (id) on delete cascade,
  metric_key text not null check (metric_key in ('popularity', 'market_value')),
  period date not null,                         -- yearly snapshot (use Jan 1)
  value numeric not null,
  unit text not null default 'index',           -- 'papers' | 'USD_billion'
  source_url text,
  notes text,
  submitted_by uuid references auth.users (id) on delete set null,
  status text not null default 'pending'
    check (status in ('pending', 'verified', 'rejected')),
  vote_score int not null default 0,
  protected boolean not null default false,     -- curated rows keep their status
  created_at timestamptz not null default now(),
  unique (field_id, metric_key, period)
);

create table if not exists public.metric_votes (
  id uuid primary key default gen_random_uuid(),
  field_metric_id uuid not null references public.field_metrics (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  value smallint not null check (value in (-1, 1)),
  created_at timestamptz not null default now(),
  unique (field_metric_id, user_id)
);

create index if not exists idx_benchmarks_field on public.benchmarks (field_id);
create index if not exists idx_data_points_benchmark on public.data_points (benchmark_id);
create index if not exists idx_data_points_status on public.data_points (status);
create index if not exists idx_votes_data_point on public.votes (data_point_id);
create index if not exists idx_field_metrics_field on public.field_metrics (field_id);
create index if not exists idx_field_metrics_status on public.field_metrics (status);
create index if not exists idx_metric_votes_metric on public.metric_votes (field_metric_id);

-- ---------------------------------------------------------------------------
-- Verification: a data point is promoted to 'verified' once its net vote
-- score crosses a threshold, or 'rejected' when it crosses the negative.
-- Curated (protected) rows keep their status but still tally votes.
-- ---------------------------------------------------------------------------

create or replace function public.recompute_data_point(dp_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  s int;
  threshold int := 3;  -- keep in sync with VITE_VERIFY_THRESHOLD on the client
begin
  select coalesce(sum(value), 0) into s from public.votes where data_point_id = dp_id;
  update public.data_points
  set
    vote_score = s,
    status = case
      when protected then status
      when s >= threshold then 'verified'
      when s <= -threshold then 'rejected'
      else 'pending'
    end
  where id = dp_id;
end;
$$;

create or replace function public.votes_after_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op = 'DELETE') then
    perform public.recompute_data_point(old.data_point_id);
    return old;
  end if;
  perform public.recompute_data_point(new.data_point_id);
  return new;
end;
$$;

drop trigger if exists trg_votes_after on public.votes;
create trigger trg_votes_after
after insert or update or delete on public.votes
for each row execute function public.votes_after_change();

-- Same verification mechanism for community-submitted field metrics.
create or replace function public.recompute_field_metric(fm_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  s int;
  threshold int := 3;
begin
  select coalesce(sum(value), 0) into s from public.metric_votes where field_metric_id = fm_id;
  update public.field_metrics
  set
    vote_score = s,
    status = case
      when protected then status
      when s >= threshold then 'verified'
      when s <= -threshold then 'rejected'
      else 'pending'
    end
  where id = fm_id;
end;
$$;

create or replace function public.metric_votes_after_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op = 'DELETE') then
    perform public.recompute_field_metric(old.field_metric_id);
    return old;
  end if;
  perform public.recompute_field_metric(new.field_metric_id);
  return new;
end;
$$;

drop trigger if exists trg_metric_votes_after on public.metric_votes;
create trigger trg_metric_votes_after
after insert or update or delete on public.metric_votes
for each row execute function public.metric_votes_after_change();

-- Auto-create a profile row when a user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row-Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.fields enable row level security;
alter table public.benchmarks enable row level security;
alter table public.data_points enable row level security;
alter table public.votes enable row level security;
alter table public.field_metrics enable row level security;
alter table public.metric_votes enable row level security;

-- Reference data is world-readable.
drop policy if exists "fields_read" on public.fields;
create policy "fields_read" on public.fields for select using (true);

-- Verified metrics are public; signed-in users also see pending ones (to vote).
drop policy if exists "field_metrics_read" on public.field_metrics;
create policy "field_metrics_read" on public.field_metrics for select
  using (status = 'verified' or auth.role() = 'authenticated');

drop policy if exists "field_metrics_insert" on public.field_metrics;
create policy "field_metrics_insert" on public.field_metrics for insert to authenticated
  with check (submitted_by = auth.uid() and status = 'pending' and protected = false);

drop policy if exists "field_metrics_delete_own" on public.field_metrics;
create policy "field_metrics_delete_own" on public.field_metrics for delete to authenticated
  using (submitted_by = auth.uid() and status = 'pending');

drop policy if exists "metric_votes_read_own" on public.metric_votes;
create policy "metric_votes_read_own" on public.metric_votes for select to authenticated
  using (user_id = auth.uid());
drop policy if exists "metric_votes_insert_own" on public.metric_votes;
create policy "metric_votes_insert_own" on public.metric_votes for insert to authenticated
  with check (user_id = auth.uid());
drop policy if exists "metric_votes_update_own" on public.metric_votes;
create policy "metric_votes_update_own" on public.metric_votes for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "metric_votes_delete_own" on public.metric_votes;
create policy "metric_votes_delete_own" on public.metric_votes for delete to authenticated
  using (user_id = auth.uid());

drop policy if exists "benchmarks_read" on public.benchmarks;
create policy "benchmarks_read" on public.benchmarks for select using (true);

-- Verified data is public; signed-in users also see pending items so they can vote.
drop policy if exists "data_points_read" on public.data_points;
create policy "data_points_read" on public.data_points for select
  using (status = 'verified' or auth.role() = 'authenticated');

-- Signed-in users may submit; submissions are forced to pending + their own id.
drop policy if exists "data_points_insert" on public.data_points;
create policy "data_points_insert" on public.data_points for insert to authenticated
  with check (
    submitted_by = auth.uid()
    and status = 'pending'
    and protected = false
  );

-- Submitters may delete their own still-pending submissions.
drop policy if exists "data_points_delete_own" on public.data_points;
create policy "data_points_delete_own" on public.data_points for delete to authenticated
  using (submitted_by = auth.uid() and status = 'pending');

-- Votes belong to their owner.
drop policy if exists "votes_read_own" on public.votes;
create policy "votes_read_own" on public.votes for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "votes_insert_own" on public.votes;
create policy "votes_insert_own" on public.votes for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "votes_update_own" on public.votes;
create policy "votes_update_own" on public.votes for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "votes_delete_own" on public.votes;
create policy "votes_delete_own" on public.votes for delete to authenticated
  using (user_id = auth.uid());

drop policy if exists "profiles_read_own" on public.profiles;
create policy "profiles_read_own" on public.profiles for select to authenticated
  using (id = auth.uid());
