import type { FixtureStatistic, FixtureTeamStatistics } from '@/services/api-football/types';

import { STAT_LABELS } from './constants';

export type StatRow = {
  key: string;
  label: string;
  home: string;
  away: string;
  /** Percentage of the total for the home side, used to draw the bar. */
  homeShare: number | null;
};

export function parseStatValue(value: FixtureStatistic['value']): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string') return null;

  const parsed = Number.parseFloat(value.replace('%', '').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

export function formatStatValue(value: FixtureStatistic['value']): string {
  if (value === null || value === undefined || value === '') return '—';
  return String(value);
}

function indexStatistics(team?: FixtureTeamStatistics): Map<string, FixtureStatistic> {
  const map = new Map<string, FixtureStatistic>();
  team?.statistics.forEach((statistic) => map.set(statistic.type, statistic));
  return map;
}

/** Pairs the two teams' statistics into rows ready to render. */
export function buildStatRows(
  home?: FixtureTeamStatistics,
  away?: FixtureTeamStatistics
): StatRow[] {
  const homeStats = indexStatistics(home);
  const awayStats = indexStatistics(away);
  const types = new Set([...homeStats.keys(), ...awayStats.keys()]);

  return Array.from(types).map((type) => {
    const homeValue = homeStats.get(type)?.value ?? null;
    const awayValue = awayStats.get(type)?.value ?? null;
    const homeNumber = parseStatValue(homeValue);
    const awayNumber = parseStatValue(awayValue);
    const total = (homeNumber ?? 0) + (awayNumber ?? 0);

    return {
      key: type,
      label: STAT_LABELS[type] ?? type,
      home: formatStatValue(homeValue),
      away: formatStatValue(awayValue),
      homeShare: total > 0 && homeNumber !== null ? (homeNumber / total) * 100 : null,
    };
  });
}
