/** Turns vectors.json cases into engine inputs (shared by server + client tests). */
export const reelEntries = (items) =>
  items.flatMap((item) =>
    Array.from({ length: item.times }, (_, i) => ({ _id: `${item.id}-${i}`, itemId: item.id, itemSnapshot: { name: item.id, deliverables: item.deliverables } })),
  );

export const pricingQuote = (c) => ({
  days: c.days.map((d, i) => ({
    _id: `d${i}`,
    date: { day: i + 1, month: 1, year: 2027 },
    entries: d.entries.map((e, j) => ({
      _id: `e${i}${j}`,
      itemId: e.itemId,
      side: e.side,
      itemSnapshot: { name: e.itemId, sellingPrice: e.selling, costPrice: e.cost, mrpPrice: e.mrp, deliverables: [] },
    })),
  })),
  deliverables: { lines: c.lines.map((l, i) => ({ _id: `l${i}`, text: l.text, sellingPrice: l.selling, costPrice: l.cost, mrpPrice: l.mrp })) },
  addOn: c.addOn ? { snapshot: c.addOn } : null,
  pricing: { override: c.override },
});
