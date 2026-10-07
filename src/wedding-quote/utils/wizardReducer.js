/**
 * Create-wizard state (Phase 2). Pure and unit-tested.
 * Steps: 0 dates · 1 package · 2 items (one date per screen) · 3 deliverables · 4 add-on
 */
import { MAX_DATES, moveItem, sameDate, toggleDate } from './engine/dates';
import { flattenEntries, linesFromSet, recalcReels, editLineText, resetReelsToAuto } from './engine/reels';
import { newObjectId } from './ids';

export const WIZARD_STEPS = 5;

export const initialWizardState = (today = new Date()) => ({
  step: 0,
  view: { month: today.getMonth() + 1, year: today.getFullYear() },
  days: [], // [{ _id, date, entries: [{ _id, itemId, side, quantity, note, itemSnapshot }] }]
  printYear: '',
  package: { presetId: null, name: '', subtitle: '', description: '' },
  activeDay: 0,
  setId: null,
  lines: [],
  addOnId: null,
  label: '',
  quoteId: null,
  error: null,
});

const withReels = (state) => ({ ...state, lines: recalcReels(state.lines, flattenEntries(state.days), newObjectId) });

const snapshotOf = (item) => ({
  name: item.name,
  sellingPrice: item.sellingPrice ?? 0,
  costPrice: item.costPrice,
  mrpPrice: item.mrpPrice ?? 0,
  deliverables: item.deliverables ?? [],
  note: item.note ?? '',
});

export const canAdvance = (state) => {
  if (state.step === 0) return state.days.length > 0;
  if (state.step === 1) return Boolean(state.package.name.trim());
  return true;
};

export const wizardReducer = (state, action) => {
  switch (action.type) {
    case 'toggleDate': {
      const dates = state.days.map((d) => d.date);
      const { dates: next, error } = toggleDate(dates, action.date, MAX_DATES);
      if (error) return { ...state, error };
      // Keep existing day objects (and their entries) for dates that stay selected.
      const days = next.map((date) => state.days.find((d) => sameDate(d.date, date)) ?? { _id: newObjectId(), date, entries: [] });
      return withReels({ ...state, days, error: null, activeDay: Math.min(state.activeDay, Math.max(0, days.length - 1)) });
    }
    case 'removeDate': {
      const days = state.days.filter((_, i) => i !== action.index);
      return withReels({ ...state, days, activeDay: Math.min(state.activeDay, Math.max(0, days.length - 1)) });
    }
    case 'moveDate':
      return { ...state, days: moveItem(state.days, action.index, action.delta) };
    case 'setView':
      return { ...state, view: action.view };
    case 'setPrintYear':
      return { ...state, printYear: action.value };
    case 'setPackage':
      return { ...state, package: { ...state.package, ...action.patch } };
    case 'choosePreset':
      return {
        ...state,
        package: action.preset
          ? { presetId: action.preset._id, name: action.preset.name, subtitle: action.preset.subtitle ?? '', description: action.preset.description ?? '' }
          : { presetId: null, name: state.package.name, subtitle: state.package.subtitle, description: state.package.description },
      };
    case 'setActiveDay':
      return { ...state, activeDay: Math.max(0, Math.min(action.index, state.days.length - 1)) };
    case 'addEntry': {
      // Re-adding the same item for the same side increases quantity. Bride,
      // groom, both and no-label remain separate priced choices.
      const days = state.days.map((d, i) =>
        i !== action.dayIndex ? d : {
          ...d,
          entries: (() => {
            const match = d.entries.find((entry) => String(entry.itemId) === String(action.item._id) && entry.side === action.side);
            if (!match) return [...d.entries, { _id: newObjectId(), itemId: action.item._id, side: action.side, quantity: 1, note: '', itemSnapshot: snapshotOf(action.item) }];
            return d.entries.map((entry) => entry._id === match._id ? { ...entry, quantity: Math.min(99, (Number(entry.quantity) || 1) + 1) } : entry);
          })(),
        },
      );
      return withReels({ ...state, days });
    }
    case 'copyDayEntries': {
      const source = state.days[action.fromDayIndex];
      if (!source || action.toDayIndex < 0 || action.toDayIndex >= state.days.length) return state;
      const entries = source.entries.map((entry) => ({ ...entry, _id: newObjectId() }));
      const days = state.days.map((day, index) => (index === action.toDayIndex ? { ...day, entries } : day));
      return withReels({ ...state, days });
    }
    case 'removeEntry': {
      const days = state.days.map((d, i) => (i === action.dayIndex ? { ...d, entries: d.entries.filter((e) => e._id !== action.entryId) } : d));
      return withReels({ ...state, days });
    }
    case 'updateEntry': {
      const days = state.days.map((d, i) =>
        i === action.dayIndex ? { ...d, entries: d.entries.map((e) => (e._id === action.entryId ? { ...e, ...action.patch } : e)) } : d,
      );
      return withReels({ ...state, days });
    }
    case 'chooseSet':
      return { ...state, setId: action.set?._id ?? null, lines: linesFromSet(action.set?.lines ?? [], flattenEntries(state.days), newObjectId) };
    case 'serverLines':
      return { ...state, lines: action.lines, setId: action.setId ?? state.setId };
    case 'editLine':
      return { ...state, lines: editLineText(state.lines, action.lineId, action.text) };
    case 'setLineNote':
      return { ...state, lines: state.lines.map((l) => (l._id === action.lineId ? { ...l, note: action.note } : l)) };
    case 'resetReels':
      return { ...state, lines: resetReelsToAuto(state.lines, flattenEntries(state.days), newObjectId) };
    case 'chooseAddOn':
      return { ...state, addOnId: action.addOnId };
    case 'setLabel':
      return { ...state, label: action.value };
    case 'setQuoteId':
      return { ...state, quoteId: action.id };
    case 'next':
      return canAdvance(state) ? { ...state, step: Math.min(WIZARD_STEPS - 1, state.step + 1), error: null } : { ...state, error: 'cannotAdvance' };
    case 'back':
      return { ...state, step: Math.max(0, state.step - 1), error: null };
    case 'goto':
      return { ...state, step: action.step };
    case 'clearError':
      return { ...state, error: null };
    default:
      return state;
  }
};

/** Wizard state → quote body (server re-snapshots and recomputes). */
export const wizardToBody = (state, { includeLines = true } = {}) => ({
  label: state.label ?? '',
  packageSnapshot: { ...state.package },
  printYear: state.printYear ? Number(state.printYear) : null,
  days: state.days.map((d) => ({
    _id: d._id,
    date: d.date,
    entries: d.entries.map((e) => ({ _id: e._id, itemId: String(e.itemId), side: e.side, quantity: Math.max(1, Math.min(99, Math.round(Number(e.quantity) || 1))), note: e.note ?? '' })),
  })),
  ...(includeLines && state.lines.length
    ? { deliverables: { setId: state.setId, lines: state.lines.map((l) => ({ _id: l._id, text: l.text, note: l.note ?? '', isAuto: Boolean(l.isAuto), isEdited: Boolean(l.isEdited) })) } }
    : {}),
  addOn: state.addOnId ? { addOnId: state.addOnId } : null,
});
