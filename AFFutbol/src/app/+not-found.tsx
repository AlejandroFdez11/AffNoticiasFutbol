import { Link, Stack } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { Screen } from '@/components/screen';
import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radii, Spacing } from '@/constants/theme';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'No encontrado' }} />
      <Screen>
        <ScreenHeader
          eyebrow="AFFutbol"
          title="Pantalla no encontrada"
          subtitle="La ruta que buscas no existe o se ha movido de sitio."
        />
        <Link href="/" asChild>
          <Pressable style={({ pressed }) => pressed && styles.pressed}>
            <ThemedView type="brand" style={styles.button}>
              <ThemedText type="smallBold" themeColor="inverseText">
                Volver a Partidos
              </ThemedText>
            </ThemedView>
          </Pressable>
        </Link>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderRadius: Radii.pill,
  },
  pressed: {
    opacity: 0.8,
  },
});
