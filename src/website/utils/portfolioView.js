export const TILE_RATIOS = { std: 4 / 5, tall: 3 / 4, wide: 4 / 3 };

/** Keep the editor's order and never publish a broken story link. */
export const portfolioView = (items = [], category = 'all', expanded = false) => {
  const matching = items.filter(item => item.slug && item.image?.url && (category === 'all' || item.category === category));
  return { items: expanded ? matching : matching.slice(0, 6), total: matching.length };
};
