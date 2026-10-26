/**
 * Date helpers (Master Spec A8). Only day + month are required. Internally a
 * working year orders dates and validates leap days; it never prints unless
 * the quote has a printYear.
 *
 * SHARED FILE — identical copy lives in client/src/wedding-quote/utils/engine/.
 */
export const MAX_DATES = 10;

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const isLeapYear = (year) => (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

export const daysInMonth = (month, year) =>
  month === 2 ? (isLeapYear(year) ? 29 : 28) : [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];

export const isValidDate = ({ day, month, year }) =>
  Number.isInteger(day) && Number.isInteger(month) && Number.isInteger(year) &&
  month >= 1 && month <= 12 && day >= 1 && day <= daysInMonth(month, year);

/** YYYYMMDD from the working year — orders dates across a year boundary. */
export const sortKeyOf = ({ day, month, year }) => year * 10000 + month * 100 + day;

export const sameDate = (a, b) => a.day === b.day && a.month === b.month && a.year === b.year;

export const sortDates = (dates) => [...dates].sort((a, b) => sortKeyOf(a) - sortKeyOf(b));

/**
 * Toggles a date in a selection. Returns { dates, error }. Never exceeds the
 * maximum and keeps chronological order.
 */
export const toggleDate = (dates, date, max = MAX_DATES) => {
  if (!isValidDate(date)) return { dates, error: 'invalid' };
  const exists = dates.some((d) => sameDate(d, date));
  if (exists) return { dates: dates.filter((d) => !sameDate(d, date)), error: null };
  if (dates.length >= max) return { dates, error: 'max' };
  return { dates: sortDates([...dates, date]), error: null };
};

/** Moves a selected date by `delta` positions (manual reorder). */
export const moveItem = (list, index, delta) => {
  const target = index + delta;
  if (target < 0 || target >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(index, 1);
  next.splice(target, 0, item);
  return next;
};

/** Printed year for a date: printYear shifted by how far this date's working year is from the first. */
export const printedYearFor = (date, firstYear, printYear) => {
  if (!printYear) return null;
  return Number(printYear) + ((date.year ?? firstYear) - firstYear);
};

/** "13 December" | "13 DEC" | tile parts. */
export const formatDate = (date, style = 'plain', year = null) => {
  const monthName = MONTHS[date.month - 1] ?? '';
  const short = monthName.slice(0, 3).toUpperCase();
  const y = year ? ` ${year}` : '';
  if (style === 'short' || style === 'pill') return `${date.day} ${short}${y}`;
  if (style === 'tile') return { big: String(date.day), small: short, year: year ? String(year) : '' };
  return `${date.day} ${monthName}${y}`;
};

const nextCalendarDay = ({ day, month, year }) => {
  if (day < daysInMonth(month, year)) return { day: day + 1, month, year };
  if (month < 12) return { day: 1, month: month + 1, year };
  return { day: 1, month: 1, year: year + 1 };
};

/** Same items on the same sides (order-insensitive) → identical signature. */
export const entriesSignature = (entries = []) =>
  entries
    .map((e) => `${e.itemId}|${e.side}|${Math.max(1, Number(e.quantity) || 1)}|${(e.displayName ?? '').trim()}`)
    .sort()
    .join(';');

/**
 * Groups consecutive calendar days whose entries are identical (A8 "grouped").
 * Input days must be in display order; returns [{ days: [day...] }].
 */
export const groupConsecutiveDays = (days, enabled) => {
  if (!enabled) return days.map((day) => ({ days: [day] }));
  const groups = [];
  for (const day of days) {
    const last = groups[groups.length - 1];
    const prev = last?.days[last.days.length - 1];
    if (
      prev && prev.date.year !== undefined && day.date.year !== undefined &&
      sameDate(nextCalendarDay(prev.date), day.date) &&
      entriesSignature(prev.entries) === entriesSignature(day.entries) &&
      (day.entries ?? []).length > 0
    ) {
      last.days.push(day);
    } else {
      groups.push({ days: [day] });
    }
  }
  return groups;
};

/** "28 & 29 January", "28, 29 & 30 January", "31 January & 1 February". */
export const formatDateGroup = (dates, style = 'plain', yearOf = () => null) => {
  if (dates.length === 1) {
    const f = formatDate(dates[0], style, yearOf(dates[0]));
    return typeof f === 'string' ? f : `${f.big} ${f.small}`;
  }
  const short = style === 'short' || style === 'pill' || style === 'tile';
  const monthLabel = (d) => (short ? MONTHS[d.month - 1].slice(0, 3).toUpperCase() : MONTHS[d.month - 1]);
  const sameMonth = dates.every((d) => d.month === dates[0].month && d.year === dates[0].year);
  const join = (parts) => (parts.length <= 1 ? parts.join('') : `${parts.slice(0, -1).join(', ')} & ${parts[parts.length - 1]}`);
  const last = dates[dates.length - 1];
  const y = yearOf(last) ? ` ${yearOf(last)}` : '';
  if (sameMonth) return `${join(dates.map((d) => String(d.day)))} ${monthLabel(last)}${y}`;
  return join(dates.map((d, i) => `${d.day} ${monthLabel(d)}${i === dates.length - 1 ? y : ''}`));
};
