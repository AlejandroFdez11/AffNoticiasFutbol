import { SymbolView } from 'expo-symbols';
import { parseISO } from 'date-fns';
import { useEffect, useState, type ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { TeamBadge } from '@/components/team-badge';
import { ThemedText } from '@/components/themed-text';
import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatMatchTime, relativeDayLabel } from '@/lib/format';
import type { Fixture } from '@/services/api-football/types';

import { MAX_PREDICTED_GOALS } from '../constants';
import { clampGoals } from '../fixtures';
import { draftFromFixture, type Prediction, type PredictionInput } from '../types';

type PredictionCardProps = {
  fixture: Fixture;
  prediction?: Prediction;
  saving?: boolean;
  onSave: (input: PredictionInput) => void;
};

export function PredictionCard({ fixture, prediction, saving = false, onSave }: PredictionCardProps) {
  const theme = useTheme();
  const [homeGoals, setHomeGoals] = useState(prediction?.homeGoals ?? 0);
  const [awayGoals, setAwayGoals] = useState(prediction?.awayGoals ?? 0);

  // Re-sync with the server when the saved score changes, without wiping the
  // user's edits on every background refetch.
  const savedHome = prediction?.homeGoals;
  const savedAway = prediction?.awayGoals;

  useEffect(() => {
    if (savedHome === undefined || savedAway === undefined) {
      return;
    }

    setHomeGoals(savedHome);
    setAwayGoals(savedAway);
  }, [savedHome, savedAway]);

  const dirty = !prediction || prediction.homeGoals !== homeGoals || prediction.awayGoals !== awayGoals;
  const kickoffLabel = `${relativeDayLabel(parseISO(fixture.fixture.date))} · ${formatMatchTime(
    fixture.fixture.date
  )}`;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
      ]}>
      <View style={styles.header}>
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={1} style={styles.league}>
          {fixture.league.name}
        </ThemedText>
        <ThemedText type="smallBold">{kickoffLabel}</ThemedText>
      </View>

      <View style={styles.teams}>
        <TeamSide
          name={fixture.teams.home.name}
          logo={fixture.teams.home.logo}
          goals={homeGoals}
          onChange={setHomeGoals}
        />

        <ThemedText type="small" themeColor="textSecondary" style={styles.versus}>
          vs
        </ThemedText>

        <TeamSide
          name={fixture.teams.away.name}
          logo={fixture.teams.away.logo}
          goals={awayGoals}
          onChange={setAwayGoals}
        />
      </View>

      <Button
        label={prediction ? (dirty ? 'Actualizar pronóstico' : 'Pronóstico guardado') : 'Guardar pronóstico'}
        variant={prediction && !dirty ? 'secondary' : 'primary'}
        disabled={!dirty}
        loading={saving}
        onPress={() =>
          onSave({
            ...draftFromFixture(fixture),
            homeGoals: clampGoals(homeGoals),
            awayGoals: clampGoals(awayGoals),
          })
        }
      />
    </View>
  );
}

type TeamSideProps = {
  name: string;
  logo?: string;
  goals: number;
  onChange: (goals: number) => void;
};

function TeamSide({ name, logo, goals, onChange }: TeamSideProps) {
  return (
    <View style={styles.side}>
      <TeamBadge name={name} logo={logo} size={40} />
      <ThemedText type="smallBold" numberOfLines={2} style={styles.teamName}>
        {name}
      </ThemedText>
      <ScoreStepper label={name} value={goals} onChange={onChange} />
    </View>
  );
}

type ScoreStepperProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
};

function ScoreStepper({ label, value, onChange }: ScoreStepperProps) {
  const theme = useTheme();

  return (
    <View style={styles.stepper}>
      <StepperButton
        icon={{ ios: 'minus', android: 'remove', web: 'remove' }}
        label={`Quitar un gol a ${label}`}
        disabled={value <= 0}
        onPress={() => onChange(clampGoals(value - 1))}
      />
      <ThemedText type="smallBold" style={[styles.goals, { color: theme.brand }]}>
        {value}
      </ThemedText>
      <StepperButton
        icon={{ ios: 'plus', android: 'add', web: 'add' }}
        label={`Sumar un gol a ${label}`}
        disabled={value >= MAX_PREDICTED_GOALS}
        onPress={() => onChange(clampGoals(value + 1))}
      />
    </View>
  );
}

type StepperButtonProps = {
  icon: ComponentProps<typeof SymbolView>['name'];
  label: string;
  disabled: boolean;
  onPress: () => void;
};

function StepperButton({ icon, label, disabled, onPress }: StepperButtonProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.stepperButton,
        { backgroundColor: theme.brandMuted },
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}>
      <SymbolView name={icon} size={16} tintColor={theme.brand} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radii.large,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  league: {
    flex: 1,
  },
  teams: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  side: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.two,
  },
  versus: {
    alignSelf: 'center',
  },
  teamName: {
    textAlign: 'center',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  stepperButton: {
    width: 32,
    height: 32,
    borderRadius: Radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goals: {
    minWidth: 24,
    textAlign: 'center',
    fontSize: 20,
    lineHeight: 24,
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.4,
  },
});
