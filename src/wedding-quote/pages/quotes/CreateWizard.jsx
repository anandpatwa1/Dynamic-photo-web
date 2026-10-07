import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Check, Copy, Plus, RotateCcw, Sparkles, Star, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { Badge, Button, Input, SearchInput, SegmentedControl, Select, Textarea } from '@/components/ui';
import { cn } from '@/utils/cn';
import { CRM } from '@/routes/paths';
import { Calendar } from '../../components/Calendar';
import { PermissionGate } from '../../components/PermissionGate';
import { useWqPermissions } from '../../hooks/useWqPermissions';
import { wqMasters, wqQuoteApi } from '../../api/wqApi';
import { canAdvance, initialWizardState, wizardReducer, wizardToBody, WIZARD_STEPS } from '../../utils/wizardReducer';
import { computePricing, daySubtotal } from '../../utils/engine/pricing';
import { formatDate, MAX_DATES } from '../../utils/engine/dates';
import { formatINR } from '../../utils/engine/money';
import { T, fmt } from '../../constants/strings';

const W = T.wizard;
const SIDES = ['none', 'bride', 'groom', 'both'];

export const CreateWizard = () => (
  <PermissionGate anyOf={['createQuote']}>
    <WizardInner />
  </PermissionGate>
);

const useMasters = () => {
  const [m, setM] = useState({ items: [], sets: [], addOns: [], presets: [], loaded: false });
  useEffect(() => {
    const q = { isActive: 'true', limit: 200 };
    Promise.all([wqMasters.items.list(q), wqMasters.sets.list(q), wqMasters.addOns.list(q), wqMasters.presets.list(q)])
      .then(([i, s, a, p]) => setM({ items: i.data.items, sets: s.data.items, addOns: a.data.items, presets: p.data.items, loaded: true }))
      .catch(() => setM((x) => ({ ...x, loaded: true })));
  }, []);
  return [m, setM];
};

