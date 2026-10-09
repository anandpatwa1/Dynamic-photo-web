/**
 * Pricing engine (Master Spec A5). Pure, integer rupees.
 *
 * SHARED FILE — identical copy lives in client/src/wedding-quote/utils/engine/.
 */
import { toRupees, toSignedRupees } from './money.js';

const KEYS = ['selling', 'cost', 'mrp'];
const FIELD = { selling: 'sellingPrice', cost: 'costPrice', mrp: 'mrpPrice' };

const zero = () => ({ selling: 0, cost: 0, mrp: 0 });
const pricesOf = (source = {}) => ({
  selling: toRupees(source[FIELD.selling]),
  cost: toRupees(source[FIELD.cost]),
  mrp: toRupees(source[FIELD.mrp]),
});
const quantityOf = (entry) => Math.max(1, Math.min(99, Math.round(Number(entry?.quantity) || 1)));
const add = (a, b) => ({ selling: a.selling + b.selling, cost: a.cost + b.cost, mrp: a.mrp + b.mrp });

/** Per-quote switch: add the snapshotted add-on price to the automatic total. */
export const addOnEffect = (addOn) => {
  const snapshot = addOn?.snapshot ?? addOn;
  return snapshot?.includeInTotal ? toRupees(snapshot.priceAmount) : 0;
};

/** Override wins only when it is a real number; null/'' means "use auto". */
const pickOverride = (value) =>
  value === null || value === undefined || value === '' || !Number.isFinite(Number(value))
    ? null
    : toRupees(value);

/**
 * Full computation for a quote-shaped object.
 * @returns { auto, display, override, delta, profit, marginPct, breakdown }
 */
export const computePricing = (quote = {}) => {
  const breakdownDays = (quote.days ?? []).map((day) => {
    const entries = (day.entries ?? []).map((entry) => ({
      entryId: entry._id,
      itemId: entry.itemId,
      name: entry.itemSnapshot?.name ?? '',
      side: entry.side,
      ...Object.fromEntries(Object.entries(pricesOf(entry.itemSnapshot)).map(([key, value]) => [key, value * quantityOf(entry)])),
      quantity: quantityOf(entry),
    }));
    const subtotal = entries.reduce((sum, e) => add(sum, e), zero());
    return { dayId: day._id, date: day.date, entries, subtotal };
  });

  const lines = (quote.deliverables?.lines ?? []).map((line) => ({
    lineId: line._id,
    text: line.text,
    isAuto: Boolean(line.isAuto),
    ...pricesOf(line),
  }));

  const effect = addOnEffect(quote.addOn);
  const itemsTotal = breakdownDays.reduce((sum, d) => add(sum, d.subtotal), zero());
  const linesTotal = lines.reduce((sum, l) => add(sum, l), zero());

  const auto = {};
  for (const key of KEYS) {
    // The add-on is revenue, not studio cost. Include it in both customer
    // prices so an existing MRP/selling comparison remains meaningful.
    const addOnAmount = key === 'cost' ? 0 : effect;
    auto[key] = Math.max(0, itemsTotal[key] + linesTotal[key] + addOnAmount);
  }

  const override = {
    mrp: pickOverride(quote.pricing?.override?.mrp),
    selling: pickOverride(quote.pricing?.override?.selling),
  };
  const display = {
    mrp: override.mrp ?? auto.mrp,
    selling: override.selling ?? auto.selling,
  };
  const delta = {
    mrp: toSignedRupees(display.mrp - auto.mrp),
    selling: toSignedRupees(display.selling - auto.selling),
  };
  const profit = toSignedRupees(display.selling - auto.cost);
  const marginPct = display.selling > 0 ? Math.round((profit / display.selling) * 1000) / 10 : 0;

  return {
    auto,
    override,
    display,
    delta,
    profit,
    marginPct,
    breakdown: { days: breakdownDays, lines, addOnEffect: effect, itemsTotal, linesTotal },
  };
};

/** Subtotal for a single day (used by the wizard's running per-date total). */
export const daySubtotal = (day) =>
  (day?.entries ?? []).reduce((sum, entry) => add(sum, Object.fromEntries(Object.entries(pricesOf(entry.itemSnapshot)).map(([key, value]) => [key, value * quantityOf(entry)]))), zero());
