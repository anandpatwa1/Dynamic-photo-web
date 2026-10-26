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
  includeAddOnInTotal: false,
  selectedAddOns: [], // [{ addOnId, includeInTotal }]
  label: '',
  quoteId: null,
  error: null,
});

/** Re-opens a saved quote in the same five-step setup flow. */
export const wizardStateFromQuote = (quote, today = new Date()) => {
  const legacyAddOnId = quote?.addOn?.snapshot?.addOnId ? String(quote.addOn.snapshot.addOnId) : null;
  const legacyIncluded = Boolean(quote?.addOn?.snapshot?.includeInTotal);
  const selectedAddOns = Array.isArray(quote?.addOns) && quote.addOns.length > 0
    ? quote.addOns.map((a) => ({
        addOnId: String(a.snapshot?.addOnId || a.snapshot?._id || a._id),
        includeInTotal: Boolean(a.snapshot?.includeInTotal),
      }))
    : legacyAddOnId
      ? [{ addOnId: legacyAddOnId, includeInTotal: legacyIncluded }]
      : [];

  return {
    ...initialWizardState(today),
    // The editor is conceptually one step after setup. Re-open an existing
    // quote at the final setup step so Back moves through earlier steps.
    step: WIZARD_STEPS - 1,
    view: quote?.days?.[0]?.date
      ? { month: quote.days[0].date.month, year: quote.days[0].date.year }
      : { month: today.getMonth() + 1, year: today.getFullYear() },
    days: (quote?.days ?? []).map((day) => ({
      ...day,
      _id: String(day._id),
      entries: (day.entries ?? []).map((entry) => ({
        ...entry,
        _id: String(entry._id),
        itemId: String(entry.itemId),
        quantity: Math.max(1, Math.min(99, Math.round(Number(entry.quantity) || 1))),
      })),
    })),
    printYear: quote?.printYear ? String(quote.printYear) : '',
    package: {
      presetId: quote?.packageSnapshot?.presetId ? String(quote.packageSnapshot.presetId) : null,
      name: quote?.packageSnapshot?.name ?? '',
      subtitle: quote?.packageSnapshot?.subtitle ?? '',
      description: quote?.packageSnapshot?.description ?? '',
    },
    setId: quote?.deliverables?.setId ? String(quote.deliverables.setId) : null,
    lines: (quote?.deliverables?.lines ?? []).map((line) => ({
      ...line,
      _id: String(line._id),
      disabled: Boolean(line.disabled),
      sellingPrice: Number(line.sellingPrice) || 0,
      mrpPrice: Number(line.mrpPrice ?? line.sellingPrice) || 0,
      costPrice: Number(line.costPrice) || 0,
    })),
    addOnId: legacyAddOnId || selectedAddOns[0]?.addOnId || null,
    includeAddOnInTotal: legacyIncluded || selectedAddOns[0]?.includeInTotal || false,
    selectedAddOns,
    label: quote?.label ?? '',
    quoteId: String(quote?._id ?? ''),
  };
};

const withReels = (state) => ({ ...state, lines: recalcReels(state.lines, flattenEntries(state.days), newObjectId) });

const snapshotOf = (item) => ({
  name: item.name,
  sellingPrice: item.sellingPrice ?? 0,
  costPrice: item.costPrice,
  mrpPrice: item.mrpPrice ?? 0,
  deliverables: item.deliverables ?? [],
  note: item.note ?? '',
});

const addOrIncrementEntry = (day, item, side) => {
  const match = day.entries.find((entry) => String(entry.itemId) === String(item._id) && entry.side === side);
  if (!match) {
    return {
      ...day,
      entries: [...day.entries, { _id: newObjectId(), itemId: item._id, side, quantity: 1, note: '', itemSnapshot: snapshotOf(item) }],
    };
  }
  return {
    ...day,
    entries: day.entries.map((entry) => entry._id === match._id
      ? { ...entry, quantity: Math.min(99, (Number(entry.quantity) || 1) + 1) }
      : entry),
  };
};

