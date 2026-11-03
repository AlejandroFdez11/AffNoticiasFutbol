import { SymbolView } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';

import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { ThemedText } from './themed-text';

type SetupCardProps = {
  title?: string;
  description?: string;
};

/** Shown when the Supabase environment variables are missing. */
export function SupabaseSetupCard({
  title = 'Conecta Supabase para activar las cuentas',
  description = 'Añade EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY a tu archivo .env y reinicia Expo. Después ejecuta la migración de supabase/migrations para crear la tabla de perfiles.',
}: SetupCardProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
      ]}>
      <View style={[styles.icon, { backgroundColor: theme.brandMuted }]}>
        <SymbolView
          name={{ ios: 'key.horizontal', android: 'key', web: 'key' }}
          size={28}
          tintColor={theme.brand}
        />
      </View>
      <View style={styles.text}>
        <ThemedText type="smallBold">{title}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {description}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radii.large,
    borderWidth: 1,
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: Radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    gap: Spacing.one,
  },
});
