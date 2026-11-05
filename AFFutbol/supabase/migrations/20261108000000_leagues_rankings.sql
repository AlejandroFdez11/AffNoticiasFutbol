-- AFFutbol — Phase 5: global ranking and private leagues
--
-- Two leaderboards:
--   * global  -> every user with at least one prediction
--   * private -> members of a league, joined with an invite code
--
-- Predictions are private (Phase 4 RLS only lets a user read their own rows),
-- so the aggregates are exposed through SECURITY DEFINER functions. They never
-- return individual predictions: only points and counters.
--
-- Leagues are private too: only members can read a league and its member list.
-- Creating, joining and leaving happen through functions so invite codes are
-- never enumerated by the client.

create table if not exists public.leagues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null unique,
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint leagues_name_length check (char_length(btrim(name)) between 3 and 40),
  constraint leagues_invite_code_format check (invite_code ~ '^[A-Z2-9]{6}$')
);

create table if not exists public.league_members (
  league_id uuid not null references public.leagues (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default timezone('utc', now()),
  primary key (league_id, user_id)
);

create index if not exists league_members_user_idx
  on public.league_members (user_id);

drop trigger if exists leagues_set_updated_at on public.leagues;
create trigger leagues_set_updated_at
  before update on public.leagues
  for each row
  execute function public.set_updated_at();

alter table public.leagues enable row level security;
alter table public.league_members enable row level security;

-- Helper used by the RLS policies below. It is SECURITY DEFINER so a policy on
-- `league_members` can check membership without recursing into the same table.
create or replace function public.is_league_member(p_league_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.league_members
    where league_id = p_league_id
      and user_id = auth.uid()
  );
$$;

revoke execute on function public.is_league_member(uuid) from public, anon;
grant execute on function public.is_league_member(uuid) to authenticated;

drop policy if exists "Members read their leagues" on public.leagues;
create policy "Members read their leagues"
  on public.leagues
  for select
  to authenticated
  using (public.is_league_member(id));

drop policy if exists "Owners rename their leagues" on public.leagues;
create policy "Owners rename their leagues"
  on public.leagues
  for update
  to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

drop policy if exists "Members read league members" on public.league_members;
create policy "Members read league members"
  on public.league_members
  for select
  to authenticated
  using (public.is_league_member(league_id));

-- Direct writes are forbidden: create_league(), join_league() and
-- leave_league() are the only entry points. Owners may only rename a league.
revoke all on public.leagues from anon, authenticated;
revoke all on public.league_members from anon, authenticated;
grant select on public.leagues to authenticated;
grant update (name) on public.leagues to authenticated;
grant select on public.league_members to authenticated;

-- Human-friendly code: no O/0/I/1 to avoid transcription mistakes.
create or replace function public.generate_invite_code()
returns text
language plpgsql
volatile
set search_path = public
as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code text;
  i integer;
begin
  loop
    code := '';

    for i in 1..6 loop
      code := code || substr(alphabet, 1 + floor(random() * length(alphabet))::integer, 1);
    end loop;

    exit when not exists (select 1 from public.leagues where invite_code = code);
  end loop;

  return code;
end;
$$;

revoke execute on function public.generate_invite_code() from public, anon, authenticated;

create or replace function public.create_league(p_name text)
returns public.leagues
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text := btrim(coalesce(p_name, ''));
  v_league public.leagues;
begin
  if auth.uid() is null then
    raise exception 'Inicia sesión para crear una liga.' using errcode = '42501';
  end if;

  if char_length(v_name) < 3 or char_length(v_name) > 40 then
    raise exception 'El nombre de la liga debe tener entre 3 y 40 caracteres.'
      using errcode = '22023';
  end if;

  insert into public.leagues (name, invite_code, owner_id)
  values (v_name, public.generate_invite_code(), auth.uid())
  returning * into v_league;

  insert into public.league_members (league_id, user_id, role)
  values (v_league.id, auth.uid(), 'owner');

  return v_league;
end;
$$;

create or replace function public.join_league(p_code text)
returns public.leagues
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text := upper(btrim(coalesce(p_code, '')));
  v_league public.leagues;
begin
  if auth.uid() is null then
    raise exception 'Inicia sesión para unirte a una liga.' using errcode = '42501';
  end if;

  if v_code !~ '^[A-Z0-9]{6}$' then
    raise exception 'El código de invitación no es válido.' using errcode = '22023';
  end if;

  select *
  into v_league
  from public.leagues
  where invite_code = v_code;

  if not found then
    raise exception 'No existe ninguna liga con ese código.' using errcode = 'P0002';
  end if;

  insert into public.league_members (league_id, user_id, role)
  values (v_league.id, auth.uid(), 'member')
  on conflict (league_id, user_id) do nothing;

  return v_league;
end;
$$;

-- The owner leaving deletes the league (and its members, via cascade).
-- Everybody else only removes their own membership.
create or replace function public.leave_league(p_league_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Inicia sesión para salir de una liga.' using errcode = '42501';
  end if;

  select owner_id
  into v_owner_id
  from public.leagues
  where id = p_league_id;

  if not found then
    raise exception 'La liga no existe o ya se ha eliminado.' using errcode = 'P0002';
  end if;

  if v_owner_id = auth.uid() then
    delete from public.leagues where id = p_league_id;
  else
    delete from public.league_members
    where league_id = p_league_id
      and user_id = auth.uid();
  end if;
end;
$$;

create or replace function public.my_leagues()
returns table (
  id uuid,
  name text,
  invite_code text,
  owner_id uuid,
  role text,
  member_count bigint,
  joined_at timestamptz,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    l.id,
    l.name,
    l.invite_code,
    l.owner_id,
    m.role,
    (
      select count(*)
      from public.league_members total
      where total.league_id = l.id
    ) as member_count,
    m.joined_at,
    l.created_at
  from public.league_members m
  join public.leagues l on l.id = m.league_id
  where m.user_id = auth.uid()
  order by m.joined_at asc;
$$;

-- Shared shape of both leaderboards.
create or replace function public.global_ranking(p_limit integer default 50)
returns table (
  rank bigint,
  user_id uuid,
  display_name text,
  username text,
  avatar_url text,
  favorite_team_id integer,
  favorite_team_name text,
  favorite_team_logo text,
  total_points bigint,
  predictions bigint,
  settled bigint,
  exact_scores bigint,
  is_me boolean
)
language sql
stable
security definer
set search_path = public
as $$
  with scores as (
    select
      p.id as user_id,
      coalesce(nullif(btrim(p.display_name), ''), p.username, 'Aficionado') as display_name,
      p.username,
      p.avatar_url,
      p.favorite_team_id,
      p.favorite_team_name,
      p.favorite_team_logo,
      coalesce(sum(pr.points), 0)::bigint as total_points,
      count(pr.id)::bigint as predictions,
      (count(pr.id) filter (where pr.status = 'settled'))::bigint as settled,
      (count(pr.id) filter (where pr.status = 'settled' and pr.points = 10))::bigint as exact_scores
    from public.profiles p
    join public.predictions pr on pr.user_id = p.id
    group by
      p.id,
      p.display_name,
      p.username,
      p.avatar_url,
      p.favorite_team_id,
      p.favorite_team_name,
      p.favorite_team_logo
  ),
  ranked as (
    select
      rank() over (
        order by
          scores.total_points desc,
          scores.exact_scores desc,
          scores.predictions desc,
          scores.display_name asc,
          scores.user_id
      ) as position,
      scores.*
    from scores
  )
  select
    ranked.position as rank,
    ranked.user_id,
    ranked.display_name,
    ranked.username,
    ranked.avatar_url,
    ranked.favorite_team_id,
    ranked.favorite_team_name,
    ranked.favorite_team_logo,
    ranked.total_points,
    ranked.predictions,
    ranked.settled,
    ranked.exact_scores,
    ranked.user_id = auth.uid() as is_me
  from ranked
  where ranked.position <= greatest(coalesce(p_limit, 50), 0)
    or ranked.user_id = auth.uid()
  order by ranked.position asc;
$$;

create or replace function public.league_ranking(p_league_id uuid)
returns table (
  rank bigint,
  user_id uuid,
  display_name text,
  username text,
  avatar_url text,
  favorite_team_id integer,
  favorite_team_name text,
  favorite_team_logo text,
  total_points bigint,
  predictions bigint,
  settled bigint,
  exact_scores bigint,
  is_me boolean
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or not public.is_league_member(p_league_id) then
    raise exception 'No perteneces a esta liga.' using errcode = '42501';
  end if;

  return query
  with scores as (
    select
      m.user_id,
      coalesce(nullif(btrim(p.display_name), ''), p.username, 'Aficionado') as display_name,
      p.username,
      p.avatar_url,
      p.favorite_team_id,
      p.favorite_team_name,
      p.favorite_team_logo,
      coalesce(sum(pr.points), 0)::bigint as total_points,
      count(pr.id)::bigint as predictions,
      (count(pr.id) filter (where pr.status = 'settled'))::bigint as settled,
      (count(pr.id) filter (where pr.status = 'settled' and pr.points = 10))::bigint as exact_scores
    from public.league_members m
    join public.profiles p on p.id = m.user_id
    left join public.predictions pr on pr.user_id = m.user_id
    where m.league_id = p_league_id
    group by
      m.user_id,
      p.display_name,
      p.username,
      p.avatar_url,
      p.favorite_team_id,
      p.favorite_team_name,
      p.favorite_team_logo
  ),
  ranked as (
    select
      rank() over (
        order by
          scores.total_points desc,
          scores.exact_scores desc,
          scores.predictions desc,
          scores.display_name asc,
          scores.user_id
      ) as position,
      scores.*
    from scores
  )
  select
    ranked.position as rank,
    ranked.user_id,
    ranked.display_name,
    ranked.username,
    ranked.avatar_url,
    ranked.favorite_team_id,
    ranked.favorite_team_name,
    ranked.favorite_team_logo,
    ranked.total_points,
    ranked.predictions,
    ranked.settled,
    ranked.exact_scores,
    ranked.user_id = auth.uid() as is_me
  from ranked
  order by ranked.position asc;
end;
$$;

revoke execute on function public.create_league(text) from public, anon;
revoke execute on function public.join_league(text) from public, anon;
revoke execute on function public.leave_league(uuid) from public, anon;
revoke execute on function public.my_leagues() from public, anon;
revoke execute on function public.global_ranking(integer) from public, anon;
revoke execute on function public.league_ranking(uuid) from public, anon;

grant execute on function public.create_league(text) to authenticated;
grant execute on function public.join_league(text) to authenticated;
grant execute on function public.leave_league(uuid) to authenticated;
grant execute on function public.my_leagues() to authenticated;
grant execute on function public.global_ranking(integer) to authenticated;
grant execute on function public.league_ranking(uuid) to authenticated;
