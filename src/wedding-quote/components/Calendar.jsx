import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui';
import { cn } from '@/utils/cn';
import { MONTHS, daysInMonth, sameDate } from '../utils/engine/dates';

const WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/**
 * Touch-friendly multi-date calendar (A8). The visible year is only a
 * working year for ordering / leap days — it is never printed.
 */
export const Calendar = ({ view, onViewChange, selected = [], onToggle, max = 10 }) => {
  const { month, year } = view;
  const first = (new Date(year, month - 1, 1).getDay() + 6) % 7; // Monday-first
  const total = daysInMonth(month, year);
  const cells = [...Array(first).fill(null), ...Array.from({ length: total }, (_, i) => i + 1)];
  const go = (delta) => {
    const m = month + delta;
    onViewChange(m < 1 ? { month: 12, year: year - 1 } : m > 12 ? { month: 1, year: year + 1 } : { month: m, year });
  };
  const full = selected.length >= max;

  return (
    <div className="select-none">
      <div className="mb-3 flex items-center justify-between">
        <Button variant="ghost" iconOnly icon={ChevronLeft} onClick={() => go(-1)} aria-label="Previous month" />
        <p className="text-lg font-semibold text-ink-900" aria-live="polite">
          {MONTHS[month - 1]} <span className="text-ink-400">{year}</span>
        </p>
        <Button variant="ghost" iconOnly icon={ChevronRight} onClick={() => go(1)} aria-label="Next month" />
      </div>
      <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-medium uppercase tracking-wide text-ink-400">
        {WEEK.map((d) => <div key={d} className="py-1">{d}</div>)}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1.5" role="grid">
        {cells.map((day, i) => {
          if (!day) return <div key={`b${i}`} />;
          const date = { day, month, year };
          const index = selected.findIndex((d) => sameDate(d, date));
          const isOn = index !== -1;
          return (
            <button
              key={day}
              type="button"
              role="gridcell"
              aria-pressed={isOn}
              aria-label={`${day} ${MONTHS[month - 1]}`}
              disabled={!isOn && full}
              onClick={() => onToggle(date)}
              className={cn(
                'relative flex aspect-square min-h-11 items-center justify-center rounded-xl text-base font-semibold transition-all',
                isOn ? 'bg-brand-500 text-white shadow-sm' : 'bg-white text-ink-800 ring-1 ring-inset ring-ink-200 hover:bg-brand-50',
                !isOn && full && 'opacity-40',
              )}
            >
              {day}
              {isOn && <span className="absolute right-1 top-1 rounded-full bg-white/90 px-1 text-2xs font-bold text-brand-700">{index + 1}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
};
