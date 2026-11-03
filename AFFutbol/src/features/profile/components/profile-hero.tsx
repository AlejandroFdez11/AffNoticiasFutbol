import { SymbolView } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';

import { BrandMark } from '@/components/brand-mark';
import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ProfileHeroProps = {
  onSignIn: () => void;
  onSignUp: () => void;
};

const FEATURES = [
  {
    key: 'predictions',
    title: 'Predicciones',
    description: 'Pronostica los partidos de tu equipo y suma puntos por cada acierto.',
    icon: { ios: 'target', android: 'target', web: 'target' },
  },
  {
    key: 'rankings',
    title: 'Rankings',
    description: 'Compite en el ranking mundial y en ligas privadas con tus amigos.',
    icon: { ios: 'trophy', android: 'emoji_events', web: 'emoji_events' },
  },
  {
    key: 'team',
    title: 'Tu equipo',
    description: 'Elige tu club favorito y personaliza partidos, noticias y estadísticas.',
    icon: { ios: 'heart', android: 'favorite', web: 'favorite' },
  },
] as const;

export function ProfileHero({ onSignIn, onSignUp }: ProfileHeroProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.hero,
          { backgroundColor: theme.backgroundElement, borderColor: theme.border },
        ]}>
        <View style={[styles.logo, { backgroundColor: theme.brandMuted }]}>
          <BrandMark size={52} />
        </View>
        <View style={styles.heroText}>
          <ThemedText type="smallBold" style={{ color: theme.brand }}>
            ÚNETE A AFFUTBOL
          </ThemedText>
          <ThemedText type="subtitle">Tu fútbol, con tu gente</ThemedText>
          <ThemedText themeColor="textSecondary">
            Guarda tus predicciones, elige tu equipo favorito y compite con tus amigos y compañeros
            de trabajo.
          </ThemedText>
        </View>
        <View style={styles.actions}>
          <Button label="Iniciar sesión" onPress={onSignIn} />
          <Button label="Crear cuenta" variant="secondary" onPress={onSignUp} />
        </View>
      </View>

      <View style={styles.features}>
        {FEATURES.map((feature) => (
          <View
            key={feature.key}
            style={[
              styles.feature,
              { backgroundColor: theme.backgroundElement, borderColor: theme.border },
            ]}>
            <View style={[styles.featureIcon, { backgroundColor: theme.brandMuted }]}>
              <SymbolView name={feature.icon} size={22} tintColor={theme.brand} />
            </View>
            <View style={styles.featureText}>
              <ThemedText type="smallBold">{feature.title}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {feature.description}
              </ThemedText>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.three,
  },
  hero: {
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.five,
    borderRadius: Radii.large,
    borderWidth: 1,
  },
  logo: {
    width: 88,
    height: 88,
    borderRadius: Radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroText: {
    alignItems: 'center',
    gap: Spacing.two,
  },
  actions: {
    width: '100%',
    gap: Spacing.two,
  },
  features: {
    gap: Spacing.two,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radii.large,
    borderWidth: 1,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: Radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    flex: 1,
    gap: Spacing.half,
  },
});
