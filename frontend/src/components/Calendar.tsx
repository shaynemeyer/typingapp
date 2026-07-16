import { useState } from 'react';
import type { Result } from '../api/client';
import { buildMonthGrid, dateKey, resultDateSet } from '../lib/calendar';

interface Props {
  results: Result[];
}

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTH_FORMATTER = new Intl.DateTimeFormat(undefined, {
  month: 'long',
  year: 'numeric',
});

export function Calendar({ results }: Props) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const resultDates = resultDateSet(results.map((r) => r.created_at));
  const grid = buildMonthGrid(year, month, resultDates);
  const todayKey = dateKey(today);

  function changeMonth(delta: number) {
    const next = new Date(year, month + delta, 1);
    setYear(next.getFullYear());
    setMonth(next.getMonth());
  }

  return (
    <section className="panel calendar">
      <div className="calendar-header">
        <button type="button" onClick={() => changeMonth(-1)}>
          &lsaquo;
        </button>
        <h2>{MONTH_FORMATTER.format(new Date(year, month, 1))}</h2>
        <button type="button" onClick={() => changeMonth(1)}>
          &rsaquo;
        </button>
      </div>
      <div className="calendar-grid">
        {WEEKDAY_LABELS.map((label, i) => (
          <span key={i} className="calendar-weekday">
            {label}
          </span>
        ))}
        {grid.map((cell) => {
          const key = dateKey(cell.date);
          const classes = ['calendar-day'];
          if (!cell.inMonth) classes.push('out-of-month');
          if (cell.hasActivity) classes.push('active');
          if (key === todayKey) classes.push('today');

          return (
            <span key={key} className={classes.join(' ')}>
              {cell.date.getDate()}
            </span>
          );
        })}
      </div>
    </section>
  );
}
