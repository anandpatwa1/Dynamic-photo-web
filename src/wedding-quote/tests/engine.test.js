/** Same vectors as the server suite — both engines must agree. */
import { describe, expect, it } from 'vitest';
import vectors from './fixtures/vectors.json';
import { combineReels } from '../utils/engine/reels';
import { computePricing } from '../utils/engine/pricing';
import { formatINR } from '../utils/engine/money';
import { exportSize, planLayout, ASPECT_CAP } from '../utils/engine/layout';
import { reelEntries, pricingQuote } from './vectorRunner';
import { quoteFileName } from '../utils/download';

describe('client engine = shared vectors', () => {
  for (const c of vectors.reels) it(`reels: ${c.name}`, () => expect(combineReels(reelEntries(c.items), c.set)?.text ?? null).toBe(c.expect));
  for (const c of vectors.pricing) {
    it(`pricing: ${c.name}`, () => {
      const r = computePricing(pricingQuote(c));
      expect([r.auto.selling, r.auto.cost, r.auto.mrp, r.display.selling, r.profit, r.marginPct]).toEqual([
        c.expect.selling, c.expect.cost, c.expect.mrp, c.expect.displaySelling, c.expect.profit, c.expect.marginPct,
      ]);
    });
  }
  for (const c of vectors.money) it(`money ${c.in}`, () => expect(formatINR(c.in)).toBe(c.out));
});

describe('resize never clips (measure model)', () => {
  // Text model: N characters wrap at the block width; height grows with lines.
  const contentHeight = (blockWidth, chars = 2600, charPx = 18, linePx = 40) => (s) =>
    Math.ceil((chars * charPx * s) / blockWidth) * linePx * s + 300 * s;
  for (const w of [200, 400, 600, 900]) {
    it(`block width ${w}px → canvas height ≥ content`, () => {
      const measure = contentHeight(w);
      const plan = planLayout(measure, { dayCount: 5, minFontScale: 0.6 });
      expect(plan.height).toBeGreaterThanOrEqual(Math.ceil(measure(plan.scale)) - 1);
      expect(plan.height).toBeGreaterThanOrEqual(1080);
    });
  }
  it('widening a 400px block re-wraps into less height', () => {
    expect(contentHeight(800)(1)).toBeLessThan(contentHeight(400)(1));
  });
  it('≤7 dates stay within the cap when shrinking suffices', () => {
    const plan = planLayout(contentHeight(900, 4000), { dayCount: 7, minFontScale: 0.5 });
    expect(plan.height).toBeLessThanOrEqual(Math.round(1080 * ASPECT_CAP));
  });
});

describe('export sizing', () => {
  it('width/scale and 4096 cap', () => {
    expect(exportSize({ designHeight: 1080, widthPx: 2160 })).toMatchObject({ width: 2160, height: 2160, scale: 2, capped: false });
    const big = exportSize({ designHeight: 3000, widthPx: 3000 });
    expect(big.capped).toBe(true);
    expect(big.height).toBeLessThanOrEqual(4096);
  });
  it('file name quote-<label|package>-<date>.jpg', () => {
    const d = new Date(2026, 9, 4);
    expect(quoteFileName({ label: 'Sharma Wedding' }, d)).toBe('quote-sharma-wedding-2026-10-04.jpg');
    expect(quoteFileName({ packageSnapshot: { name: 'Destination Wedding Package' } }, d)).toBe('quote-destination-wedding-package-2026-10-04.jpg');
  });
});
