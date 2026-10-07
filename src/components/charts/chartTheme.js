/**
 * Chart tokens.
 *
 * The categorical pair was validated with the data-viz palette validator
 * against the white card surface these charts render on:
 *
 *   #B8863B ↔ #3E7CB1 — CVD ΔE 19.5 (protan) / 21.5 (tritan),
 *   normal-vision ΔE 23.0, both ≥ 3:1 contrast, both above the chroma floor.
 *
 * The studio's olive (#5C6650) was tried first and rejected: its chroma of
 * 0.036 falls below the floor, so it reads as "de-emphasised gray" rather than
 * as a distinct series. Gold keeps the brand lead; the muted blue is slot 2.
 *
 * Assign these in fixed order. Never cycle, never generate a new hue for an
 * extra series — fold the tail into "Other" instead.
 */
export const SERIES = ['#B8863B', '#3E7CB1'];

/** Single-hue default for magnitude comparisons (bars, ranked lists). */
export const SEQUENTIAL = '#B8863B';

export const CHART_INK = {
  surface: '#FFFFFF',
  grid: '#E9E7E4',
  axis: '#A9A29D',
  label: '#79726C',
  strong: '#1A1613',
};

/** Recessive axis styling shared by every chart. */
export const axisProps = {
  stroke: CHART_INK.axis,
  tick: { fill: CHART_INK.label, fontSize: 11 },
  tickLine: false,
  axisLine: false,
};

export const gridProps = {
  stroke: CHART_INK.grid,
  strokeDasharray: '0',
  vertical: false,
};

/** Recharts tooltip chrome, matched to the app's popover surface. */
export const tooltipProps = {
  cursor: { fill: 'rgba(184,134,59,0.06)' },
  contentStyle: {
    borderRadius: 12,
    border: 'none',
    boxShadow: '0 0 0 1px rgb(16 24 40 / 0.05), 0 12px 40px -12px rgb(16 24 40 / 0.2)',
    padding: '10px 12px',
    fontSize: 13,
  },
  labelStyle: { color: CHART_INK.strong, fontWeight: 600, marginBottom: 4 },
  itemStyle: { color: CHART_INK.label, fontSize: 12, padding: 0 },
};
