import { addDays, startOfDay } from 'date-fns';

/** Builds a centered range of days, e.g. `radius=7` returns 15 days. */
export function buildDateRange(radius: number, today = new Date()): Date[] {
  const start = startOfDay(today);
  return Array.from({ length: radius * 2 + 1 }, (_, index) => addDays(start, index - radius));
}
