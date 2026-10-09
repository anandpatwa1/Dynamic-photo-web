/**
 * Pure quote edit operations shared by the editor and its side panel.
 * Every op returns a NEW quote; recompute() refreshes the derived parts with
 * the same engine the server uses, so the canvas updates instantly.
 */
import { computePricing } from './engine/pricing';
import { editLineText, flattenEntries, recalcReels, resetReelsToAuto } from './engine/reels';
import { toRupees } from './engine/money';
import { newObjectId } from './ids';

const clone = (q) => JSON.parse(JSON.stringify(q));

export const recompute = (quote) => {
  const q = { ...quote, deliverables: { ...quote.deliverables, lines: recalcReels(quote.deliverables?.lines ?? [], flattenEntries(quote.days), newObjectId) } };
  const c = computePricing(q);
  return { ...q, pricing: { ...q.pricing, auto: c.auto }, computed: { ...(q.computed ?? {}), display: c.display, delta: c.delta, auto: c.auto } };
};

const parseMoney = (text) => {
  const digits = String(text).replace(/[^\d]/g, '');
  return digits ? toRupees(digits) : null;
};

/** Canvas / side-panel text edit by path (see QuoteCanvas paths). */
export const setText = (quote, path, text) => {
  const q = clone(quote);
  if (path.startsWith('deliverable.')) {
    q.deliverables.lines = editLineText(q.deliverables.lines, path.slice('deliverable.'.length), text);
    return recompute(q);
  }
  if (path === 'price.selling' || path === 'price.mrp') {
    const key = path === 'price.selling' ? 'selling' : 'mrp';
    q.pricing = { ...q.pricing, override: { ...(q.pricing?.override ?? {}), [key]: parseMoney(text) } };
    return recompute(q);
  }
  q.textOverrides = { ...(q.textOverrides ?? {}), [path]: text };
  return q;
};

export const resetText = (quote, path) => {
  const q = clone(quote);
  if (path === 'price.selling' || path === 'price.mrp') {
    q.pricing.override[path === 'price.selling' ? 'selling' : 'mrp'] = null;
    return recompute(q);
  }
  delete q.textOverrides?.[path];
  return q;
};

export const setPriceOverride = (quote, key, value) => {
  const q = clone(quote);
  q.pricing = { ...q.pricing, override: { ...(q.pricing?.override ?? {}), [key]: value === '' || value === null ? null : toRupees(value) } };
  return recompute(q);
};

export const setBlockOverride = (quote, blockId, patch) => {
  const q = clone(quote);
  q.layout = q.layout ?? {};
  q.layout.blockOverrides = { ...(q.layout.blockOverrides ?? {}), [blockId]: { ...(q.layout.blockOverrides?.[blockId] ?? {}), ...patch } };
  return q;
};

export const resetBlock = (quote, blockId) => {
  const q = clone(quote);
  delete q.layout?.blockOverrides?.[blockId];
  return q;
};

export const setOption = (quote, key, value) => {
  const q = clone(quote);
  q.layout = { ...(q.layout ?? {}), options: { ...(q.layout?.options ?? {}), [key]: value } };
  return q;
};

export const setField = (quote, path, value) => {
  const q = clone(quote);
  const parts = path.split('.');
  let cur = q;
  for (let i = 0; i < parts.length - 1; i += 1) cur = cur[parts[i]] = cur[parts[i]] ?? {};
  cur[parts[parts.length - 1]] = value;
  return recompute(q);
};

export const setEntryNote = (quote, entryId, note) => {
  const q = clone(quote);
  for (const day of q.days) for (const e of day.entries) if (String(e._id) === String(entryId)) e.note = note;
  return q;
};

export const setEntryQuantity = (quote, entryId, quantity) => {
  const q = clone(quote);
  const next = Math.max(1, Math.min(99, Math.round(Number(quantity) || 1)));
  for (const day of q.days ?? []) for (const entry of day.entries ?? []) if (String(entry._id) === String(entryId)) entry.quantity = next;
  return recompute(q);
};

export const setDayDate = (quote, dayId, date) => {
  const q = clone(quote);
  for (const day of q.days ?? []) if (String(day._id) === String(dayId)) day.date = date;
  return recompute(q);
};

export const setLineNote = (quote, lineId, note) => {
  const q = clone(quote);
  q.deliverables.lines = q.deliverables.lines.map((l) => (String(l._id) === String(lineId) ? { ...l, note } : l));
  return q;
};

export const resetReels = (quote) => {
  const q = clone(quote);
  q.deliverables.lines = resetReelsToAuto(q.deliverables.lines, flattenEntries(q.days), newObjectId);
  return recompute(q);
};

export const addNote = (quote, text = '') => ({ ...clone(quote), notes: [...(quote.notes ?? []), text] });
export const updateNote = (quote, index, text) => ({ ...clone(quote), notes: (quote.notes ?? []).map((n, i) => (i === index ? text : n)) });
export const removeNote = (quote, index) => ({ ...clone(quote), notes: (quote.notes ?? []).filter((_, i) => i !== index) });

