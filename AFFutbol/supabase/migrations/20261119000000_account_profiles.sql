-- AFFutbol — perfiles visuales por cuenta (máximo 3)
--
-- `public.profiles` sigue siendo la identidad de la cuenta (nombre de usuario,
-- equipo favorito y datos usados por pronósticos y rankings). Esta tabla añade
-- hasta tres identidades visuales estilo Netflix: nombre, avatar, color y equipo
-- favorito propios. El avatar se guarda como id vectorial desde la migración
-- 20261120000000. El progreso (puntos, ligas, notificaciones) sigue
-- perteneciendo a la cuenta, no al perfil activo.

create table if not exists public.account_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 20),
  avatar_emoji text not null default '⚽' check (char_length(avatar_emoji) between 1 and 8),
  avatar_color text not null default 'brand' check (
    avatar_color in ('brand', 'accent', 'live', 'success', 'warning', 'pitch')
  ),
  favorite_team_id integer,
  favorite_team_name text,
  favorite_team_logo text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint account_profiles_user_name_key unique (user_id, name)
);

create index if not exists account_profiles_user_id_created_at_idx
  on public.account_profiles (user_id, created_at);

alter table public.account_profiles enable row level security;

drop policy if exists "Users can read their own account profiles" on public.account_profiles;
create policy "Users can read their own account profiles"
  on public.account_profiles
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can create their own account profiles" on public.account_profiles;
create policy "Users can create their own account profiles"
  on public.account_profiles
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own account profiles" on public.account_profiles;
create policy "Users can update their own account profiles"
  on public.account_profiles
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own account profiles" on public.account_profiles;
create policy "Users can delete their own account profiles"
  on public.account_profiles
  for delete
  using (auth.uid() = user_id);

-- The limit lives in the database so a patched client cannot bypass it. The
-- message is part of the client/server contract (mirrored in
-- src/features/profile/account-profiles-api.ts).
create or replace function public.enforce_account_profile_limit()
returns trigger
language plpgsql
as $$
begin
  if (select count(*) from public.account_profiles where user_id = new.user_id) >= 3 then
    raise exception 'account_profile_limit' using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists account_profiles_limit on public.account_profiles;
create trigger account_profiles_limit
  before insert on public.account_profiles
  for each row
  execute function public.enforce_account_profile_limit();

drop trigger if exists account_profiles_set_updated_at on public.account_profiles;
create trigger account_profiles_set_updated_at
  before update on public.account_profiles
  for each row
  execute function public.set_updated_at();

-- Every account starts with one visual profile based on the existing account
-- profile. SECURITY DEFINER is needed to read the email from auth.users.
create or replace function public.handle_new_account_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  account_email text;
begin
  if exists (select 1 from public.account_profiles where user_id = new.id) then
    return new;
  end if;

  select email into account_email from auth.users where id = new.id;

  insert into public.account_profiles (user_id, name, favorite_team_id, favorite_team_name, favorite_team_logo)
  values (
    new.id,
    left(coalesce(nullif(trim(new.display_name), ''), nullif(split_part(coalesce(account_email, ''), '@', 1), ''), 'Aficionado'), 20),
    new.favorite_team_id,
    new.favorite_team_name,
    new.favorite_team_logo
  );

  return new;
end;
$$;

drop trigger if exists profiles_create_account_profile on public.profiles;
create trigger profiles_create_account_profile
  after insert on public.profiles
  for each row
  execute function public.handle_new_account_profile();

-- Accounts created before this migration already have their `profiles` row.
insert into public.account_profiles (user_id, name, favorite_team_id, favorite_team_name, favorite_team_logo)
select
  p.id,
  left(coalesce(nullif(trim(p.display_name), ''), nullif(split_part(coalesce(u.email, ''), '@', 1), ''), 'Aficionado'), 20),
  p.favorite_team_id,
  p.favorite_team_name,
  p.favorite_team_logo
from public.profiles p
join auth.users u on u.id = p.id
on conflict (user_id, name) do nothing;

grant select, insert, update, delete on public.account_profiles to authenticated;
