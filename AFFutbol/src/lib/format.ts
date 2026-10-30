import { format, isToday, isTomorrow, isYesterday, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/** API-Football expects dates as `yyyy-MM-dd`. */
export function toDateKey(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/** Example: `Viernes, 30 de octubre`. */
export function formatLongDate(date: Date): string {
  return capitalize(format(date, "EEEE, d 'de' MMMM", { locale: es }));
}

/** Example: `Vie 30 oct`. */
export function formatShortDate(date: Date): string {
  return capitalize(format(date, 'EEE d MMM', { locale: es }));
}

/** Example: `Hoy`, `Mañana`, `Ayer` or `Vie 30 oct`. */
export function relativeDayLabel(date: Date): string {
  if (isToday(date)) return 'Hoy';
  if (isTomorrow(date)) return 'Mañana';
  if (isYesterday(date)) return 'Ayer';
  return formatShortDate(date);
}

/** Example: `21:00` for an ISO date returned by the football API. */
export function formatMatchTime(isoDate: string): string {
  return format(parseISO(isoDate), 'HH:mm');
}
