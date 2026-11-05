-- AFFutbol — Phase 6: push notifications
--
-- The client only does two things: register its Expo push token and store its
-- notification preferences. Everything else happens in the `send-push` Edge
-- Function with the service role (tokens are never readable by other users and
-- predictions stay private).
--
-- Tables:
--   * public.fixtures                 cached schedule, feeds the match reminder
--   * public.push_tokens              one row per device, reassigned on login
--   * public.notification_preferences one switch per notification kind
--   * public.push_deliveries          what was sent + the de-duplication key
--   * public.ranking_state            last known position, to detect changes
--
-- Three notification kinds: 'match_reminder' (1 h before kickoff), 'result'
-- (the prediction has been settled) and 'ranking' (the position changed).

-- ---------------------------------------------------------------------------
-- Devices
-- ---------------------------------------------------------------------------

create table if not exists public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  token text not null,
  platform text not null,
  device_name text,
  app_version text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  last_seen_at timestamptz not null default timezone('utc', now()),
  constraint push_tokens_token_key unique (token),
  constraint push_tokens_platform_check check (platform in ('ios', 'android')),
  -- Expo push tokens look like `ExponentPushToken[xxxxxxxx]` or `ExpoPushToken[...]`.
  constraint push_tokens_token_format check (token ~ '^(Expo|Exponent)PushToken\[[^]]+\]$')
);

create index if not exists push_tokens_user_idx on public.push_tokens (user_id);

alter table public.push_tokens enable row level security;

drop policy if exists "Users read their own push tokens" on public.push_tokens;
create policy "Users read their own push tokens"
  on public.push_tokens
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Writes go through the functions below: a device token can be claimed by a
-- different account (second user on the same phone), which needs to reassign
-- the row instead of failing the unique constraint.
revoke all on public.push_tokens from anon, authenticated;
grant select on public.push_tokens to authenticated;

