/** Sample data for theme previews (1 / 3 / 5 / 7 / 10 dates). */
const ITEMS = [
  { id: 's-pv', name: 'Photo + Video', deliverables: ['1-2 Reels'] },
  { id: 's-cd', name: 'Candid', deliverables: [] },
  { id: 's-cn', name: 'Cinematic', deliverables: ['1-2 Reels'] },
  { id: 's-dr', name: 'Drone', deliverables: [] },
];
const PLAN = [
  [['s-pv', 'bride'], ['s-pv', 'groom']],
  [['s-pv', 'both'], ['s-cd', 'both']],
  [['s-pv', 'both'], ['s-cn', 'both'], ['s-dr', 'both']],
  [['s-pv', 'bride']],
  [['s-pv', 'groom'], ['s-cd', 'groom']],
];

export const buildSampleQuote = (dayCount = 3) => {
  const days = Array.from({ length: dayCount }, (_, i) => {
    const day = 10 + i;
    return {
      _id: `sd${i}`,
      date: { day: ((day - 1) % 28) + 1, month: day > 28 ? 3 : 2, year: 2027 },
      entries: PLAN[i % PLAN.length].map(([itemId, side], j) => {
        const item = ITEMS.find((x) => x.id === itemId);
        return { _id: `se${i}${j}`, itemId, side, itemSnapshot: { name: item.name, sellingPrice: 10000, mrpPrice: 12500, deliverables: item.deliverables } };
      }),
    };
  });
  return {
    packageSnapshot: { name: dayCount > 4 ? 'Destination Wedding Package' : 'Wedding Package', subtitle: 'Both Side Coverage' },
    days,
    deliverables: { lines: [{ _id: 'sl1', text: '300 Photos Album' }, { _id: 'sl2', text: `${2 + dayCount}-${3 + dayCount} Reels`, isAuto: true }, { _id: 'sl3', text: 'All Portraits' }, { _id: 'sl4', text: 'Complete Video' }] },
    addOn: { snapshot: { badge: 'FREE', title: 'Pre-Wedding Shoot', text: 'Worth ₹25,000', priceEffect: 'none' } },
    pricing: { override: {} },
    notes: ['Travel & stay extra for outstation venues'],
    textOverrides: {},
    layout: { blockOverrides: {}, options: { showSides: true, groupDates: false } },
  };
};

export const SAMPLE_STUDIO = { name: 'Dynamic Production', phone: '+91 98765 43210', city: 'Ambala' };
