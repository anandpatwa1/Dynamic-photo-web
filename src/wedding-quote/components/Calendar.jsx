import { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui';
import { cn } from '@/utils/cn';
import { MONTHS, daysInMonth, sameDate } from '../utils/engine/dates';

const WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const keyOf = ({ year, month, day }) => `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

const splitBackground = (colors) => {
  if (!colors.length) return undefined;
  if (colors.length === 1) return colors[0];
  const width = 100 / colors.length;
  const stops = colors.flatMap((color, index) => [
    `${color} ${index * width}%`,
    `${color} ${(index + 1) * width}%`,
  ]);
  return `linear-gradient(90deg, ${stops.join(', ')})`;
};

/**
 * Touch-friendly multi-date calendar (A8). The visible year is only a
 * working year for ordering / leap days — it is never printed.
 */
export const Calendar = ({
  view,
  onViewChange,
  selected = [],
  onToggle,
  max = 10,
  bookings = [],
  festivals = [],
  showSelectionOrder = true,
}) => {
  const { month, year } = view;
  const first = (new Date(year, month - 1, 1).getDay() + 6) % 7; // Monday-first
  const total = daysInMonth(month, year);
  const cells = [...Array(first).fill(null), ...Array.from({ length: total }, (_, i) => i + 1)];
  const go = (delta) => {
    const m = month + delta;
    onViewChange(m < 1 ? { month: 12, year: year - 1 } : m > 12 ? { month: 1, year: year + 1 } : { month: m, year });
  };
  const full = selected.length >= max;
  const bookingsByDate = useMemo(() => bookings.reduce((map, booking) => {
    const list = map.get(booking.dateKey) ?? [];
    list.push(booking);
    map.set(booking.dateKey, list);
    return map;
  }, new Map()), [bookings]);
  const festivalsByDate = useMemo(() => festivals.reduce((map, festival) => {
    const list = map.get(festival.dateKey) ?? [];
    list.push(festival);
    map.set(festival.dateKey, list);
    return map;
  }, new Map()), [festivals]);

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
          const dateKey = keyOf(date);
          const index = selected.findIndex((d) => sameDate(d, date));
          const isOn = index !== -1;
          const dayBookings = bookingsByDate.get(dateKey) ?? [];
          const dayFestivals = festivalsByDate.get(dateKey) ?? [];
          const colors = [...new Set(dayBookings.map((booking) => booking.resolvedColor).filter(Boolean))];
          const bookingBackground = splitBackground(colors);
          const hasBookings = dayBookings.length > 0;
          const festivalText = dayFestivals.map((festival) => festival.name).join(', ');
          const bookingText = dayBookings.map((booking) => booking.title || booking.typeName).join(', ');
          return (
            <button
              key={day}
              type="button"
              role="gridcell"
              aria-pressed={isOn}
              aria-label={`${day} ${MONTHS[month - 1]}${dayBookings.length ? `, ${dayBookings.length} booking${dayBookings.length > 1 ? 's' : ''}: ${bookingText}` : ''}${festivalText ? `, ${festivalText}` : ''}`}
              title={[bookingText, festivalText].filter(Boolean).join(' · ') || undefined}
              disabled={!isOn && full}
              onClick={() => onToggle(date)}
              style={hasBookings ? { background: bookingBackground } : undefined}
              className={cn(
                'relative flex aspect-square min-h-12 flex-col items-center justify-center overflow-hidden rounded-xl px-0.5 text-base font-semibold transition-all',
                hasBookings && 'text-white shadow-sm ring-1 ring-inset ring-black/10 hover:brightness-105',
                !hasBookings && (isOn ? 'bg-brand-500 text-white shadow-sm' : 'bg-white text-ink-800 ring-1 ring-inset ring-ink-200 hover:bg-brand-50'),
                isOn && hasBookings && 'ring-2 ring-brand-500 ring-offset-2',
                !isOn && full && 'opacity-40',
              )}
            >
              {hasBookings && <span className="absolute left-1 top-1 rounded-full bg-white/95 px-1 text-2xs font-bold text-ink-800">{dayBookings.length}</span>}
              <span className={cn(hasBookings && 'drop-shadow-sm')}>{day}</span>
              {dayFestivals.length > 0 && (
                <span className={cn('mt-0.5 w-full truncate px-0.5 text-[8px] font-semibold leading-none', hasBookings ? 'text-white/90' : 'text-amber-700')}>
                  {dayFestivals[0].name}{dayFestivals.length > 1 ? ` +${dayFestivals.length - 1}` : ''}
                </span>
              )}
              {isOn && showSelectionOrder && <span className="absolute right-1 top-1 rounded-full bg-white/95 px-1 text-2xs font-bold text-brand-700">{index + 1}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
};
