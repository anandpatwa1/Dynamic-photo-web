const dayMs = 86400000;
const timestamp = key => Date.parse(`${key}T00:00:00Z`);
const dateFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
const label = key => dateFormat.format(new Date(timestamp(key)));

/** Compress only consecutive dates; gaps must never imply a booking. */
export const bookingDateLabel = dates => {
  const sorted = [...new Set(dates)].sort();
  const ranges = [];
  for (const date of sorted) {
    const last = ranges.at(-1);
    if (last && timestamp(date) - timestamp(last[1]) === dayMs) last[1] = date;
    else ranges.push([date, date]);
  }
  return ranges.map(([from, to]) => from === to ? label(from) : `${label(from)} – ${label(to)}`).join(', ');
};

/** Only batch-created entries share identity. Separate saves/legacy rows stay separate. */
export const groupBookings = bookings => {
  const groups = new Map();
  for (const booking of bookings) {
    // A later per-date edit must not hide differences within a batch.
    const key = JSON.stringify([booking.groupId || booking._id, booking.title, booking.typeKey || booking.typeName, booking.resolvedColor, booking.note]);
    if (!groups.has(key)) groups.set(key, { ...booking, dates: [], entries: [] });
    const group = groups.get(key);
    group.dates.push(booking.dateKey);
    group.entries.push(booking);
  }
  return [...groups.values()].map(group => {
    const dates = [...new Set(group.dates)].sort();
    return { ...group, dates, dateKey: dates[0], dateLabel: bookingDateLabel(dates) };
  }).sort((a, b) => a.dateKey.localeCompare(b.dateKey));
};
