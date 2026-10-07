/**
 * WCAG contrast helpers (theme import warnings).
 * SHARED FILE — identical copy lives in client/src/wedding-quote/utils/engine/.
 */
export const parseColor = (value) => {
  const s = String(value ?? '').trim();
  let m = s.match(/^#([0-9a-f]{3,8})$/i);
  if (m) {
    let hex = m[1];
    if (hex.length === 3 || hex.length === 4) hex = hex.split('').map((c) => c + c).join('');
    const n = parseInt(hex.slice(0, 6), 16);
    const a = hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1;
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255, a };
  }
  m = s.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)$/i);
  if (m) return { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] };
  return null;
};

export const isColor = (value) => parseColor(value) !== null || value === 'transparent';

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
  const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x);
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
  return warnings;
};
