import { describe, expect, it } from 'vitest';
import { canAdvance, initialWizardState, wizardReducer, wizardToBody } from '../utils/wizardReducer';
import { editorReducer, initialEditorState, isDirty } from '../utils/editorReducer';
import * as ops from '../utils/quoteOps';
import { buildPrintModel } from '../utils/engine/display';
import { computePricing } from '../utils/engine/pricing';

const PV = { _id: 'pv', name: 'Photo + Video', sellingPrice: 10000, mrpPrice: 12000, deliverables: ['2-3 Reels'] };
const run = (state, ...actions) => actions.reduce(wizardReducer, state);
const d = (day, month = 12, year = 2026) => ({ day, month, year });

describe('wizard reducer', () => {
  it('date selection: toggle, max 10, leap day, year-boundary order', () => {
    let s = initialWizardState(new Date(2026, 11, 1));
    s = run(s, { type: 'toggleDate', date: d(2, 1, 2027) }, { type: 'toggleDate', date: d(30) });
    expect(s.days.map((x) => x.date)).toEqual([d(30), d(2, 1, 2027)]);
    s = run(s, { type: 'toggleDate', date: d(29, 2, 2027) });
    expect(s.error).toBe('invalid');
    s = run(s, { type: 'toggleDate', date: d(29, 2, 2028) });
    expect(s.days).toHaveLength(3);
    for (let i = 1; i <= 7; i += 1) s = run(s, { type: 'toggleDate', date: d(i, 3, 2027) });
    expect(s.days).toHaveLength(10);
    s = run(s, { type: 'toggleDate', date: d(20, 3, 2027) });
    expect(s.error).toBe('max');
    s = run(s, { type: 'toggleDate', date: d(30) });
    expect(s.days).toHaveLength(9);
  });
  it('keeps entries when other dates change; reorder works', () => {
    let s = run(initialWizardState(), { type: 'toggleDate', date: d(3) }, { type: 'toggleDate', date: d(4) },
      { type: 'addEntry', dayIndex: 0, item: PV, side: 'bride' });
    s = run(s, { type: 'toggleDate', date: d(5) });
    expect(s.days[0].entries).toHaveLength(1);
    s = run(s, { type: 'moveDate', index: 0, delta: 1 });
    expect(s.days[1].date).toEqual(d(3));
  });
  it('keeps every selected date when navigating back from later steps', () => {
    let s = run(initialWizardState(),
      { type: 'toggleDate', date: d(3) },
      { type: 'toggleDate', date: d(4) },
      { type: 'toggleDate', date: d(5) },
      { type: 'goto', step: 4 },
      { type: 'back' },
      { type: 'back' });
    expect(s.days.map((day) => day.date)).toEqual([d(3), d(4), d(5)]);
  });
  it('copies a day setup with fresh entry ids and recalculates reels', () => {
    let s = run(initialWizardState(), { type: 'toggleDate', date: d(3) }, { type: 'toggleDate', date: d(4) },
      { type: 'addEntry', dayIndex: 0, item: PV, side: 'both' });
    const sourceId = s.days[0].entries[0]._id;
    s = run(s, { type: 'copyDayEntries', fromDayIndex: 0, toDayIndex: 1 });
    expect(s.days[1].entries).toHaveLength(1);
    expect(s.days[1].entries[0]).toMatchObject({ itemId: 'pv', side: 'both' });
    expect(s.days[1].entries[0]._id).not.toBe(sourceId);
    expect(s.lines.find((line) => line.isAuto)?.text).toBe('4-5 Reels');
  });
  it('merges repeated item and side into quantity while keeping sides separate', () => {
    let s = run(initialWizardState(), { type: 'toggleDate', date: d(3) },
      { type: 'addEntry', dayIndex: 0, item: PV, side: 'groom' },
      { type: 'addEntry', dayIndex: 0, item: PV, side: 'groom' },
      { type: 'addEntry', dayIndex: 0, item: PV, side: 'none' });
    expect(s.days[0].entries).toHaveLength(2);
    expect(s.days[0].entries.find((entry) => entry.side === 'groom').quantity).toBe(2);
    expect(s.days[0].entries.find((entry) => entry.side === 'none').quantity).toBe(1);
  });
  it('A3: same item twice on a date = 2 entries; total 30,000; reels 6-7 appended live', () => {
    const s = run(initialWizardState(), { type: 'toggleDate', date: d(3) }, { type: 'toggleDate', date: d(4) },
      { type: 'chooseSet', set: { _id: 's', lines: [{ text: '300 Photos Album' }] } },
      { type: 'addEntry', dayIndex: 0, item: PV, side: 'bride' }, { type: 'addEntry', dayIndex: 0, item: PV, side: 'groom' },
      { type: 'addEntry', dayIndex: 1, item: PV, side: 'both' });
    expect(s.days[0].entries.map((e) => e.side)).toEqual(['bride', 'groom']);
    expect(computePricing({ days: s.days, deliverables: { lines: s.lines } }).auto.selling).toBe(30000);
    expect(s.lines.map((l) => l.text)).toEqual(['300 Photos Album', '6-7 Reels']);
  });
  it('edited reels line survives new entries; reset restores', () => {
    let s = run(initialWizardState(), { type: 'toggleDate', date: d(3) }, { type: 'addEntry', dayIndex: 0, item: PV, side: 'both' });
    const auto = s.lines.find((l) => l.isAuto);
    s = run(s, { type: 'editLine', lineId: auto._id, text: '3 Reels' }, { type: 'addEntry', dayIndex: 0, item: PV, side: 'bride' });
    expect(s.lines.find((l) => l.isAuto).text).toBe('3 Reels');
    s = run(s, { type: 'resetReels' });
    expect(s.lines.find((l) => l.isAuto).text).toBe('4-5 Reels');
  });
  it('cannot advance without dates / package name; body never carries prices', () => {
    let s = initialWizardState();
    expect(canAdvance(s)).toBe(false);
    s = run(s, { type: 'next' });
    expect(s.step).toBe(0);
    s = run(s, { type: 'toggleDate', date: d(3) }, { type: 'next' });
    expect(s.step).toBe(1);
    expect(canAdvance(s)).toBe(false);
    s = run(s, { type: 'choosePreset', preset: { _id: 'p', name: 'Destination Wedding Package', subtitle: 'Both Side Coverage' } });
    expect(canAdvance(s)).toBe(true);
    s = run(s, { type: 'addEntry', dayIndex: 0, item: PV, side: 'bride' });
    const body = wizardToBody(s);
    expect(JSON.stringify(body)).not.toMatch(/sellingPrice|costPrice|itemSnapshot/);
    expect(body.packageSnapshot.name).toBe('Destination Wedding Package');
  });
});