const WizardInner = () => {
  const navigate = useNavigate();
  const perms = useWqPermissions();
  const [state, dispatch] = useReducer(wizardReducer, undefined, () => initialWizardState());
  const [masters, setMasters] = useMasters();
  const [saving, setSaving] = useState(false);
  const stateRef = useRef(state);
  stateRef.current = state;

  // ---- server sync (autosave to draft) ------------------------------------
  const save = useCallback(async ({ applySet = false, final = false } = {}) => {
    const s = stateRef.current;
    if (!s.days.length) return null;
    const body = wizardToBody(s, { includeLines: !applySet });
    if (applySet) body.deliverables = { setId: s.setId, applySet: true };
    setSaving(true);
    try {
      const res = s.quoteId ? await wqQuoteApi.update(s.quoteId, body) : await wqQuoteApi.create(body);
      if (!s.quoteId) dispatch({ type: 'setQuoteId', id: res.quote._id });
      // Server-built lines replace local ones whenever the set was (re)applied, so ids line up.
      if (applySet || !s.quoteId) dispatch({ type: 'serverLines', lines: res.quote.deliverables.lines, setId: res.quote.deliverables.setId });
      return res.quote;
    } catch (e) {
      toast.error(e?.response?.data?.message ?? 'Could not save the draft');
      return null;
    } finally {
      if (!final) setSaving(false);
    }
  }, []);

  // Debounced autosave after edits once a draft exists.
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) { firstRun.current = false; return undefined; }
    if (!state.quoteId) return undefined;
    const t = setTimeout(() => save(), 1500);
    return () => clearTimeout(t);
  }, [state.days, state.package, state.printYear, state.lines, state.addOnId, state.label, state.quoteId, save]);

  // Default deliverable set pre-selected.
  useEffect(() => {
    if (masters.loaded && !state.setId) {
      const def = masters.sets.find((s) => s.isDefault);
      if (def) dispatch({ type: 'chooseSet', set: def });
    }
  }, [masters.loaded]); // eslint-disable-line react-hooks/exhaustive-deps

  const next = async () => {
    if (!canAdvance(state)) {
      toast.error(state.step === 0 ? W.noDates : W.packageName);
      return;
    }
    if (state.step === WIZARD_STEPS - 1) {
      const quote = await save({ final: true });
      if (quote) navigate(CRM.wqQuoteEdit(quote._id));
      else setSaving(false);
      return;
    }
    await save();
    dispatch({ type: 'next' });
  };

  const chooseSet = async (set) => {
    dispatch({ type: 'chooseSet', set });
    if (stateRef.current.quoteId) {
      stateRef.current = { ...stateRef.current, setId: set?._id ?? null };
      await save({ applySet: true });
    }
  };

  const makeDefault = async (set) => {
    try {
      await wqMasters.sets.update(set._id, { isDefault: true });
      setMasters((m) => ({ ...m, sets: m.sets.map((s) => ({ ...s, isDefault: s._id === set._id })) }));
      toast.success(T.sets.makeDefault);
    } catch (e) {
      toast.error(e?.response?.data?.message ?? 'Could not update');
    }
  };

  useEffect(() => {
    if (state.error === 'max') toast.error(W.maxReached);
    if (state.error === 'invalid') toast.error(W.invalidDate);
    if (state.error === 'max' || state.error === 'invalid') dispatch({ type: 'clearError' });
  }, [state.error]);

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-paper">
      {/* header + step indicator */}
      <header className="flex shrink-0 items-center gap-3 border-b border-ink-200/70 bg-white px-4 py-3 sm:px-6">
        <Button variant="ghost" iconOnly icon={X} aria-label={T.common.close} onClick={() => navigate(state.quoteId ? CRM.wqQuoteEdit(state.quoteId) : CRM.wqQuotes)} />
        <div className="min-w-0 sm:w-44">
          <p className="hidden font-semibold text-ink-900 sm:block">{W.title}</p>
          <p className="truncate text-sm font-semibold text-ink-900 sm:hidden">{W.steps[state.step]}</p>
          <p className="text-xs text-ink-400 sm:hidden">Step {state.step + 1} of {WIZARD_STEPS}</p>
        </div>
        <ol className="mx-auto flex items-center gap-1.5 overflow-x-auto" aria-label="Steps">
          {W.steps.map((label, i) => (
            <li key={label}>
              <button type="button" disabled={i > state.step} onClick={() => dispatch({ type: 'goto', step: i })}
                aria-current={i === state.step ? 'step' : undefined}
                className={cn('flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium',
                  i === state.step ? 'bg-ink-900 text-white' : i < state.step ? 'bg-brand-50 text-brand-700' : 'text-ink-400')}>
                <span className="tabular">{i < state.step ? <Check className="h-3.5 w-3.5" /> : i + 1}</span>
                <span className="hidden md:inline">{label}</span>
              </button>
            </li>
          ))}
        </ol>
        <span className="w-16 shrink-0 text-right text-2xs text-ink-400 sm:w-24 sm:text-xs" aria-live="polite">{saving ? T.common.saving : state.quoteId ? T.common.saved : ''}</span>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
        <div className="mx-auto w-full max-w-4xl">
          {state.step === 0 && <StepDates state={state} dispatch={dispatch} />}
          {state.step === 1 && <StepPackage state={state} dispatch={dispatch} presets={masters.presets} />}
          {state.step === 2 && <StepItems state={state} dispatch={dispatch} items={masters.items} perms={perms} />}
          {state.step === 3 && <StepDeliverables state={state} dispatch={dispatch} sets={masters.sets} onChoose={chooseSet} onMakeDefault={perms.manageMasters ? makeDefault : null} />}
          {state.step === 4 && <StepAddOn state={state} dispatch={dispatch} addOns={masters.addOns} />}
        </div>
      </main>

      <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-ink-200/70 bg-white px-4 py-3 sm:px-6">
        <Button variant="secondary" icon={ArrowLeft} disabled={state.step === 0} onClick={() => dispatch({ type: 'back' })}>{T.common.back}</Button>
        <Button iconRight={state.step === WIZARD_STEPS - 1 ? Sparkles : ArrowRight} loading={saving && state.step === WIZARD_STEPS - 1} onClick={next}>
          {state.step === WIZARD_STEPS - 1 ? W.finish : T.common.next}
        </Button>
      </footer>
    </div>
  );
};

