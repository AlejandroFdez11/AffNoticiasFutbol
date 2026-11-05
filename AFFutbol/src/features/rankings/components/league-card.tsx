import { useState } from 'react';
import { Share, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import type { League } from '../types';

type LeagueCardProps = {
  league: League;
  leaving?: boolean;
  onLeave: () => void;
};

export function LeagueCard({ league, leaving = false, onLeave }: LeagueCardProps) {
  const theme = useTheme();
  const [confirming, setConfirming] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const isOwner = league.role === 'owner';
  const membersLabel = `${league.memberCount} ${
    league.memberCount === 1 ? 'miembro' : 'miembros'
  }`;

  const handleShare = async () => {
    setShareError(null);

    try {
      await Share.share({
        message: `Únete a mi liga de AFFutbol «${league.name}» con el código ${league.inviteCode}.`,
      });
    } catch {
      setShareError('No se pudo abrir el menú de compartir. Copia el código a mano.');
    }
  };

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
      ]}>
      <View style={styles.header}>
        <View style={styles.title}>
          <ThemedText type="smallBold" numberOfLines={1}>
            {league.name}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {membersLabel}
          </ThemedText>
        </View>
        <View style={[styles.badge, { backgroundColor: theme.brandMuted }]}>
          <ThemedText type="small" style={{ color: theme.brand }}>
            {isOwner ? 'Creador' : 'Miembro'}
          </ThemedText>
        </View>
      </View>

      <View
        style={[
          styles.codeBox,
          { backgroundColor: theme.backgroundSelected, borderColor: theme.border },
        ]}>
        <View style={styles.codeText}>
          <ThemedText type="small" themeColor="textSecondary">
            Código de invitación
          </ThemedText>
          <ThemedText type="subtitle" style={[styles.code, { color: theme.brand }]}>
            {league.inviteCode}
          </ThemedText>
        </View>
        <Button label="Compartir" variant="secondary" onPress={() => void handleShare()} />
      </View>

      {shareError ? (
        <ThemedText type="small" style={{ color: theme.live }}>
          {shareError}
        </ThemedText>
      ) : null}

      {confirming ? (
        <View style={styles.confirm}>
          <ThemedText type="small" themeColor="textSecondary">
            {isOwner
              ? 'Eres el creador: si sales, la liga se eliminará para todos sus miembros.'
              : 'Dejarás de aparecer en la tabla de esta liga.'}
          </ThemedText>
          <View style={styles.actions}>
            <Button
              label={isOwner ? 'Sí, eliminar' : 'Sí, salir'}
              variant="danger"
              loading={leaving}
              onPress={onLeave}
              style={styles.action}
            />
            <Button
              label="Cancelar"
              variant="ghost"
              disabled={leaving}
              onPress={() => setConfirming(false)}
              style={styles.action}
            />
          </View>
        </View>
      ) : (
        <Button
          label={isOwner ? 'Eliminar liga' : 'Salir de la liga'}
          variant="danger"
          onPress={() => setConfirming(true)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.three,
    padding: Spacing.four,
    borderRadius: Radii.large,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  title: {
    flex: 1,
    gap: Spacing.half,
  },
  badge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Radii.pill,
  },
  codeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radii.medium,
    borderWidth: 1,
  },
  codeText: {
    flex: 1,
    gap: Spacing.half,
  },
  code: {
    letterSpacing: 4,
  },
  confirm: {
    gap: Spacing.two,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  action: {
    flex: 1,
  },
});
