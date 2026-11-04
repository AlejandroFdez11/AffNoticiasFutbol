-- AFFutbol — Phase 4: store the final score with each prediction
--
-- The history screen shows the predicted score next to the final result and the
-- points earned. Writing the result into the row avoids one API-Football request
-- per settled match (Free plan: 100 requests/day) and keeps the history usable
-- offline.
--
-- The client never writes these columns: only `settle_fixture()`, which runs as
-- the service role (see supabase/functions/settle-predictions).

alter table public.predictions
  add column if not exists final_home_goals smallint,
  add column if not exists final_away_goals smallint;

alter table public.predictions
  drop constraint if exists predictions_final_home_goals_check,
  drop constraint if exists predictions_final_away_goals_check;

alter table public.predictions
  add constraint predictions_final_home_goals_check
    check (final_home_goals is null or final_home_goals between 0 and 20),
  add constraint predictions_final_away_goals_check
    check (final_away_goals is null or final_away_goals between 0 and 20);

-- Settlement looks for pending rows of matches that already kicked off.
create index if not exists predictions_pending_kickoff_idx
  on public.predictions (kickoff_at) where status = 'pending';

-- Same rule as before, plus the final score. `p_*` arguments win over the
-- columns of the same name, so the SET list can reference both safely.
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
      final_home_goals = p_home_goals,
      final_away_goals = p_away_goals,
      status = 'settled',
      settled_at = timezone('utc', now())
  where fixture_id = p_fixture_id
    and status = 'pending';

  get diagnostics settled = row_count;
  return settled;
end;
$$;

revoke execute on function public.settle_fixture(integer, integer, integer)
  from public, anon, authenticated;
grant execute on function public.settle_fixture(integer, integer, integer) to service_role;