// ---------------------------------------------------------------- step 1
const StepDates = ({ state, dispatch }) => (
  <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
    <section>
      <h2 className="text-xl font-semibold text-ink-900">{W.datesTitle}</h2>
      <p className="mb-4 text-sm text-ink-500">{W.datesHint}</p>
      <Calendar view={state.view} onViewChange={(view) => dispatch({ type: 'setView', view })} selected={state.days.map((d) => d.date)} max={MAX_DATES}
        onToggle={(date) => dispatch({ type: 'toggleDate', date })} />
    </section>
    <aside className="space-y-4">
      <div>
        <p className="mb-2 text-sm font-medium text-ink-800">{W.selected} ({state.days.length}/{MAX_DATES})</p>
        {!state.days.length && <p className="text-sm text-ink-400">{W.noDates}</p>}
        <ul className="space-y-1.5">
          {state.days.map((d, i) => (
            <li key={d._id} className="flex items-center gap-1 rounded-xl bg-white px-3 py-2 ring-1 ring-ink-200">
              <span className="flex-1 font-medium text-ink-800">{formatDate(d.date, 'plain')}</span>
              <Button size="xs" variant="ghost" iconOnly icon={ArrowUp} aria-label={T.common.moveUp} disabled={i === 0} onClick={() => dispatch({ type: 'moveDate', index: i, delta: -1 })} />
              <Button size="xs" variant="ghost" iconOnly icon={ArrowDown} aria-label={T.common.moveDown} disabled={i === state.days.length - 1} onClick={() => dispatch({ type: 'moveDate', index: i, delta: 1 })} />
              <Button size="xs" variant="ghost" iconOnly icon={Trash2} aria-label={T.common.remove} onClick={() => dispatch({ type: 'removeDate', index: i })} />
            </li>
          ))}
        </ul>
      </div>
      <Input label={W.printYear} hint={W.printYearHint} inputMode="numeric" placeholder="e.g. 2026" value={state.printYear}
        onChange={(e) => dispatch({ type: 'setPrintYear', value: e.target.value.replace(/\D/g, '').slice(0, 4) })} />
      <Input label={W.label} optional value={state.label} onChange={(e) => dispatch({ type: 'setLabel', value: e.target.value })} />
    </aside>
  </div>
);

// ---------------------------------------------------------------- step 2
const StepPackage = ({ state, dispatch, presets }) => (
  <section>
    <h2 className="mb-4 text-xl font-semibold text-ink-900">{W.packageTitle}</h2>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {presets.map((p) => (
        <button key={p._id} type="button" onClick={() => dispatch({ type: 'choosePreset', preset: p })}
          className={cn('rounded-2xl bg-white p-4 text-left ring-1 transition', state.package.presetId === p._id ? 'ring-2 ring-brand-500' : 'ring-ink-200 hover:ring-brand-300')}>
          <p className="font-semibold text-ink-900">{p.name}</p>
          <p className="text-sm text-ink-500">{p.subtitle}</p>
        </button>
      ))}
    </div>
    <div className="mt-6 space-y-3 rounded-2xl bg-white p-4 ring-1 ring-ink-200">
      <p className="text-sm font-medium text-ink-800">{W.customPackage}</p>
      <Input label={W.packageName} required value={state.package.name} onChange={(e) => dispatch({ type: 'setPackage', patch: { name: e.target.value, presetId: null } })} />
      <Input label={W.subtitle} value={state.package.subtitle} onChange={(e) => dispatch({ type: 'setPackage', patch: { subtitle: e.target.value } })} />
      <Textarea label={W.description} rows={2} value={state.package.description} onChange={(e) => dispatch({ type: 'setPackage', patch: { description: e.target.value } })} />
    </div>
  </section>
);

