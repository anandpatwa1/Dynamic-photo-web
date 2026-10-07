/**
 * Canvas sizing rules (Master Spec A10).
 * SHARED FILE — identical copy lives in client/src/wedding-quote/utils/engine/.
 *
 * Width is fixed (design width, default 1080). Height is ≥ width (1:1) and,
 * for ≤ 7 dates, ≤ ASPECT_CAP × width — content first shrinks down to the
 * theme's minFontScale to fit. Content is never cropped: if it still does not
 * fit, the canvas grows and a warning is returned.
 */
export const DESIGN_WIDTH = 1080;
export const ASPECT_CAP = 1.78; // portrait 9:16 (assumption A14.3)
export const CAPPED_MAX_DAYS = 7;

export const clampHeight = (width, contentHeight, dayCount) => {
  const min = width;
  const cap = Math.round(width * ASPECT_CAP);
  const h = Math.max(min, Math.ceil(contentHeight));
  if (dayCount <= CAPPED_MAX_DAYS && h > cap) return { height: h, overCap: true, cap };
  return { height: h, overCap: false, cap };
};

/**
 * Finds the font scale + canvas height. `measure(scale)` must return the
 * natural content height (px) at that scale. Monotonic in scale.
 */
export const planLayout = (measure, { width = DESIGN_WIDTH, dayCount = 1, minFontScale = 0.6, maxFontScale = 1.2, steps = 9 } = {}) => {
  const square = width;
  const cap = Math.round(width * ASPECT_CAP);
  const base = measure(1);

  // Sparse: grow type until the square is filled (never past maxFontScale).
  if (base <= square) {
    let lo = 1;
    let hi = Math.max(1, maxFontScale);
    if (measure(hi) <= square) lo = hi;
    else {
      for (let i = 0; i < steps; i += 1) {
        const mid = (lo + hi) / 2;
        if (measure(mid) <= square) lo = mid;
        else hi = mid;
      }
    }
    return { scale: round3(lo), height: square, warning: null };
  }

  if (dayCount > CAPPED_MAX_DAYS || base <= cap) {
    return { scale: 1, height: Math.ceil(base), warning: null };
  }

  // ≤ 7 dates and over the cap: shrink.
  const floor = Math.min(1, minFontScale);
  if (measure(floor) > cap) {
    return { scale: round3(floor), height: Math.ceil(measure(floor)), warning: 'overCap' };
  }
  let lo = floor;
  let hi = 1;
  for (let i = 0; i < steps; i += 1) {
    const mid = (lo + hi) / 2;
    if (measure(mid) <= cap) lo = mid;
    else hi = mid;
  }
  return { scale: round3(lo), height: Math.max(square, Math.ceil(measure(lo))), warning: null };
};

const round3 = (n) => Math.round(n * 1000) / 1000;

/** Export sizing (A12): output px, with the longest side capped. */
export const MAX_EXPORT_SIDE = 4096;
export const exportSize = ({ designWidth = DESIGN_WIDTH, designHeight, widthPx }) => {
  const requested = Math.max(320, Math.round(widthPx || designWidth));
  let scale = requested / designWidth;
  let outW = Math.round(designWidth * scale);
  let outH = Math.round(designHeight * scale);
  let capped = false;
  const longest = Math.max(outW, outH);
  if (longest > MAX_EXPORT_SIDE) {
    scale *= MAX_EXPORT_SIDE / longest;
    outW = Math.round(designWidth * scale);
    outH = Math.round(designHeight * scale);
    capped = true;
  }
  return { width: outW, height: outH, scale, capped };
};

export const formatBytes = (bytes) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return '—';
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};