const shiftPriceOverrides = (quote, amount) => {
  if (!amount || !quote.pricing?.override) return;
  for (const key of ['mrp', 'selling']) {
    const value = quote.pricing.override[key];
    if (value !== null && value !== undefined && value !== '') {
      quote.pricing.override[key] = Math.max(0, toRupees(value) + amount);
    }
  }
};

export const setAddOnFromMaster = (quote, master) => {
  const q = clone(quote);
  const previous = q.addOn?.snapshot;
  if (previous?.includeInTotal) shiftPriceOverrides(q, -toRupees(previous.priceAmount));
  q.addOn = master
    ? { snapshot: { addOnId: master._id, kind: master.kind, title: master.title, text: master.text ?? '', badge: master.badge ?? '', valueAmount: master.valueAmount ?? 0, priceEffect: master.priceEffect ?? 'none', priceAmount: master.priceAmount ?? 0, includeInTotal: false } }
    : { snapshot: null };
  for (const k of ['addOn.title', 'addOn.text', 'addOn.badge', 'addOn.price']) delete q.textOverrides?.[k];
  return recompute(q);
};

export const setAddOnIncluded = (quote, includeInTotal) => {
  const q = clone(quote);
  if (q.addOn?.snapshot) {
    const wasIncluded = Boolean(q.addOn.snapshot.includeInTotal);
    const nextIncluded = Boolean(includeInTotal);
    if (wasIncluded !== nextIncluded) {
      shiftPriceOverrides(q, (nextIncluded ? 1 : -1) * toRupees(q.addOn.snapshot.priceAmount));
      q.addOn.snapshot.includeInTotal = nextIncluded;
    }
  }
  return recompute(q);
};

/** "Reset quote to auto": drops every text/layout/price override and re-derives reels. */
export const resetQuoteToAuto = (quote) => {
  const q = clone(quote);
  q.textOverrides = {};
  q.layout = { ...(q.layout ?? {}), blockOverrides: {} };
  q.pricing = { ...q.pricing, override: { mrp: null, selling: null } };
  return resetReels(q);
};

/**
 * Local quote → PATCH body. "Reset to auto" travels as isEdited:false on the
 * auto line, which makes the server recalculate it.
 *
 * Local quote → PATCH body accepted by quoteBodySchema (server re-derives everything). */
export const quoteToBody = (quote) => {
  const snap = quote.addOn?.snapshot;
  const addOnTexts = snap
    ? {
        addOnId: snap.addOnId,
        title: quote.textOverrides?.['addOn.title'] ?? snap.title,
        text: quote.textOverrides?.['addOn.text'] ?? snap.text,
        badge: quote.textOverrides?.['addOn.badge'] ?? snap.badge,
        includeInTotal: Boolean(snap.includeInTotal),
      }
    : null;
  const body = {
    label: quote.label ?? '',
    status: quote.status ?? 'draft',
    packageSnapshot: {
      presetId: quote.packageSnapshot?.presetId ?? null,
      name: quote.packageSnapshot?.name ?? '',
      subtitle: quote.packageSnapshot?.subtitle ?? '',
      description: quote.packageSnapshot?.description ?? '',
    },
    days: (quote.days ?? []).map((d) => ({
      _id: d._id,
      date: d.date,
      entries: (d.entries ?? []).map((e) => ({ _id: e._id, itemId: String(e.itemId), side: e.side, quantity: Math.max(1, Math.min(99, Math.round(Number(e.quantity) || 1))), displayName: e.displayName ?? '', note: e.note ?? '' })),
    })),
    printYear: quote.printYear ? Number(quote.printYear) : null,
    deliverables: {
      setId: quote.deliverables?.setId ? String(quote.deliverables.setId) : null,
      lines: (quote.deliverables?.lines ?? []).map((l) => {
        const out = { _id: l._id, text: l.text ?? '', note: l.note ?? '', isAuto: Boolean(l.isAuto), isEdited: Boolean(l.isEdited) };
        for (const k of ['sellingPrice', 'mrpPrice', 'costPrice']) if (typeof l[k] === 'number') out[k] = l[k];
        return out;
      }),
    },
    addOn: addOnTexts,
    themeId: quote.themeId ? String(quote.themeId) : null,
    themeOverrides: quote.themeOverrides ?? {},
    layout: { blockOverrides: quote.layout?.blockOverrides ?? {}, options: quote.layout?.options ?? {} },
    // addOn.title/text/badge travel inside the add-on object; addOn.price stays a plain text override.
    textOverrides: Object.fromEntries(Object.entries(quote.textOverrides ?? {}).filter(([k]) => !['addOn.title', 'addOn.text', 'addOn.badge'].includes(k))),
    pricing: { override: { mrp: quote.pricing?.override?.mrp ?? null, selling: quote.pricing?.override?.selling ?? null } },
    notes: (quote.notes ?? []).map((n) => String(n)).filter((n) => n.trim()),
  };
  return body;
};
