import { toDateKey } from '@/lib/format';

import { buildDateRange } from '../date-range';

describe('date range', () => {
  it('centers the range on the given day', () => {
    const range = buildDateRange(2, new Date(2026, 9, 30, 15, 30));

    expect(range).toHaveLength(5);
    expect(range.map(toDateKey)).toEqual([
      '2026-10-28',
      '2026-10-29',
      '2026-10-30',
      '2026-10-31',
      '2026-11-01',
    ]);
  });

  it('starts each day at midnight', () => {
    const range = buildDateRange(1, new Date(2026, 9, 30, 23, 59));

    expect(range.map((day) => day.getHours())).toEqual([0, 0, 0]);
  });
});
