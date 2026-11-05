import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { EmptyState, ErrorState, LoadingState } from '@/components/state-card';
import { ThemedText } from '@/components/themed-text';
import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import {
  describeRankingError,
  useCreateLeague,
  useJoinLeague,
  useLeagueRanking,
  useLeaveLeague,
  useMyLeagues,
} from '../api';
import type { League } from '../types';
import { LeagueCard } from './league-card';
import { LeagueFormCard } from './league-form-card';
import { RankingTable } from './ranking-table';

type FormMode = 'create' | 'join' | null;

export function PrivateRankingSection() {
  const theme = useTheme();
  const leaguesQuery = useMyLeagues();
  const [selectedLeagueId, setSelectedLeagueId] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<FormMode>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const leagues = leaguesQuery.data ?? [];
  const activeLeague =
    leagues.find((league) => league.id === selectedLeagueId) ?? leagues[0] ?? null;

  const rankingQuery = useLeagueRanking(activeLeague?.id ?? null);
  const createMutation = useCreateLeague();
  const joinMutation = useJoinLeague();
  const leaveMutation = useLeaveLeague();

  if (leaguesQuery.isPending) {
    return <LoadingState message="Cargando tus ligas…" />;
  }

  if (leaguesQuery.isError) {
    return (
      <ErrorState
        title="No se pudieron cargar tus ligas"
        message={describeRankingError(leaguesQuery.error)}
        onRetry={() => void leaguesQuery.refetch()}
      />
    );
  }

  const openForm = (mode: Exclude<FormMode, null>) => {
    setActionError(null);
    setFormMode(mode);
  };

  const handleCreate = (name: string) => {
    setActionError(null);
    createMutation.mutate(name, {
      onSuccess: (league) => {
        setSelectedLeagueId(league.id);
        setFormMode(null);
      },
      onError: (error) => setActionError(describeRankingError(error)),
    });
  };

  const handleJoin = (code: string) => {
    setActionError(null);
    joinMutation.mutate(code, {
      onSuccess: (league) => {
        setSelectedLeagueId(league.id);
        setFormMode(null);
      },
      onError: (error) => setActionError(describeRankingError(error)),
    });
  };

  const handleLeave = () => {
    if (!activeLeague) {
      return;
    }

    setActionError(null);
    leaveMutation.mutate(activeLeague.id, {
      onSuccess: () => setSelectedLeagueId(null),
      onError: (error) => setActionError(describeRankingError(error)),
    });
  };

  const formLoading = createMutation.isPending || joinMutation.isPending;

  return (
    <>
      {activeLeague ? (
        <>
          {leagues.length > 1 ? (
            <LeaguePicker
              leagues={leagues}
              activeLeagueId={activeLeague.id}
              onSelect={(leagueId) => {
                setSelectedLeagueId(leagueId);
                setActionError(null);
              }}
            />
          ) : null}

          <LeagueCard
            league={activeLeague}
            leaving={leaveMutation.isPending && leaveMutation.variables === activeLeague.id}
            onLeave={handleLeave}
          />

          {actionError ? (
            <ThemedText type="small" style={{ color: theme.live }}>
              {actionError}
            </ThemedText>
          ) : null}

          <View style={styles.sectionHeading}>
            <ThemedText type="smallBold">Tabla de la liga</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {activeLeague.memberCount}{' '}
              {activeLeague.memberCount === 1 ? 'miembro' : 'miembros'}
            </ThemedText>
          </View>

          {rankingQuery.isPending ? (
            <LoadingState message="Cargando la tabla…" />
          ) : rankingQuery.isError ? (
            <ErrorState
              title="No se pudo cargar la tabla"
              message={describeRankingError(rankingQuery.error)}
              onRetry={() => void rankingQuery.refetch()}
            />
          ) : (rankingQuery.data ?? []).length === 0 ? (
            <EmptyState
              icon={{ ios: 'person.2', android: 'group', web: 'group' }}
              title="La liga está vacía"
              description="Invita a alguien con el código para empezar a competir."
            />
          ) : (
            <RankingTable entries={rankingQuery.data ?? []} />
          )}
        </>
      ) : (
        <EmptyState
          icon={{ ios: 'person.3', android: 'groups', web: 'groups' }}
          title="Compite con los tuyos"
          description="Crea una liga privada y comparte su código de invitación, o únete con el código de un amigo o compañero de trabajo."
        />
      )}

      {formMode ? (
        <LeagueFormCard
          mode={formMode}
          loading={formLoading}
          error={actionError}
          onSubmit={formMode === 'create' ? handleCreate : handleJoin}
          onValueChange={() => setActionError(null)}
          onCancel={() => {
            setFormMode(null);
            setActionError(null);
          }}
        />
      ) : (
        <View style={styles.actions}>
          <Button
            label={activeLeague ? 'Crear otra liga' : 'Crear liga'}
            variant={activeLeague ? 'secondary' : 'primary'}
            onPress={() => openForm('create')}
            style={styles.action}
          />
          <Button
            label="Unirme con código"
            variant="secondary"
            onPress={() => openForm('join')}
            style={styles.action}
          />
        </View>
      )}

      {!activeLeague ? (
        <ThemedText type="small" themeColor="textSecondary" style={styles.footer}>
          También puedes entrar desde Predicciones: el ranking privado usa los mismos puntos que el
          mundial.
        </ThemedText>
      ) : null}
    </>
  );
}

function LeaguePicker({
  leagues,
  activeLeagueId,
  onSelect,
}: {
  leagues: readonly League[];
  activeLeagueId: string;
  onSelect: (leagueId: string) => void;
}) {
  const theme = useTheme();

  return (
    <View style={styles.picker}>
      {leagues.map((league) => {
        const selected = league.id === activeLeagueId;

        return (
          <Pressable
            key={league.id}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onSelect(league.id)}
            style={({ pressed }) => [
              styles.pickerItem,
              {
                backgroundColor: selected ? theme.brandMuted : theme.backgroundElement,
                borderColor: selected ? theme.brand : theme.border,
              },
              pressed && styles.pressed,
            ]}>
            <ThemedText
              type={selected ? 'smallBold' : 'small'}
              numberOfLines={1}
              style={{ color: selected ? theme.brand : theme.text }}>
              {league.name}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {league.memberCount} {league.memberCount === 1 ? 'miembro' : 'miembros'}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  picker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  pickerItem: {
    flexGrow: 1,
    flexBasis: '45%',
    gap: Spacing.half,
    padding: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Radii.medium,
    borderWidth: 1,
  },
  pressed: {
    opacity: 0.7,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  action: {
    flexGrow: 1,
    flexBasis: '45%',
  },
  footer: {
    textAlign: 'center',
  },
});