// ---------------------------------------------------------------- step 3
const StepItems = ({ state, dispatch, items }) => {
  const [query, setQuery] = useState('');
  const [side, setSide] = useState('both');
  const i = state.activeDay;
  const day = state.days[i];
  const filteredItems = useMemo(() => items.filter((item) => item.name.toLowerCase().includes(query.trim().toLowerCase())), [items, query]);
  if (!day) return null;
  const subtotal = daySubtotal(day);
  return (
    <section>
      <div className="-mx-4 mb-4 flex gap-1.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        {state.days.map((d, k) => (
          <button key={d._id} type="button" onClick={() => dispatch({ type: 'setActiveDay', index: k })}
            className={cn('shrink-0 rounded-full px-3 py-1.5 text-sm font-medium', k === i ? 'bg-ink-900 text-white' : 'bg-white text-ink-600 ring-1 ring-ink-200')}>
            {formatDate(d.date, 'short')} <span className="opacity-60">({d.entries.length})</span>
          </button>
        ))}
      </div>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-xl font-semibold text-ink-900">{W.itemsTitle} {formatDate(day.date, 'plain')}</h2>
          <p className="text-sm text-ink-500">{fmt(W.dayOf, { n: i + 1, total: state.days.length })}</p>
        </div>
        {i > 0 && day.entries.length === 0 && state.days[i - 1].entries.length > 0 && (
          <Button size="sm" variant="secondary" icon={Copy} onClick={() => { dispatch({ type: 'copyDayEntries', fromDayIndex: i - 1, toDayIndex: i }); toast.success(W.copiedPreviousDay); }}>{W.copyPreviousDay}</Button>
        )}
      </div>

      <div className="mb-4 grid gap-3 rounded-2xl bg-white p-3 shadow-card sm:grid-cols-[1fr_auto] sm:items-end">
        <SearchInput value={query} onChange={setQuery} delay={0} placeholder={W.searchItems} />
        <div>
          <p className="mb-1.5 text-xs font-medium text-ink-500">{W.addAs}</p>
          <SegmentedControl value={side} onChange={setSide} options={SIDES.map((value) => ({ value, label: T.sides[value] }))} />
        </div>
      </div>

      {day.entries.length > 0 && <div className="mb-5 rounded-2xl bg-white p-4 ring-1 ring-ink-200">
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="font-semibold text-ink-900">{W.selectedItems} <span className="text-ink-400">({day.entries.length})</span></p>
          <span className="tabular text-sm font-semibold text-ink-900">{formatINR(subtotal.selling)}</span>
        </div>
        <ul className="divide-y divide-ink-100">
          {day.entries.map((e) => (
            <li key={e._id} className="grid gap-2 py-2.5 sm:grid-cols-[1fr_72px_140px_1fr_auto] sm:items-center">
              <p className="font-medium text-ink-900">{Number(e.quantity) > 1 && <span className="mr-1 text-brand-700">{e.quantity} ×</span>}{e.itemSnapshot.name} <span className="tabular text-sm text-ink-400">{formatINR(e.itemSnapshot.sellingPrice)}{Number(e.quantity) > 1 ? ` · ${formatINR(e.itemSnapshot.sellingPrice * e.quantity)}` : ''}</span></p>
              <Input aria-label={W.quantity} type="number" min="1" max="99" inputMode="numeric" value={e.quantity ?? 1} onChange={(ev) => dispatch({ type: 'updateEntry', dayIndex: i, entryId: e._id, patch: { quantity: Math.max(1, Math.min(99, Number(ev.target.value) || 1)) } })} />
              <Select aria-label={W.side} value={e.side} options={SIDES.map((s) => ({ value: s, label: T.sides[s] }))}
                onChange={(ev) => dispatch({ type: 'updateEntry', dayIndex: i, entryId: e._id, patch: { side: ev.target.value } })} />
              <Input aria-label={W.entryNote} placeholder={W.entryNote} value={e.note} onChange={(ev) => dispatch({ type: 'updateEntry', dayIndex: i, entryId: e._id, patch: { note: ev.target.value } })} />
              <Button size="sm" variant="ghost" iconOnly icon={Trash2} aria-label={T.common.remove} onClick={() => dispatch({ type: 'removeEntry', dayIndex: i, entryId: e._id })} />
            </li>
          ))}
        </ul>
      </div>}

      <p className="mb-2 text-sm font-semibold text-ink-700">{W.availableItems}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {filteredItems.map((item) => (
          <div key={item._id} className="flex min-h-16 items-center justify-between gap-3 rounded-xl bg-white px-3 py-2.5 ring-1 ring-ink-200 transition hover:ring-brand-300">
            <div className="min-w-0">
              <p className="truncate font-medium text-ink-900">{item.name}</p>
              <p className="tabular text-xs text-ink-500">{formatINR(item.sellingPrice)}</p>
            </div>
            <Button size="sm" variant="subtle" icon={Plus} onClick={() => dispatch({ type: 'addEntry', dayIndex: i, item, side })} aria-label={`${W.addItem} ${item.name} ${T.sides[side]}`}>{W.addItem}</Button>
          </div>
        ))}
      </div>
      {!filteredItems.length && <p className="rounded-2xl bg-white py-10 text-center text-sm text-ink-400 ring-1 ring-ink-200">{W.noMatchingItems}</p>}
      {!day.entries.length && !query && <p className="mt-3 text-center text-sm text-ink-400">{W.noItemsOnDay}</p>}
      <div className="mt-4 flex justify-between">
        <Button variant="ghost" icon={ArrowLeft} disabled={i === 0} onClick={() => dispatch({ type: 'setActiveDay', index: i - 1 })}>{formatDate(state.days[i - 1]?.date ?? day.date, 'short')}</Button>
        <Button variant="ghost" iconRight={ArrowRight} disabled={i === state.days.length - 1} onClick={() => dispatch({ type: 'setActiveDay', index: i + 1 })}>{formatDate(state.days[i + 1]?.date ?? day.date, 'short')}</Button>
      </div>
    </section>
  );
};

