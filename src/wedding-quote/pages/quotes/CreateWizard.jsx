import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, CalendarPlus2, Check, Copy, ListChecks, Plus, RotateCcw, Sparkles, Star, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { Badge, Button, Input, PageLoader, SearchInput, SegmentedControl, Select, Switch, Textarea } from '@/components/ui';
import { cn } from '@/utils/cn';
import { CRM } from '@/routes/paths';
import { Calendar } from '../../components/Calendar';
import { PermissionGate } from '../../components/PermissionGate';
import { useWqPermissions } from '../../hooks/useWqPermissions';
import { useBookingCalendar } from '../../hooks/useBookingCalendar';
import { wqMasters, wqQuoteApi } from '../../api/wqApi';
import { canAdvance, initialWizardState, wizardReducer, wizardToBody, WIZARD_STEPS } from '../../utils/wizardReducer';
import { computePricing, daySubtotal } from '../../utils/engine/pricing';
import { formatDate, MAX_DATES, MONTHS } from '../../utils/engine/dates';
import { formatINR } from '../../utils/engine/money';
import { T, fmt } from '../../constants/strings';

const W = T.wizard;
const E = T.editor;
const SIDES = ['none', 'bride', 'groom', 'both'];

export const CreateWizard = () => {
  const { id } = useParams();
  return (
    <PermissionGate anyOf={id ? ['editQuote', 'createQuote'] : ['createQuote']}>
      <WizardInner />
    </PermissionGate>
  );
};

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
  const { id: editId } = useParams();
  const perms = useWqPermissions();
  const [state, dispatch] = useReducer(wizardReducer, undefined, () => initialWizardState());
  const [masters, setMasters] = useMasters();
  const [saving, setSaving] = useState(false);
  const [loadingQuote, setLoadingQuote] = useState(Boolean(editId));
  const [loadError, setLoadError] = useState(null);
  const bookingCalendar = useBookingCalendar(state.view);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    if (!editId) return;
    setLoadingQuote(true);
    wqQuoteApi.get(editId)
      .then((result) => dispatch({ type: 'loadQuote', quote: result.quote }))
      .catch((error) => setLoadError(error?.response?.data?.message ?? 'Quote could not be opened'))
      .finally(() => setLoadingQuote(false));
  }, [editId]);

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
  }, [state.days, state.package, state.printYear, state.lines, state.addOnId, state.includeAddOnInTotal, state.label, state.quoteId, save]);

  // Default deliverable set pre-selected.
  useEffect(() => {
    if (masters.loaded && !editId && !state.setId) {
      const def = masters.sets.find((s) => s.isDefault);
      if (def) dispatch({ type: 'chooseSet', set: def });
    }
  }, [masters.loaded, editId]); // eslint-disable-line react-hooks/exhaustive-deps

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

  if (loadingQuote) return <div className="fixed inset-0 z-[60] bg-paper"><PageLoader label="Opening quote setup" /></div>;
  if (loadError) return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-paper p-6">
      <div className="max-w-sm rounded-2xl bg-white p-6 text-center shadow-card">
        <p className="font-semibold text-ink-900">{loadError}</p>
        <Button className="mt-4" variant="secondary" icon={ArrowLeft} onClick={() => navigate(CRM.wqQuotes)}>{T.common.back}</Button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-paper">
      {/* header + step indicator */}
      <header className="flex shrink-0 items-center gap-3 border-b border-ink-200/70 bg-white px-4 py-3 sm:px-6">
        <Button variant="ghost" iconOnly icon={X} aria-label={T.common.close} onClick={() => navigate(state.quoteId ? CRM.wqQuoteEdit(state.quoteId) : CRM.wqQuotes)} />
        <div className="min-w-0 sm:w-44">
          <p className="hidden font-semibold text-ink-900 sm:block">{editId ? E.editSetup : W.title}</p>
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
        <div className={cn('mx-auto w-full', state.step === 2 ? 'max-w-6xl' : 'max-w-4xl')}>
          {state.step === 0 && <StepDates state={state} dispatch={dispatch} calendar={bookingCalendar} />}
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
const StepDates = ({ state, dispatch, calendar }) => (
  <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
    <section>
      <h2 className="text-xl font-semibold text-ink-900">{W.datesTitle}</h2>
      <p className="mb-4 text-sm text-ink-500">{W.datesHint}</p>
      <Calendar view={state.view} onViewChange={(view) => dispatch({ type: 'setView', view })} selected={state.days.map((d) => d.date)} max={MAX_DATES}
        onToggle={(date) => dispatch({ type: 'toggleDate', date })} bookings={calendar.bookings} festivals={calendar.festivals} />
      <div className="mt-4 flex flex-wrap gap-x-3 gap-y-2 text-xs text-ink-500">
        {calendar.bookingTypes.map((type) => (
          <span key={type.key} className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: type.color }} />{type.name}</span>
        ))}
        {calendar.showFestivals && <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-500" />{T.bookings.festivals}</span>}
      </div>
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
  const [side, setSide] = useState('none');
  const [selectedOpen, setSelectedOpen] = useState(false);
  const i = state.activeDay;
  const day = state.days[i];
  const filteredItems = useMemo(() => items.filter((item) => item.name.toLowerCase().includes(query.trim().toLowerCase())), [items, query]);
  useEffect(() => setSelectedOpen(false), [i]);
  if (!day) return null;
  const subtotal = daySubtotal(day);
  return (
    <section className="flex items-start gap-2 sm:gap-4">
      <DateRail days={state.days} active={i} onChange={(index) => dispatch({ type: 'setActiveDay', index })} />

      <div className="min-w-0 flex-1">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-ink-900 sm:text-xl">{W.itemsTitle} {formatDate(day.date, 'plain')}</h2>
            <p className="text-sm text-ink-500">{fmt(W.dayOf, { n: i + 1, total: state.days.length })}</p>
          </div>
          {i > 0 && day.entries.length === 0 && state.days[i - 1].entries.length > 0 && (
            <Button size="sm" variant="secondary" icon={Copy} onClick={() => { dispatch({ type: 'copyDayEntries', fromDayIndex: i - 1, toDayIndex: i }); toast.success(W.copiedPreviousDay); }}>{W.copyPreviousDay}</Button>
          )}
        </div>

        <div className="mb-4 grid gap-3 rounded-2xl bg-white p-3 shadow-card xl:grid-cols-[1fr_auto] xl:items-end">
          <SearchInput value={query} onChange={setQuery} delay={0} placeholder={W.searchItems} />
          <div className="min-w-0">
            <p className="mb-1.5 text-xs font-medium text-ink-500">{W.addAs}</p>
            <SegmentedControl className="max-w-full overflow-x-auto" value={side} onChange={setSide} options={SIDES.map((value) => ({ value, label: T.sides[value] }))} />
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
          <div className="min-w-0">
            <button type="button" onClick={() => setSelectedOpen(true)}
              className="sticky top-0 z-20 mb-3 flex w-full items-center justify-between gap-3 rounded-xl bg-ink-900 px-3 py-2.5 text-left text-white shadow-lg lg:hidden">
              <span className="flex min-w-0 items-center gap-2"><ListChecks className="h-4 w-4 shrink-0" /><span className="truncate text-sm font-semibold">{W.selectedItems} ({day.entries.length})</span></span>
              <span className="tabular shrink-0 text-sm font-semibold text-brand-200">{formatINR(subtotal.selling)}</span>
            </button>

            <p className="mb-2 text-sm font-semibold text-ink-700">{W.availableItems}</p>
            <div className="grid gap-2 xl:grid-cols-2">
              {filteredItems.map((item) => (
                <div key={item._id} className="min-h-20 rounded-xl bg-white p-3 ring-1 ring-ink-200 transition hover:ring-brand-300">
                  <div className="mb-2 min-w-0">
                    <p className="truncate font-medium text-ink-900">{item.name}</p>
                    <p className="tabular text-xs text-ink-500">{formatINR(item.sellingPrice)}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <Button fullWidth size="sm" variant="subtle" icon={Plus}
                      onClick={() => dispatch({ type: 'addEntry', dayIndex: i, item, side })}
                      aria-label={`${W.addItem} ${item.name} ${T.sides[side]}`}>{W.addItem}</Button>
                    <Button fullWidth size="sm" variant="secondary" icon={CalendarPlus2}
                      onClick={() => dispatch({ type: 'addEntryAllDays', item, side })}
                      aria-label={`${W.addAllDatesLabel} ${item.name} ${T.sides[side]}`}>{W.addAllDates}</Button>
                  </div>
                </div>
              ))}
            </div>
            {!filteredItems.length && <p className="rounded-2xl bg-white py-10 text-center text-sm text-ink-400 ring-1 ring-ink-200">{W.noMatchingItems}</p>}
            {!day.entries.length && !query && <p className="mt-3 text-center text-sm text-ink-400">{W.noItemsOnDay}</p>}
            <div className="mt-4 flex justify-between">
              <Button variant="ghost" icon={ArrowLeft} disabled={i === 0} onClick={() => dispatch({ type: 'setActiveDay', index: i - 1 })}>{formatDate(state.days[i - 1]?.date ?? day.date, 'short')}</Button>
              <Button variant="ghost" iconRight={ArrowRight} disabled={i === state.days.length - 1} onClick={() => dispatch({ type: 'setActiveDay', index: i + 1 })}>{formatDate(state.days[i + 1]?.date ?? day.date, 'short')}</Button>
            </div>
          </div>

          <aside className="sticky top-0 hidden max-h-[calc(100dvh-12rem)] overflow-y-auto rounded-2xl bg-white p-4 shadow-card ring-1 ring-ink-200 lg:block">
            <SelectedServices day={day} dayIndex={i} subtotal={subtotal} dispatch={dispatch} />
          </aside>
        </div>

        {selectedOpen && (
          <>
            <button type="button" className="fixed inset-0 z-[75] bg-ink-950/40 backdrop-blur-[2px] lg:hidden" aria-label={T.common.close} onClick={() => setSelectedOpen(false)} />
            <aside role="dialog" aria-modal="true" aria-label={W.selectedItems}
              className="fixed inset-x-3 bottom-[4.75rem] z-[80] max-h-[70dvh] overflow-y-auto rounded-2xl bg-white p-4 shadow-2xl lg:hidden">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="font-semibold text-ink-900">{W.selectedItems}</p>
                <Button size="sm" variant="ghost" iconOnly icon={X} aria-label={T.common.close} onClick={() => setSelectedOpen(false)} />
              </div>
              <SelectedServices day={day} dayIndex={i} subtotal={subtotal} dispatch={dispatch} compact />
            </aside>
          </>
        )}
      </div>
    </section>
  );
};

