import { StyleSheet, View } from 'react-native';

import { Radii, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import type { FormResult } from '../types';

const RESULT_COLOR: Record<FormResult, ThemeColor> = {
  W: 'success',
  D: 'textSecondary',
  L: 'live',
};

const RESULT_LABEL: Record<FormResult, string> = {
  W: 'victoria',
  D: 'empate',
  L: 'derrota',
};

export function FormStrip({ form }: { form: FormResult[] }) {
  const theme = useTheme();

  if (form.length === 0) return null;

  return (
    <View
      accessibilityLabel={`Últimos resultados: ${form
        .map((result) => RESULT_LABEL[result])
        .join(', ')}`}
      style={styles.row}>
      {form.map((result, index) => (
        <View
          key={`${result}-${index}`}
          style={[styles.dot, { backgroundColor: theme[RESULT_COLOR[result]] }]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 2,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: Radii.pill,
  },
});
