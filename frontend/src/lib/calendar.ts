export interface DayCell {
  date: Date;
  inMonth: boolean;
  hasActivity: boolean;
}

/** Local YYYY-MM-DD key, so activity matching is timezone-consistent with `date`. */
export function dateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** A 6x7 grid covering `month` plus its leading/trailing days from adjacent months. */
export function buildMonthGrid(
  year: number,
  month: number,
  resultDates: Set<string>,
): DayCell[] {
  const firstOfMonth = new Date(year, month, 1);
  const gridStart = new Date(year, month, 1 - firstOfMonth.getDay());

  const cells: DayCell[] = [];
  for (let i = 0; i < 42; i++) {
    const date = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i);
    cells.push({
      date,
      inMonth: date.getMonth() === month,
      hasActivity: resultDates.has(dateKey(date)),
    });
  }
  return cells;
}

export function resultDateSet(createdAtTimestamps: string[]): Set<string> {
  return new Set(createdAtTimestamps.map((ts) => dateKey(new Date(ts))));
}
