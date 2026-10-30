import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useEffect, useMemo, useRef } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type ScrollViewInstance,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatLongDate, toDateKey } from '@/lib/format';

import { DATE_STRIP_RADIUS } from '../constants';
import { buildDateRange } from '../date-range';

const CHIP_WIDTH = 52;
const CHIP_GAP = Spacing.two;
const HORIZONTAL_PADDING = Spacing.half;

type DateStripProps = {
  selectedDate: Date;
  onSelect: (date: Date) => void;
};

export function DateStrip({ selectedDate, onSelect }: DateStripProps) {
  const theme = useTheme();
  const scrollRef = useRef<ScrollViewInstance | null>(null);
  const days = useMemo(() => buildDateRange(DATE_STRIP_RADIUS), []);
  const selectedKey = toDateKey(selectedDate);
  const todayKey = toDateKey(new Date());

  useEffect(() => {
    const index = days.findIndex((day) => toDateKey(day) === selectedKey);
    if (index < 0) return;

    scrollRef.current?.scrollTo({
      x: Math.max(0, index * (CHIP_WIDTH + CHIP_GAP) - CHIP_WIDTH * 2),
      animated: true,
    });
  }, [days, selectedKey]);

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}>
      {days.map((day) => {
        const key = toDateKey(day);
        const selected = key === selectedKey;
        const isToday = key === todayKey;
        const weekday = format(day, 'EEE', { locale: es }).replace('.', '').toUpperCase();
        const dayNumber = format(day, 'd');

        return (
          <Pressable
            key={key}
            accessibilityRole="button"
            accessibilityLabel={formatLongDate(day)}
            accessibilityState={{ selected }}
            onPress={() => onSelect(day)}
            style={({ pressed }) => [
              styles.chip,
              {
                backgroundColor: selected ? theme.brand : theme.backgroundElement,
                borderColor: selected ? theme.brand : isToday ? theme.brand : theme.border,
              },
              pressed && styles.pressed,
            ]}>
            <ThemedText
              type="small"
              style={[
                styles.weekday,
                { color: selected ? theme.inverseText : theme.textSecondary },
              ]}>
              {weekday}
            </ThemedText>
            <ThemedText
              type="smallBold"
              style={[styles.dayNumber, { color: selected ? theme.inverseText : theme.text }]}>
              {dayNumber}
            </ThemedText>
            {isToday ? (
              <View
                style={[
                  styles.todayDot,
                  { backgroundColor: selected ? theme.inverseText : theme.brand },
                ]}
              />
            ) : (
              <View style={styles.todayDot} />
            )}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: CHIP_GAP,
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingVertical: Spacing.half,
  },
  chip: {
    width: CHIP_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.half,
    paddingVertical: Spacing.two,
    borderRadius: Radii.medium,
    borderWidth: 1,
  },
  weekday: {
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.4,
  },
  dayNumber: {
    fontSize: 18,
    lineHeight: 22,
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: Radii.pill,
  },
  pressed: {
    opacity: 0.7,
  },
});