const mergeDuplicateEntries = (entries) => entries.reduce((merged, entry) => {
  const match = merged.find((candidate) => String(candidate.itemId) === String(entry.itemId) && candidate.side === entry.side);
  if (!match) return [...merged, entry];
  return merged.map((candidate) => candidate._id === match._id
    ? {
        ...candidate,
        quantity: Math.min(99, (Number(candidate.quantity) || 1) + (Number(entry.quantity) || 1)),
        note: candidate.note || entry.note || '',
      }
    : candidate);
}, []);

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
      const days = state.days.map((day, index) => (index === action.dayIndex ? addOrIncrementEntry(day, action.item, action.side) : day));
      return withReels({ ...state, days });
    }
    case 'addEntryAllDays':
      return withReels({ ...state, days: state.days.map((day) => addOrIncrementEntry(day, action.item, action.side)) });
    case 'copyDayEntries': {
      const source = state.days[action.fromDayIndex];
      if (!source || action.toDayIndex < 0 || action.toDayIndex >= state.days.length) return state;
      const entries = source.entries.map((entry) => ({ ...entry, _id: newObjectId() }));
      const days = state.days.map((day, index) => (index === action.toDayIndex ? { ...day, entries } : day));
      return withReels({ ...state, days });
    }
    case 'removeEntry': {
      const days = state.days.map((d, i) => {
        const matchesDay = (action.dayId && String(d._id) === String(action.dayId)) || Number(i) === Number(action.dayIndex);
        if (!matchesDay) return d;
        return {
          ...d,
          entries: d.entries.filter((e) => String(e._id) !== String(action.entryId)),
        };
      });
      return withReels({ ...state, days });
    }
    case 'removeEntryAllDays': {
      const days = state.days.map((d) => ({
        ...d,
        entries: d.entries.filter((e) => {
          if (action.itemId && e.itemId && String(e.itemId) === String(action.itemId)) return false;
          if (action.itemName && e.itemSnapshot?.name && e.itemSnapshot.name.trim().toLowerCase() === action.itemName.trim().toLowerCase()) return false;
          if (action.entryId && e._id === action.entryId) return false;
          return true;
        }),
      }));
      return withReels({ ...state, days });
    }
    case 'updateEntry': {
      const days = state.days.map((d, i) =>
        i === action.dayIndex
          ? { ...d, entries: mergeDuplicateEntries(d.entries.map((e) => (e._id === action.entryId ? { ...e, ...action.patch } : e))) }
          : d,
      );
      return withReels({ ...state, days });
    }
    case 'chooseSet':
      return { ...state, setId: action.set?._id ?? null, lines: linesFromSet(action.set?.lines ?? [], flattenEntries(state.days), newObjectId) };
    case 'serverLines':
      return { ...state, lines: action.lines, setId: action.setId ?? state.setId };
    case 'editLine':
      return { ...state, lines: editLineText(state.lines, action.lineId, action.text) };
    case 'toggleLine':
      return {
        ...state,
        lines: state.lines.map((l) => (l._id === action.lineId ? { ...l, disabled: !l.disabled } : l)),
      };
    case 'setLinePrice': {
      const price = Math.max(0, Number(action.price) || 0);
      return {
        ...state,
        lines: state.lines.map((l) => (l._id === action.lineId ? { ...l, sellingPrice: price, mrpPrice: price } : l)),
      };
    }
    case 'addLine': {
      const price = Math.max(0, Number(action.price) || 0);
      const newLine = {
        _id: newObjectId(),
        text: String(action.text || '').trim(),
        note: String(action.note || '').trim(),
        sellingPrice: price,
        mrpPrice: price,
        costPrice: 0,
        disabled: false,
        isAuto: false,
        isEdited: false,
        baseText: '',
      };
      return {
        ...state,
        lines: [...state.lines, newLine],
      };
    }
    case 'removeLine':
      return {
        ...state,
        lines: state.lines.filter((l) => l._id !== action.lineId),
      };
    case 'setLineNote':
      return { ...state, lines: state.lines.map((l) => (l._id === action.lineId ? { ...l, note: action.note } : l)) };
    case 'resetReels':
      return { ...state, lines: resetReelsToAuto(state.lines, flattenEntries(state.days), newObjectId) };
    case 'chooseAddOn':
      return {
        ...state,
        addOnId: action.addOnId,
        includeAddOnInTotal: action.addOnId === state.addOnId ? state.includeAddOnInTotal : Boolean(action.addOnId),
        selectedAddOns: action.addOnId ? [{ addOnId: action.addOnId, includeInTotal: true }] : [],
      };
    case 'toggleAddOn': {
      const exists = state.selectedAddOns.some((a) => a.addOnId === action.addOnId);
      const nextList = exists
        ? state.selectedAddOns.filter((a) => a.addOnId !== action.addOnId)
        : [...state.selectedAddOns, { addOnId: action.addOnId, includeInTotal: true }];
      return {
        ...state,
        selectedAddOns: nextList,
        addOnId: nextList[0]?.addOnId ?? null,
        includeAddOnInTotal: nextList[0]?.includeInTotal ?? false,
      };
    }
    case 'toggleAddOnInTotal': {
      const nextList = state.selectedAddOns.map((a) =>
        a.addOnId === action.addOnId ? { ...a, includeInTotal: !a.includeInTotal } : a,
      );
      return {
        ...state,
        selectedAddOns: nextList,
        includeAddOnInTotal: nextList.find((a) => a.addOnId === state.addOnId)?.includeInTotal ?? state.includeAddOnInTotal,
      };
    }
    case 'setIncludeAddOnInTotal':
      return { ...state, includeAddOnInTotal: Boolean(action.value) };
    case 'setLabel':
      return { ...state, label: action.value };
    case 'setQuoteId':
      return { ...state, quoteId: action.id };
    case 'loadQuote':
      return wizardStateFromQuote(action.quote, action.today);
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
export const wizardToBody = (state, { includeLines = true } = {}) => {
  const selected = state.selectedAddOns && state.selectedAddOns.length > 0
    ? state.selectedAddOns
    : state.addOnId
      ? [{ addOnId: state.addOnId, includeInTotal: Boolean(state.includeAddOnInTotal) }]
      : [];

  return {
    label: state.label ?? '',
    packageSnapshot: { ...state.package },
    printYear: state.printYear ? Number(state.printYear) : null,
    days: state.days.map((d) => ({
      _id: d._id,
      date: d.date,
      entries: d.entries.map((e) => ({ _id: e._id, itemId: String(e.itemId), side: e.side, quantity: Math.max(1, Math.min(99, Math.round(Number(e.quantity) || 1))), note: e.note ?? '' })),
    })),
    ...(includeLines && state.lines.length
      ? {
          deliverables: {
            setId: state.setId,
            lines: state.lines.map((l) => ({
              _id: l._id,
              text: l.text,
              note: l.note ?? '',
              isAuto: Boolean(l.isAuto),
              isEdited: Boolean(l.isEdited),
              disabled: Boolean(l.disabled),
              sellingPrice: Number(l.sellingPrice) || 0,
              mrpPrice: Number(l.mrpPrice ?? l.sellingPrice) || 0,
              costPrice: Number(l.costPrice) || 0,
            })),
          },
        }
      : {}),
    addOn: selected[0] ? { addOnId: selected[0].addOnId, includeInTotal: Boolean(selected[0].includeInTotal) } : null,
    addOns: selected.map((a) => ({ addOnId: a.addOnId, includeInTotal: Boolean(a.includeInTotal) })),
    // Setup changes rebuild the automatic total. A manual final-price override
    // from the editor must not hide a newly included add-on or changed service.
    pricing: { override: { mrp: null, selling: null } },
  };
};
