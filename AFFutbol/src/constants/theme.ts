/**
 * Design tokens for AFFutbol.
 *
 * Colors are defined for light and dark mode. Every key must exist in both
 * palettes so components can safely reference a token from either theme.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#0B1F17',
    textSecondary: '#5B6B63',
    background: '#F6F8F7',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#E6F4EC',
    border: '#E1E8E3',
    brand: '#0B7A4B',
    brandMuted: '#DCF3E6',
    accent: '#B76E00',
    live: '#D92D20',
    success: '#12A05C',
    warning: '#B54708',
    inverseText: '#FFFFFF',
  },
  dark: {
    text: '#F2F7F4',
    textSecondary: '#9BB0A6',
    background: '#07120D',
    backgroundElement: '#0F1E17',
    backgroundSelected: '#163025',
    border: '#1E3329',
    brand: '#3DD68C',
    brandMuted: '#12301F',
    accent: '#FFC24B',
    live: '#FF6B5E',
    success: '#3DD68C',
    warning: '#FFB547',
    inverseText: '#04140C',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radii = {
  small: 8,
  medium: 12,
  large: 20,
  pill: 999,
} as const;

export const Brand = {
  name: 'AFFutbol',
  tagline: 'El fútbol, contigo.',
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