const DateRail = ({ days, active, onChange }) => (
  <nav className="sticky top-0 z-30 w-12 shrink-0 self-start space-y-1" aria-label={W.selected}>
    {days.map((day, index) => {
      const count = day.entries.reduce((sum, entry) => sum + Math.max(1, Number(entry.quantity) || 1), 0);
      return (
        <button key={day._id} type="button" onClick={() => onChange(index)} aria-current={index === active ? 'date' : undefined}
          aria-label={`${formatDate(day.date, 'plain')}, ${count} ${W.services}`}
          className={cn(
            'group relative z-0 flex h-12 w-12 items-center overflow-hidden rounded-xl text-left shadow-sm transition-[width,background-color,color] duration-200 hover:z-20 hover:w-44 focus:z-20 focus:w-44 focus:outline-none focus:ring-2 focus:ring-brand-400',
            index === active ? 'bg-ink-900 text-white' : 'bg-white text-ink-700 ring-1 ring-inset ring-ink-200 hover:bg-brand-50',
          )}>
          <span className="flex w-12 shrink-0 flex-col items-center justify-center leading-none">
            <span className="tabular text-sm font-bold">{day.date.day}</span>
            <span className={cn('mt-1 text-2xs font-semibold uppercase', index === active ? 'text-white/60' : 'text-ink-400')}>{MONTHS[day.date.month - 1].slice(0, 3)}</span>
          </span>
          <span className="min-w-0 flex-1 whitespace-nowrap pr-2 text-sm font-semibold opacity-0 transition-opacity group-hover:opacity-100 group-focus:opacity-100">
            {formatDate(day.date, 'plain')}
          </span>
          {count > 0 && <span className={cn('absolute right-1 top-1 rounded-full px-1 text-2xs font-bold group-hover:right-2 group-focus:right-2', index === active ? 'bg-white/15 text-white' : 'bg-brand-100 text-brand-700')}>{count}</span>}
        </button>
      );
    })}
  </nav>
);

