-- AFFutbol — avatares vectoriales para los perfiles visuales
--
-- Los emoji se recortaban dentro de las baldosas grandes del selector. Se
-- sustituyen por identificadores de símbolos vectoriales (expo-symbols), que se
-- dibujan nítidos a cualquier tamaño. Los valores anteriores se convierten al
-- avatar más parecido para no perder la elección del usuario.
--
-- Los ids están espejados en src/features/profile/avatars.ts.

update public.account_profiles
set avatar_emoji = case avatar_emoji
  when '⚽' then 'ball'
  when '🏆' then 'trophy'
  when '⚡' then 'bolt'
  when '🔥' then 'fire'
  when '🌟' then 'star'
  when '🦁' then 'shield'
  when '🎯' then 'medal'
  when '🧢' then 'person'
  else 'ball'
end;

alter table public.account_profiles rename column avatar_emoji to avatar_id;

alter table public.account_profiles drop constraint if exists account_profiles_avatar_emoji_check;

alter table public.account_profiles
  alter column avatar_id set default 'ball',
  add constraint account_profiles_avatar_id_check check (
    avatar_id in (
      'ball', 'trophy', 'star', 'bolt', 'fire',
      'heart', 'shield', 'person', 'medal', 'flag'
    )
  );
