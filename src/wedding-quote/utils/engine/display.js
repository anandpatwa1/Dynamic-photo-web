/**
 * Turns quote data into the printable strings the canvas draws. Pure.
 * SHARED FILE — identical copy lives in client/src/wedding-quote/utils/engine/.
 */
import { collectNotes } from './notes.js';
import { computePricing } from './pricing.js';
import { formatINR } from './money.js';
import { formatDate, formatDateGroup, groupConsecutiveDays, printedYearFor } from './dates.js';

export const SIDE_LABEL = { none: '', bride: 'Bride', groom: 'Groom', both: 'Both Sides' };
const SIDE_ORDER = { none: 0, groom: 1, bride: 2, both: 3 };

const entryName = (entry) => (entry.displayName?.trim() || entry.itemSnapshot?.name || '').trim();

/**
 * One printed line per item on a date. Bride and groom entries of the same
 * item share a line ("Photo + Video (Groom) || Photo + Video (Bride)"); they
 * are still separate entries for pricing. Sides are never inferred.
 */
export const dayLines = (entries = [], { showSides = true } = {}) => {
  const groups = new Map();
  for (const entry of entries) {
    const key = String(entry.itemId ?? entryName(entry));
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(entry);
  }
  return [...groups.entries()].map(([key, list]) => {
    const merged = [];
    for (const entry of list) {
      const same = merged.find((candidate) => candidate.side === entry.side && (candidate.displayName ?? '') === (entry.displayName ?? ''));
      if (same) {
        same.quantity = Math.min(99, (Number(same.quantity) || 1) + Math.max(1, Number(entry.quantity) || 1));
        same._entryIds = [...(same._entryIds ?? []), String(entry._id)];
      } else merged.push({ ...entry, quantity: Math.max(1, Number(entry.quantity) || 1), _entryIds: [String(entry._id)] });
    }
    const ordered = merged.sort((a, b) => (SIDE_ORDER[a.side] ?? 9) - (SIDE_ORDER[b.side] ?? 9));
    const parts = ordered.map((entry) => {
      const name = entryName(entry);
      const quantity = Math.max(1, Number(entry.quantity) || 1);
      const printedName = quantity > 1 ? `${quantity} × ${name}` : name;
      if (!showSides || entry.side === 'none') return printedName;
      if (entry.side === 'both') return `${printedName} — ${SIDE_LABEL.both}`;
      return `${printedName} (${SIDE_LABEL[entry.side] ?? entry.side})`;
    });
    // Without side labels, identical names would repeat; collapse them.
    const unique = showSides ? parts : [...new Set(parts)];
    return { key, text: unique.join(' || '), entryIds: ordered.flatMap((e) => e._entryIds ?? [String(e._id)]) };
  });
};

/**
 * Everything the renderer prints, already resolved against textOverrides.
 * `dateStyle` comes from the theme.
 */
export const buildPrintModel = (quote = {}, { dateStyle = 'plain', studio = {} } = {}) => {
  const t = quote.textOverrides ?? {};
  const opts = quote.layout?.options ?? {};
  const showSides = opts.showSides !== false;
  const days = quote.days ?? [];
  const firstYear = days[0]?.date?.year;
  const yearOf = (date) => printedYearFor(date, firstYear ?? date.year, quote.printYear);

  const groups = groupConsecutiveDays(days, Boolean(opts.groupDates)).map((group) => {
    const head = group.days[0];
    const key = group.days.map((d) => String(d._id)).join('+');
    const dates = group.days.map((d) => d.date);
    const tile = group.days.length === 1 && dateStyle === 'tile' ? formatDate(head.date, 'tile', yearOf(head.date)) : null;
    const label = t[`date.${key}`] ?? formatDateGroup(dates, dateStyle, yearOf);
    const lines = dayLines(head.entries, { showSides }).map((line) => ({
      ...line,
      path: `line.${key}.${line.key}`,
      text: t[`line.${key}.${line.key}`] ?? line.text,
    }));
    return { key, dayIds: group.days.map((d) => String(d._id)), label, labelPath: `date.${key}`, tile, lines };
  });

  const pricing = computePricing(quote);
  const addOn = quote.addOn?.snapshot ?? null;
  const company = studio ?? {};
  const city = company.address?.city ?? company.city ?? '';
  const defaultFooter = [company.name, company.phone, city].filter(Boolean).join('  •  ');

  return {
    title: t.title ?? quote.packageSnapshot?.name ?? '',
    subtitle: t.subtitle ?? quote.packageSnapshot?.subtitle ?? '',
    description: t.description ?? quote.packageSnapshot?.description ?? '',
    dates: groups,
    deliverablesHeading: t.deliverablesHeading ?? 'Deliverables',
    deliverables: (quote.deliverables?.lines ?? [])
      .filter((line) => String(line.text ?? '').trim())
      .map((line) => ({ id: String(line._id), text: line.text, isAuto: Boolean(line.isAuto) })),
    addOn: addOn
      ? {
          badge: t['addOn.badge'] ?? addOn.badge ?? '',
          title: t['addOn.title'] ?? addOn.title ?? '',
          text: t['addOn.text'] ?? addOn.text ?? '',
          // Printed only; it never touches the totals.
          price: t['addOn.price'] ?? (Number(addOn.priceAmount) > 0 ? `Add ${formatINR(addOn.priceAmount)}` : ''),
        }
      : null,
    price: {
      mrp: pricing.display.mrp,
      selling: pricing.display.selling,
      mrpText: t['price.mrp'] ?? formatINR(pricing.display.mrp),
      sellingText: t['price.selling'] ?? formatINR(pricing.display.selling),
      // Struck-through MRP only makes sense when it is above the selling price.
      showMrp: pricing.display.mrp > pricing.display.selling,
    },
    notes: collectNotes(quote),
    footer: t.footer ?? defaultFooter,
    dayCount: days.length,
  };
};