const SelectedServices = ({ day, dayIndex, subtotal, dispatch, compact = false }) => (
  <div>
    {!compact && (
      <div className="mb-3">
        <div className="flex items-center justify-between gap-3">
          <p className="font-semibold text-ink-900">{W.selectedItems} <span className="text-ink-400">({day.entries.length})</span></p>
          <span className="tabular text-sm font-semibold text-ink-900">{formatINR(subtotal.selling)}</span>
        </div>
        <p className="mt-1 text-xs text-ink-400">{W.selectedHint}</p>
      </div>
    )}
    {!day.entries.length && <p className="rounded-xl bg-ink-50 px-3 py-6 text-center text-sm text-ink-400">{W.noItemsOnDay}</p>}
    <ul className="space-y-2">
      {day.entries.map((entry) => (
        <li key={entry._id} className="rounded-xl bg-ink-50 p-2.5 ring-1 ring-inset ring-ink-100">
          <div className="flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-ink-900"><span className="text-brand-700">{entry.quantity ?? 1} ×</span> {entry.itemSnapshot.name}</p>
              <p className="tabular text-xs text-ink-400">{formatINR(entry.itemSnapshot.sellingPrice)}{Number(entry.quantity) > 1 ? ` · ${formatINR(entry.itemSnapshot.sellingPrice * entry.quantity)}` : ''}</p>
            </div>
            <Input aria-label={`${W.quantity}: ${entry.itemSnapshot.name}`} type="number" min="1" max="99" inputMode="numeric" wrapperClassName="w-16 shrink-0"
              value={entry.quantity ?? 1} onChange={(event) => dispatch({ type: 'updateEntry', dayIndex, entryId: entry._id, patch: { quantity: Math.max(1, Math.min(99, Number(event.target.value) || 1)) } })} />
          </div>
          <div className="mt-2 grid grid-cols-[112px_minmax(0,1fr)_auto] gap-1.5">
            <Select aria-label={`${W.side}: ${entry.itemSnapshot.name}`} value={entry.side} options={SIDES.map((value) => ({ value, label: T.sides[value] }))}
              onChange={(event) => dispatch({ type: 'updateEntry', dayIndex, entryId: entry._id, patch: { side: event.target.value } })} />
            <Input aria-label={`${W.entryNote}: ${entry.itemSnapshot.name}`} placeholder={W.entryNote} value={entry.note}
              onChange={(event) => dispatch({ type: 'updateEntry', dayIndex, entryId: entry._id, patch: { note: event.target.value } })} />
            <Button size="sm" variant="ghost" iconOnly icon={Trash2} aria-label={`${T.common.remove} ${entry.itemSnapshot.name}`}
              onClick={() => dispatch({ type: 'removeEntry', dayIndex, entryId: entry._id })} />
          </div>
        </li>
      ))}
    </ul>
  </div>
);

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
  const selectedAddOn = addOns.find((addOn) => String(addOn._id) === String(state.addOnId));
  const total = computePricing({
    days: state.days,
    deliverables: { lines: state.lines },
    addOn: selectedAddOn ? { snapshot: { ...selectedAddOn, includeInTotal: state.includeAddOnInTotal } } : null,
  }).auto.selling;
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
    {selectedAddOn && Number(selectedAddOn.priceAmount) > 0 && (
      <div className="mt-4 rounded-2xl bg-white p-4 ring-1 ring-ink-200">
        <Switch label={T.addOns.includeInTotal}
          description={`${formatINR(selectedAddOn.priceAmount)} · ${state.includeAddOnInTotal ? T.addOns.includedInTotal : T.addOns.excludedFromTotal}`}
          checked={state.includeAddOnInTotal}
          onChange={(event) => dispatch({ type: 'setIncludeAddOnInTotal', value: event.target.checked })} />
      </div>
    )}
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
