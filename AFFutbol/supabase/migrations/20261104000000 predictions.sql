-- AFFutbol — Phase 4 predictions
--
-- Users predict the score of a match. Points are NEVER written by the client:
-- they are computed by public.prediction_points() and applied by
-- public.settle_fixture(), which only the service role can execute
-- (for example from a Supabase Edge Function once the final score is known).
--
-- Scoring (regular time, see AGENTS.md):
--   exact score ............................ 10 points
--   exactly one team's goals correct ....... 5 points
--   otherwise .............................. 0 points

create table if not exists public.predictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  fixture_id integer not null,
  league_id integer,
  home_team_id integer not null,
  home_team_name text not null,
  away_team_id integer not null,
  away_team_name text not null,
  kickoff_at timestamptz not null,
  home_goals smallint not null check (home_goals between 0 and 20),
  away_goals smallint not null check (away_goals between 0 and 20),
  status text not null default 'pending'
    check (status in ('pending', 'settled', 'void')),
  points smallint check (points in (0, 5, 10)),
  settled_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint predictions_one_per_fixture unique (user_id, fixture_id)
);

create index if not exists predictions_user_kickoff_idx
  on public.predictions (user_id, kickoff_at desc);
create index if not exists predictions_fixture_pending_idx
  on public.predictions (fixture_id) where status = 'pending';

alter table public.predictions enable row level security;

-- Phase 4: each user reads only their own predictions.
-- Phase 5 (rankings) will expose aggregates through a view or a function.
drop policy if exists "Users read their own predictions" on public.predictions;
create policy "Users read their own predictions"
  on public.predictions
  for select
  to authenticated
  using (auth.uid() = user_id);

-- A prediction can only be created or edited before kickoff and while pending.
drop policy if exists "Users create their own open predictions" on public.predictions;
create policy "Users create their own open predictions"
  on public.predictions
  for insert
  to authenticated
  with check (auth.uid() = user_id and status = 'pending' and kickoff_at > now());

drop policy if exists "Users edit their own open predictions" on public.predictions;
create policy "Users edit their own open predictions"
  on public.predictions
  for update
  to authenticated
  using (auth.uid() = user_id and status = 'pending' and kickoff_at > now())
  with check (auth.uid() = user_id and status = 'pending' and kickoff_at > now());

-- Column-level privileges: the client can never write status, points or
-- settled_at, and can only change the predicted goals after creating a row.
revoke all on public.predictions from anon, authenticated;
grant select on public.predictions to authenticated;
grant insert (
  fixture_id, league_id,
  home_team_id, home_team_name, away_team_id, away_team_name,
  kickoff_at, home_goals, away_goals
) on public.predictions to authenticated;
grant update (home_goals, away_goals) on public.predictions to authenticated;

drop trigger if exists predictions_set_updated_at on public.predictions;
create trigger predictions_set_updated_at
  before update on public.predictions
  for each row
  execute function public.set_updated_at();

-- Pure scoring rule.
create or replace function public.prediction_points(
  predicted_home integer,
  predicted_away integer,
  actual_home integer,
  actual_away integer
)
returns smallint
language sql
immutable
set search_path = public
as $$
  select (
    case
      when predicted_home = actual_home and predicted_away = actual_away then 10
      when predicted_home = actual_home or predicted_away = actual_away then 5
      else 0
    end
  )::smallint;
$$;

-- Applies the final score to every pending prediction of a fixture.
-- Returns how many predictions were settled.
create or replace function public.settle_fixture(
  p_fixture_id integer,
  p_home_goals integer,
  p_away_goals integer
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  settled integer;
begin
  update public.predictions
  set points = public.prediction_points(home_goals, away_goals, p_home_goals, p_away_goals),
      status = 'settled',
      settled_at = timezone('utc', now())
  where fixture_id = p_fixture_id
    and status = 'pending';

  get diagnostics settled = row_count;
  return settled;
end;
$$;

-- Postponed or cancelled matches: close predictions without points.
create or replace function public.void_fixture(p_fixture_id integer)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  voided integer;
begin
  update public.predictions
  set status = 'void',
      points = null,
      settled_at = timezone('utc', now())
  where fixture_id = p_fixture_id
    and status = 'pending';

  get diagnostics voided = row_count;
  return voided;
end;
$$;

revoke execute on function public.settle_fixture(integer, integer, integer)
  from public, anon, authenticated;
revoke execute on function public.void_fixture(integer)
  from public, anon, authenticated;
grant execute on function public.settle_fixture(integer, integer, integer) to service_role;
grant execute on function public.void_fixture(integer) to service_role;