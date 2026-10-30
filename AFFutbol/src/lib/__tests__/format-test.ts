import { formatLongDate, formatMatchTime, relativeDayLabel, toDateKey } from '../format';

describe('date formatting', () => {
  const friday = new Date(2026, 9, 30, 12, 0, 0);

  it('formats API date keys as yyyy-MM-dd', () => {
    expect(toDateKey(friday)).toBe('2026-10-30');
  });

  it('formats long dates in Spanish with a capital letter', () => {
    expect(formatLongDate(friday)).toBe('Viernes, 30 de octubre');
  });

  it('labels the current day as today', () => {
    expect(relativeDayLabel(new Date())).toBe('Hoy');
  });

  it('formats match times as HH:mm', () => {
    expect(formatMatchTime('2026-10-30T21:00:00')).toBe('21:00');
  });
});