create or replace function public.register_push_token(
  p_token text,
  p_platform text,
  p_device_name text default null,
  p_app_version text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_token text := btrim(coalesce(p_token, ''));
begin
  if auth.uid() is null then
    raise exception 'Inicia sesión para activar las notificaciones.' using errcode = '42501';
  end if;

  if v_token !~ '^(Expo|Exponent)PushToken\[[^]]+\]$' then
    raise exception 'El token de notificaciones no es válido.' using errcode = '22023';
  end if;

  if p_platform is null or p_platform not in ('ios', 'android') then
    raise exception 'Plataforma no soportada.' using errcode = '22023';
  end if;

  -- The same device can sign in with another account: never leave the token
  -- pointing at the previous user.
  delete from public.push_tokens
  where token = v_token
    and user_id <> auth.uid();

  insert into public.push_tokens (user_id, token, platform, device_name, app_version)
  values (
    auth.uid(),
    v_token,
    p_platform,
    nullif(btrim(coalesce(p_device_name, '')), ''),
    nullif(btrim(coalesce(p_app_version, '')), '')
  )
  on conflict (token) do update
    set user_id = auth.uid(),
        platform = excluded.platform,
        device_name = coalesce(excluded.device_name, push_tokens.device_name),
        app_version = coalesce(excluded.app_version, push_tokens.app_version),
        last_seen_at = timezone('utc', now());
end;
$$;

-- Called before signing out so the next account does not inherit this device.
create or replace function public.unregister_push_token(p_token text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return;
  end if;

  delete from public.push_tokens
  where token = btrim(coalesce(p_token, ''))
    and user_id = auth.uid();
end;
$$;

revoke execute on function public.register_push_token(text, text, text, text) from public, anon;
revoke execute on function public.unregister_push_token(text) from public, anon;
grant execute on function public.register_push_token(text, text, text, text) to authenticated;
grant execute on function public.unregister_push_token(text) to authenticated;

-- ---------------------------------------------------------------------------
-- Preferences (one row per user, all kinds on by default)
-- ---------------------------------------------------------------------------

create table if not exists public.notification_preferences (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  match_reminders boolean not null default true,
  match_results boolean not null default true,
  ranking_changes boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.notification_preferences enable row level security;

drop policy if exists "Users read their own notification preferences" on public.notification_preferences;
create policy "Users read their own notification preferences"
  on public.notification_preferences
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users create their own notification preferences" on public.notification_preferences;
create policy "Users create their own notification preferences"
  on public.notification_preferences
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users update their own notification preferences" on public.notification_preferences;
create policy "Users update their own notification preferences"
  on public.notification_preferences
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

revoke all on public.notification_preferences from anon, authenticated;
grant select on public.notification_preferences to authenticated;
-- `user_id` is only accepted because the RLS insert policy pins it to auth.uid().
grant insert (user_id, match_reminders, match_results, ranking_changes)
  on public.notification_preferences to authenticated;
grant update (match_reminders, match_results, ranking_changes)
  on public.notification_preferences to authenticated;

drop trigger if exists notification_preferences_set_updated_at on public.notification_preferences;
create trigger notification_preferences_set_updated_at
  before update on public.notification_preferences
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Delivery log: audit trail and de-duplication
-- ---------------------------------------------------------------------------

create table if not exists public.push_deliveries (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null,
  dedupe_key text not null,
  sent_at timestamptz not null default timezone('utc', now()),
  constraint push_deliveries_kind_check
    check (kind in ('match_reminder', 'result', 'ranking')),
  constraint push_deliveries_unique unique (user_id, kind, dedupe_key)
);

create index if not exists push_deliveries_user_sent_idx
  on public.push_deliveries (user_id, sent_at desc);

alter table public.push_deliveries enable row level security;

drop policy if exists "Users read their own push deliveries" on public.push_deliveries;
create policy "Users read their own push deliveries"
  on public.push_deliveries
  for select
  to authenticated
  using (auth.uid() = user_id);

revoke all on public.push_deliveries from anon, authenticated;
grant select on public.push_deliveries to authenticated;

-- ---------------------------------------------------------------------------
-- Fixture cache: the reminder needs the schedule without spending quota
-- ---------------------------------------------------------------------------

create table if not exists public.fixtures (
  fixture_id integer primary key,
  league_id integer,
  league_name text,
  league_logo text,
  league_country text,
  home_team_id integer not null,
  home_team_name text not null,
  home_team_logo text,
  away_team_id integer not null,
  away_team_name text not null,
  away_team_logo text,
  kickoff_at timestamptz not null,
  status_short text not null,
  season integer,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists fixtures_kickoff_idx on public.fixtures (kickoff_at);
create index if not exists fixtures_home_team_idx on public.fixtures (home_team_id, kickoff_at);
create index if not exists fixtures_away_team_idx on public.fixtures (away_team_id, kickoff_at);

-- Server-only cache: written by `send-push` with the service role. The app keeps
-- reading API-Football directly, so no policies and no grants on purpose.
alter table public.fixtures enable row level security;

revoke all on public.fixtures from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Last known leaderboard position, to detect changes
-- ---------------------------------------------------------------------------

create table if not exists public.ranking_state (
  user_id uuid not null references auth.users (id) on delete cascade,
  scope_key text not null,
  position bigint not null,
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, scope_key),
  constraint ranking_state_scope_check
    check (scope_key = 'global' or scope_key ~ '^league:[0-9a-f-]{36}$')
);

alter table public.ranking_state enable row level security;

drop policy if exists "Users read their own ranking state" on public.ranking_state;
create policy "Users read their own ranking state"
  on public.ranking_state
  for select
  to authenticated
  using (auth.uid() = user_id);

revoke all on public.ranking_state from anon, authenticated;
grant select on public.ranking_state to authenticated;

-- ---------------------------------------------------------------------------
-- Positions for every user and league, service role only
-- ---------------------------------------------------------------------------

-- `global_ranking()` and `league_ranking()` are per-caller (they filter with
-- auth.uid()), so the notifier needs its own view of the whole table. It returns
-- positions only, never predictions.
--
-- Keep the ORDER BY in sync with global_ranking() and league_ranking()
-- (see AGENTS.md): same points, exact scores, prediction count and name.
create or replace function public.ranking_positions()
returns table (scope_key text, user_id uuid, "position" bigint)
language sql
stable
security definer
set search_path = public
as $$
  with scored as (
    select
      p.id as user_id,
      coalesce(nullif(btrim(p.display_name), ''), p.username, 'Aficionado') as display_name,
      coalesce(sum(pr.points), 0)::bigint as total_points,
      count(pr.id)::bigint as predictions,
      (count(pr.id) filter (where pr.status = 'settled' and pr.points = 10))::bigint
        as exact_scores
    from public.profiles p
    join public.predictions pr on pr.user_id = p.id
    group by p.id, p.display_name, p.username
  ),
  scoped as (
    -- Global: only users with at least one prediction.
    select
      'global'::text as scope_key,
      scored.user_id,
      scored.display_name,
      scored.total_points,
      scored.exact_scores,
      scored.predictions
    from scored
    union all
    -- Leagues: every member, even without predictions.
    select
      ('league:' || m.league_id::text),
      m.user_id,
      coalesce(nullif(btrim(p.display_name), ''), p.username, 'Aficionado'),
      coalesce(scored.total_points, 0::bigint),
      coalesce(scored.exact_scores, 0::bigint),
      coalesce(scored.predictions, 0::bigint)
    from public.league_members m
    join public.profiles p on p.id = m.user_id
    left join scored on scored.user_id = m.user_id
  )
  select
    scoped.scope_key,
    scoped.user_id,
    rank() over (
      partition by scoped.scope_key
      order by
        scoped.total_points desc,
        scoped.exact_scores desc,
        scoped.predictions desc,
        scoped.display_name asc,
        scoped.user_id
    ) as "position"
  from scoped;
$$;

revoke execute on function public.ranking_positions() from public, anon, authenticated;
grant execute on function public.ranking_positions() to service_role;