const baseQuote = () => ops.recompute({
  _id: 'q1',
  packageSnapshot: { name: 'Wedding Package', subtitle: 'Both Side Coverage' },
  days: [{ _id: 'd1', date: d(3), entries: [{ _id: 'e1', itemId: 'pv', side: 'both', itemSnapshot: { name: 'Photo + Video', sellingPrice: 82000, mrpPrice: 95000, deliverables: [] } }] }],
  deliverables: { setId: null, lines: [{ _id: 'l1', text: 'Album', note: 'Album in 45 days' }] },
  pricing: { override: { mrp: null, selling: null } },
  textOverrides: {},
  layout: { blockOverrides: {}, options: {} },
  notes: ['album in 45   DAYS', 'Travel extra'],
});

describe('editor reducer: undo / redo / overrides', () => {
  const load = (q) => editorReducer(initialEditorState, { type: 'load', quote: q });
  it('undo/redo restores exact states and clears redo on new edits', () => {
    let s = load(baseQuote());
    s = editorReducer(s, { type: 'apply', fn: (q) => ops.setText(q, 'title', 'Royal Wedding') });
    s = editorReducer(s, { type: 'apply', fn: (q) => ops.setBlockOverride(q, 'title', { w: 600 }) });
    expect(s.past).toHaveLength(2);
    s = editorReducer(s, { type: 'undo' });
    expect(s.quote.layout.blockOverrides.title).toBeUndefined();
    s = editorReducer(s, { type: 'redo' });
    expect(s.quote.layout.blockOverrides.title.w).toBe(600);
    s = editorReducer(s, { type: 'undo' });
    s = editorReducer(s, { type: 'apply', fn: (q) => ops.setOption(q, 'groupDates', true) });
    expect(s.future).toHaveLength(0);
    expect(isDirty(s)).toBe(true);
  });
  it('no-op edits do not create history', () => {
    const s = editorReducer(load(baseQuote()), { type: 'apply', fn: (q) => q });
    expect(s.past).toHaveLength(0);
  });
  it('server answer adopted only if nothing changed meanwhile', () => {
    let s = editorReducer(load(baseQuote()), { type: 'apply', fn: (q) => ops.setText(q, 'title', 'A') });
    const v = s.version;
    s = editorReducer(s, { type: 'apply', fn: (q) => ops.setText(q, 'title', 'AB') });
    s = editorReducer(s, { type: 'saved', version: v, quote: { ...s.quote, textOverrides: { title: 'A' } } });
    expect(s.quote.textOverrides.title).toBe('AB');
    expect(isDirty(s)).toBe(true);
    s = editorReducer(s, { type: 'saved', version: s.version, quote: s.quote });
    expect(isDirty(s)).toBe(false);
  });
});

