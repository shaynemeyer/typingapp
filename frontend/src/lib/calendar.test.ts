import { describe, expect, test } from 'vitest';
import { buildMonthGrid, resultDateSet } from './calendar';

describe('buildMonthGrid', () => {
  test('marks a day with a matching result as active', () => {
    const resultDates = resultDateSet(['2026-07-15T16:02:00Z']);
    const grid = buildMonthGrid(2026, 6, resultDates); // July is month index 6

    const activeDay = grid.find(
      (cell) => cell.inMonth && cell.date.getDate() === 15,
    );
    expect(activeDay?.hasActivity).toBe(true);
  });

  test('does not mark a day with no matching result as active', () => {
    const resultDates = resultDateSet(['2026-07-15T16:02:00Z']);
    const grid = buildMonthGrid(2026, 6, resultDates);

    const inactiveDay = grid.find(
      (cell) => cell.inMonth && cell.date.getDate() === 10,
    );
    expect(inactiveDay?.hasActivity).toBe(false);
  });

  test('always returns a 6x7 grid', () => {
    const grid = buildMonthGrid(2026, 6, new Set());
    expect(grid).toHaveLength(42);
  });
});
