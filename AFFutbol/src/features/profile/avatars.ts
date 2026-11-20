/**
 * Visual identities for the Netflix-style profile picker.
 *
 * These are vector symbols instead of emoji: emoji glyphs were clipped by the
 * text line height inside the big rounded tiles. Symbols scale cleanly at any
 * size and share the same iOS/Material look as the rest of the app.
 *
 * The ids are the database contract — keep them in sync with
 * 20261120000000_profile_avatars.sql.
 */
export const PROFILE_AVATARS = [
  {
    id: 'ball',
    label: 'Balón',
    symbol: { ios: 'soccerball', android: 'sports_soccer', web: 'sports_soccer' },
  },
  {
    id: 'trophy',
    label: 'Trofeo',
    symbol: { ios: 'trophy.fill', android: 'emoji_events', web: 'emoji_events' },
  },
  {
    id: 'star',
    label: 'Estrella',
    symbol: { ios: 'star.fill', android: 'star', web: 'star' },
  },
  {
    id: 'bolt',
    label: 'Rayo',
    symbol: { ios: 'bolt.fill', android: 'bolt', web: 'bolt' },
  },
  {
    id: 'fire',
    label: 'Fuego',
    symbol: { ios: 'flame.fill', android: 'local_fire_department', web: 'local_fire_department' },
  },
  {
    id: 'heart',
    label: 'Corazón',
    symbol: { ios: 'heart.fill', android: 'favorite', web: 'favorite' },
  },
  {
    id: 'shield',
    label: 'Escudo',
    symbol: { ios: 'shield.fill', android: 'shield', web: 'shield' },
  },
  {
    id: 'person',
    label: 'Aficionado',
    symbol: { ios: 'person.crop.circle.fill', android: 'account_circle', web: 'account_circle' },
  },
  {
    id: 'medal',
    label: 'Medalla',
    symbol: { ios: 'medal.fill', android: 'military_tech', web: 'military_tech' },
  },
  {
    id: 'flag',
    label: 'Bandera',
    symbol: { ios: 'flag.fill', android: 'flag', web: 'flag' },
  },
] as const;

export type AvatarId = (typeof PROFILE_AVATARS)[number]['id'];

export const DEFAULT_AVATAR_ID: AvatarId = 'ball';

export function isAvatarId(value: string): value is AvatarId {
  return PROFILE_AVATARS.some((avatar) => avatar.id === value);
}

export function getAvatar(id: string) {
  return PROFILE_AVATARS.find((avatar) => avatar.id === id) ?? PROFILE_AVATARS[0];
}
