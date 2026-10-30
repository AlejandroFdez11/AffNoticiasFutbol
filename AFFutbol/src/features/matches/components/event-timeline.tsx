import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { FixtureEvent } from '@/services/api-football/types';

function eventCopy(event: FixtureEvent) {
  if (event.type === 'Goal') {
    const assist = event.assist.name ? ` · asistencia de ${event.assist.name}` : '';
    const detail =
      event.detail === 'Penalty' ? 'Gol de penalti' : event.detail === 'Own Goal' ? 'Gol en propia' : 'Gol';
    return {
      title: event.player.name ?? detail,
      description: `${detail}${assist}`,
    };
  }

  if (event.type === 'Card') {
    const red = event.detail.toLowerCase().includes('red');
    return {
      title: event.player.name ?? 'Tarjeta',
      description: red ? 'Tarjeta roja' : 'Tarjeta amarilla',
    };
  }

  if (event.type === 'subst') {
    return {
      title: `${event.player.name ?? 'Jugador'} entra`,
      description: event.assist.name ? `${event.assist.name} sale` : 'Cambio',
    };
  }

  return {
    title: event.player.name ?? event.detail,
    description: event.detail,
  };
}

export function EventTimeline({ events }: { events: FixtureEvent[] }) {
  return (
    <View style={styles.timeline}>
      {events.map((event, index) => (
        <EventRow key={`${event.time.elapsed}-${event.type}-${index}`} event={event} />
      ))}
    </View>
  );
}

function EventRow({ event }: { event: FixtureEvent }) {
  const theme = useTheme();
  const copy = eventCopy(event);
  const isGoal = event.type === 'Goal';
  const isCard = event.type === 'Card';
  const isSubst = event.type === 'subst';
  const cardColor = event.detail.toLowerCase().includes('red') ? theme.live : theme.warning;
  const minute = `${event.time.elapsed}${event.time.extra ? `+${event.time.extra}` : ''}'`;

  return (
    <View style={styles.row}>
      <ThemedText type="smallBold" style={styles.minute}>
        {minute}
      </ThemedText>

      <View style={styles.icon}>
        {isCard ? (
          <View style={[styles.card, { backgroundColor: cardColor }]} />
        ) : (
          <SymbolView
            name={
              isGoal
                ? { ios: 'soccerball', android: 'sports_soccer', web: 'sports_soccer' }
                : isSubst
                  ? { ios: 'arrow.left.arrow.right', android: 'swap_horiz', web: 'swap_horiz' }
                  : { ios: 'info.circle', android: 'info', web: 'info' }
            }
            size={16}
            tintColor={isGoal ? theme.brand : theme.textSecondary}
          />
        )}
      </View>

      <View style={styles.body}>
        <ThemedText type="smallBold" numberOfLines={1}>
          {copy.title}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
          {copy.description}
        </ThemedText>
      </View>

      {event.team.logo ? (
        <Image source={{ uri: event.team.logo }} style={styles.logo} contentFit="contain" />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  timeline: {
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  minute: {
    width: 38,
    textAlign: 'right',
  },
  icon: {
    width: 22,
    alignItems: 'center',
  },
  card: {
    width: 10,
    height: 14,
    borderRadius: 2,
  },
  body: {
    flex: 1,
    gap: 1,
  },
  logo: {
    width: 20,
    height: 20,
    borderRadius: Radii.pill,
  },
});