// ---------------------------------------------------------------- step 4
const StepDeliverables = ({ state, dispatch, sets, onChoose, onMakeDefault }) => (
  <section>
    <h2 className="mb-4 text-xl font-semibold text-ink-900">{W.setTitle}</h2>
    <div className="grid gap-3 sm:grid-cols-2">
      {sets.map((s) => (
        <div key={s._id} className={cn('rounded-2xl bg-white p-4 ring-1', state.setId === s._id ? 'ring-2 ring-brand-500' : 'ring-ink-200')}>
          <button type="button" className="w-full text-left" onClick={() => onChoose(s)}>
            <p className="flex items-center gap-2 font-semibold text-ink-900">{s.name}{s.isDefault && <Badge tone="brand" size="sm">{T.sets.defaultBadge}</Badge>}</p>
            <p className="mt-1 text-xs text-ink-500">{s.lines.map((l) => l.text).join(' · ')}</p>
          </button>
          {onMakeDefault && !s.isDefault && <Button size="xs" variant="link" icon={Star} className="mt-2 px-0" onClick={() => onMakeDefault(s)}>{T.sets.makeDefault}</Button>}
        </div>
      ))}
    </div>
    <div className="mt-6 space-y-2 rounded-2xl bg-white p-4 ring-1 ring-ink-200">
      {state.lines.map((l) => (
        <div key={l._id} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-center">
          <Input aria-label="Deliverable line" value={l.text} onChange={(e) => dispatch({ type: 'editLine', lineId: l._id, text: e.target.value })}
            trailing={<span className="flex items-center gap-1.5">{l.isAuto && <Badge size="sm" tone={l.isEdited ? 'warning' : 'brand'}>{l.isEdited ? W.edited : W.autoLine}</Badge>}{Number(l.sellingPrice) > 0 && <span className="tabular text-xs font-medium text-ink-500">{formatINR(l.sellingPrice)}</span>}</span>} />
          <Input aria-label={T.common.note} placeholder={T.common.note} value={l.note ?? ''} onChange={(e) => dispatch({ type: 'setLineNote', lineId: l._id, note: e.target.value })} />
          {l.isAuto && l.isEdited ? <Button size="sm" variant="ghost" icon={RotateCcw} onClick={() => dispatch({ type: 'resetReels' })}>{W.resetAuto}</Button> : <span />}
        </div>
      ))}
    </div>
  </section>
);

// ---------------------------------------------------------------- step 5
const StepAddOn = ({ state, dispatch, addOns }) => {
  const serviceCount = state.days.reduce((sum, day) => sum + day.entries.length, 0);
  const total = computePricing({ days: state.days, deliverables: { lines: state.lines } }).auto.selling;
  return <section>
    <h2 className="mb-4 text-xl font-semibold text-ink-900">{W.addOnTitle}</h2>
    <div className="grid gap-3 sm:grid-cols-2">
      <button type="button" onClick={() => dispatch({ type: 'chooseAddOn', addOnId: null })}
        className={cn('rounded-2xl bg-white p-4 text-left ring-1', !state.addOnId ? 'ring-2 ring-brand-500' : 'ring-ink-200')}>
        <p className="font-semibold text-ink-900">{W.noAddOn}</p>
      </button>
      {addOns.map((a) => (
        <button key={a._id} type="button" onClick={() => dispatch({ type: 'chooseAddOn', addOnId: a._id })}
          className={cn('rounded-2xl bg-white p-4 text-left ring-1', state.addOnId === a._id ? 'ring-2 ring-brand-500' : 'ring-ink-200')}>
          <p className="font-semibold text-ink-900">{a.badge && <Badge size="sm" className="mr-2">{a.badge}</Badge>}{a.title}</p>
          <p className="text-sm text-ink-500">{a.text}</p>
          {Number(a.priceAmount) > 0 && <p className="mt-1 text-xs font-medium text-brand-700">Add {formatINR(a.priceAmount)}</p>}
        </button>
      ))}
    </div>
    <div className="mt-6 rounded-2xl bg-ink-900 p-4 text-white sm:flex sm:items-center sm:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-white/55">{W.quoteSummary}</p>
        <p className="mt-1 text-sm text-white/75">{state.days.length} dates · {serviceCount} {W.services}</p>
      </div>
      <p className="mt-3 tabular text-xl font-semibold sm:mt-0"><span className="mr-2 text-xs font-medium uppercase tracking-wider text-white/55">{W.total}</span>{formatINR(total)}</p>
    </div>
  </section>
};

export default CreateWizard;
