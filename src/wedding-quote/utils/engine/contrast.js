/**
 * WCAG contrast helpers (theme import warnings).
 * SHARED FILE — identical copy lives in client/src/wedding-quote/utils/engine/.
 */
export const parseColor = (value) => {
  const s = String(value ?? '').trim();
  let m = s.match(/^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i);
  if (m) {
    let hex = m[1];
    if (hex.length === 3 || hex.length === 4) hex = hex.split('').map((c) => c + c).join('');
    const n = parseInt(hex.slice(0, 6), 16);
    const a = hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1;
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255, a };
  }
  m = s.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)$/i);
  if (m) {
    const color = { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] };
    if (/^rgba/i.test(s) !== (m[4] !== undefined)) return null;
    return [color.r, color.g, color.b].every(v => v >= 0 && v <= 255) && Number.isFinite(color.a) && color.a >= 0 && color.a <= 1 ? color : null;
  }
  if (s === 'transparent') return { r: 0, g: 0, b: 0, a: 0 };
  return null;
};

export const isColor = (value) => parseColor(value) !== null || value === 'transparent';

const blend = (a, b) => ({ r: a.r*a.a+b.r*(1-a.a), g: a.g*a.a+b.g*(1-a.a), b: a.b*a.a+b.b*(1-a.a), a: 1 });

const lum = ({ r, g, b }) => {
  const f = (c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};

export const contrastRatio = (fg, bg) => {
  const a = parseColor(fg);
  const b = parseColor(bg);
  if (!a || !b) return null;
  const surface = blend(b, { r: 255, g: 255, b: 255, a: 1 });
  const [l1, l2] = [lum(blend(a, surface)), lum(surface)].sort((x, y) => y - x);
  return Math.round(((l1 + 0.05) / (l2 + 0.05)) * 100) / 100;
};

/** Warnings for text colours against the canvas background. */
export const contrastWarnings = (definition) => {
  const bg = definition?.canvas?.bg;
  const colors = definition?.colors ?? {};
  const checks = [
    ['title', 3], ['text', 4.5], ['priceMain', 3], ['muted', 3],
  ];
  const warnings = [];
  for (const [key, min] of checks) {
    const ratio = contrastRatio(colors[key], bg);
    if (ratio !== null && ratio < min) {
      warnings.push({ path: `colors.${key}`, message: `Low contrast ${ratio}:1 against canvas.bg (aim for ≥ ${min}:1)` });
    }
  }
  if (definition?.canvas?.backgroundImage) {
    warnings.push({ path: 'canvas.backgroundImage', message: 'Background image set — check text legibility in the preview' });
  }
  for (const [key, block] of Object.entries(definition.blocks ?? {})) {
    if (block.bg && block.color) {
      const ratio = contrastRatio(block.color, block.bg);
      if (ratio !== null && ratio < 4.5) warnings.push({ path: `blocks.${key}`, message: `Text/background contrast ${ratio}:1; aim for 4.5:1` });
    }
  }
  if (definition.canvas?.frame && definition.ornaments?.length) warnings.push({ path: 'ornaments', message: 'Frame and ornaments are both present. Review corner roles in preview; intentional layering is allowed.' });
  return warnings;
};
