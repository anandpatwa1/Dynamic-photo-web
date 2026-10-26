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

/** Normalizes multiple add-ons or falls back to single add-on. */
export const getQuoteAddOns = (quote = {}) => {
  if (Array.isArray(quote?.addOns) && quote.addOns.length > 0) {
    return quote.addOns.map((a) => a?.snapshot ?? a).filter(Boolean);
  }
  if (quote?.addOn) {
    const single = quote.addOn?.snapshot ?? quote.addOn;
    return single ? [single] : [];
  }
  return [];
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

  const lines = (quote.deliverables?.lines ?? [])
    .filter((line) => !line.disabled)
    .map((line) => ({
      lineId: line._id,
      text: line.text,
      isAuto: Boolean(line.isAuto),
      ...pricesOf(line),
    }));

  const addOnsList = getQuoteAddOns(quote);
  const effect = addOnsList.length > 0
    ? addOnsList.reduce((sum, a) => sum + (a.includeInTotal ? toRupees(a.priceAmount) : 0), 0)
    : addOnEffect(quote.addOn);
  const addOnCost = addOnsList.length > 0
    ? addOnsList.reduce((sum, a) => sum + toRupees(a.costPrice), 0)
    : toRupees((quote.addOn?.snapshot ?? quote.addOn)?.costPrice);

  const itemsTotal = breakdownDays.reduce((sum, d) => add(sum, d.subtotal), zero());
  const linesTotal = lines.reduce((sum, l) => add(sum, l), zero());

  const auto = {};
  for (const key of KEYS) {
    // Providing an add-on always incurs its cost, even when free to the customer.
    const addOnAmount = key === 'cost' ? addOnCost : effect;
    auto[key] = Math.max(0, itemsTotal[key] + linesTotal[key] + addOnAmount);
  }

  const override = {
    mrp: pickOverride(quote.pricing?.override?.mrp),
    selling: pickOverride(quote.pricing?.override?.selling),
  };
  const baseSelling = override.selling ?? auto.selling;
  const baseMrp = override.mrp ?? auto.mrp;

  const taxRate = Number(quote.taxRate ?? quote.pricing?.taxRate ?? 0);
  const taxEnabled = Boolean(quote.taxEnabled ?? quote.pricing?.taxEnabled ?? false);
  const taxIncluded = Boolean(quote.taxIncluded ?? quote.pricing?.taxIncluded ?? false);

  let taxAmount = 0;
  let finalSelling = baseSelling;

  if (taxEnabled && taxRate > 0) {
    if (taxIncluded) {
      taxAmount = Math.round(baseSelling - (baseSelling / (1 + taxRate / 100)));
      finalSelling = baseSelling;
    } else {
      taxAmount = Math.round((baseSelling * taxRate) / 100);
      finalSelling = baseSelling + taxAmount;
    }
  }

  const display = {
    mrp: baseMrp,
    selling: baseSelling,
    finalSelling,
    taxRate,
    taxEnabled,
    taxIncluded,
    taxAmount,
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
