import { SymbolView } from 'expo-symbols';
import { type ComponentProps } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type SymbolName = ComponentProps<typeof SymbolView>['name'];

type StateCardProps = {
  icon: SymbolName;
  title: string;
  description: string;
  action?: {
    label: string;
    onPress: () => void;
  };
};

function StateCard({ icon, title, description, action }: StateCardProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
      ]}>
      <SymbolView name={icon} size={36} tintColor={theme.textSecondary} />
      <ThemedText type="smallBold" style={styles.center}>
        {title}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
        {description}
      </ThemedText>
      {action ? (
        <Pressable
          accessibilityRole="button"
          onPress={action.onPress}
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: theme.brand },
            pressed && styles.pressed,
          ]}>
          <ThemedText type="smallBold" style={{ color: theme.inverseText }}>
            {action.label}
          </ThemedText>
        </Pressable>
      ) : null}
    </View>
  );
}

export function EmptyState(props: Omit<StateCardProps, 'action'>) {
  return <StateCard {...props} />;
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <StateCard
      icon={{ ios: 'exclamationmark.triangle', android: 'warning', web: 'warning' }}
      title="No se pudieron cargar los partidos"
      description={message}
      action={{ label: 'Reintentar', onPress: onRetry }}
    />
  );
}

export function LoadingState({ message = 'Cargando…' }: { message?: string }) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.card,
        styles.loading,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
      ]}>
      <ActivityIndicator color={theme.brand} />
      <ThemedText type="small" themeColor="textSecondary">
        {message}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.five,
    borderRadius: Radii.large,
    borderWidth: 1,
  },
  loading: {
    paddingVertical: Spacing.five,
  },
  center: {
    textAlign: 'center',
    maxWidth: 360,
  },
  button: {
    marginTop: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: Radii.pill,
  },
  pressed: {
    opacity: 0.7,
  },
});