describe('side panel ↔ canvas sync (same ops, same print model)', () => {
  it('a text edit from either side changes what the canvas prints', () => {
    const q = ops.setText(baseQuote(), 'title', 'Royal Wedding Package');
    expect(buildPrintModel(q).title).toBe('Royal Wedding Package');
    expect(buildPrintModel(ops.resetText(q, 'title')).title).toBe('Wedding Package');
  });
  it('override 82,000 → 80,000 persists in the body, reset returns to auto', () => {
    let q = ops.setText(baseQuote(), 'price.selling', '₹80,000');
    expect(buildPrintModel(q).price.sellingText).toBe('₹80,000');
    expect(q.computed.delta.selling).toBe(-2000);
    expect(ops.quoteToBody(q).pricing.override.selling).toBe(80000);
    q = ops.setPriceOverride(q, 'selling', null);
    expect(buildPrintModel(q).price.selling).toBe(82000);
  });
  it('notes deduped on the quote (case/space-insensitive)', () => {
    expect(buildPrintModel(baseQuote()).notes).toEqual(['album in 45 DAYS', 'Travel extra']);
  });
  it('deliverable edit marks only auto lines as edited', () => {
    const q = ops.setText(baseQuote(), 'deliverable.l1', 'Premium Album');
    expect(q.deliverables.lines[0]).toMatchObject({ text: 'Premium Album', isEdited: false });
  });
  it('reset quote to auto clears overrides', () => {
    let q = ops.setText(baseQuote(), 'footer', 'X');
    q = ops.setBlockOverride(q, 'price', { fontScale: 2 });
    q = ops.setPriceOverride(q, 'mrp', 99000);
    q = ops.resetQuoteToAuto(q);
    expect(q.textOverrides).toEqual({});
    expect(q.layout.blockOverrides).toEqual({});
    expect(q.pricing.override).toEqual({ mrp: null, selling: null });
  });
  it('body never sends costing or computed totals', () => {
    const body = ops.quoteToBody(baseQuote());
    expect(body.computed).toBeUndefined();
    expect(JSON.stringify(body)).not.toMatch(/itemSnapshot|"auto"/);
  });
});
