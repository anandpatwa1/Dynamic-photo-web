import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, CalendarPlus2, Check, Copy, Eye, EyeOff, IndianRupee, Layers, ListChecks, Plus, RotateCcw, Sparkles, Star, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { Badge, Button, Input, Modal, PageLoader, SearchInput, SegmentedControl, Select, Switch, Textarea } from '@/components/ui';
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
import { newObjectId } from '../../utils/ids';
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
  const [searchParams]=useSearchParams();
  const initialTheme=searchParams.get('theme');
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
    if (!s.quoteId && initialTheme) body.themeId=initialTheme;
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
          {state.step === 2 && <StepItems state={state} dispatch={dispatch} items={masters.items} setMasters={setMasters} perms={perms} />}
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
const StepDates = ({ state, dispatch, calendar }) => {
  const conflicts = useMemo(() => {
    const selectedKeys = new Set(
      state.days.map((d) => `${d.date.year}-${String(d.date.month).padStart(2, '0')}-${String(d.date.day).padStart(2, '0')}`),
    );
    return (calendar.bookings ?? []).filter((b) => selectedKeys.has(b.dateKey));
  }, [state.days, calendar.bookings]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <section>
        <h2 className="text-xl font-semibold text-ink-900">{W.datesTitle}</h2>
        <p className="mb-4 text-sm text-ink-500">{W.datesHint}</p>

        {conflicts.length > 0 && (
          <div className="mb-4 flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-3.5 text-amber-900 shadow-sm">
            <span className="text-lg">⚠️</span>
            <div className="text-xs">
              <p className="font-semibold">Booking Conflict Notice ({conflicts.length} existing booking{conflicts.length > 1 ? 's' : ''}):</p>
              <ul className="mt-1 list-disc pl-4 space-y-0.5">
                {conflicts.map((c) => (
                  <li key={c._id}>
                    <span className="font-medium">{c.dateKey}</span>: {c.title || c.typeName || 'Booked shoot'} ({c.status || 'confirmed'})
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

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
            {state.days.map((d, i) => {
              const dKey = `${d.date.year}-${String(d.date.month).padStart(2, '0')}-${String(d.date.day).padStart(2, '0')}`;
              const hasConflict = (calendar.bookings ?? []).some((b) => b.dateKey === dKey);
              return (
                <li key={d._id} className={cn('flex items-center gap-1 rounded-xl bg-white px-3 py-2 ring-1', hasConflict ? 'ring-amber-400 bg-amber-50/40' : 'ring-ink-200')}>
                  <span className="flex-1 font-medium text-ink-800 flex items-center gap-1.5">
                    {formatDate(d.date, 'plain')}
                    {hasConflict && <span title="Existing booking on this date" className="text-xs text-amber-600 font-bold">⚠️</span>}
                  </span>
                  <Button size="xs" variant="ghost" iconOnly icon={ArrowUp} aria-label={T.common.moveUp} disabled={i === 0} onClick={() => dispatch({ type: 'moveDate', index: i, delta: -1 })} />
                  <Button size="xs" variant="ghost" iconOnly icon={ArrowDown} aria-label={T.common.moveDown} disabled={i === state.days.length - 1} onClick={() => dispatch({ type: 'moveDate', index: i, delta: 1 })} />
                  <Button size="xs" variant="ghost" iconOnly icon={Trash2} aria-label={T.common.remove} onClick={() => dispatch({ type: 'removeDate', index: i })} />
                </li>
              );
            })}
          </ul>
        </div>
        <Input label={W.printYear} hint={W.printYearHint} inputMode="numeric" placeholder="e.g. 2026" value={state.printYear}
          onChange={(e) => dispatch({ type: 'setPrintYear', value: e.target.value.replace(/\D/g, '').slice(0, 4) })} />
        <Input label={W.label} optional value={state.label} onChange={(e) => dispatch({ type: 'setLabel', value: e.target.value })} />
      </aside>
    </div>
  );
};

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
const StepItems = ({ state, dispatch, items, setMasters, perms }) => {
  const [query, setQuery] = useState('');
  const [side, setSide] = useState('none');
  const [selectedOpen, setSelectedOpen] = useState(false);
  const [customModalOpen, setCustomModalOpen] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [customScope, setCustomScope] = useState('current'); // 'current' | 'all'
  const [creatingCustom, setCreatingCustom] = useState(false);

  const i = state.activeDay;
  const day = state.days[i];
  const filteredItems = useMemo(() => items.filter((item) => item.name.toLowerCase().includes(query.trim().toLowerCase())), [items, query]);
  useEffect(() => setSelectedOpen(false), [i]);
  if (!day) return null;
  const subtotal = daySubtotal(day);

  const handleAddCustomService = async (e) => {
    e?.preventDefault?.();
    const trimmed = customName.trim();
    if (!trimmed) {
      toast.error('Please enter a service name');
      return;
    }
    const priceNum = Math.max(0, Number(customPrice) || 0);

    setCreatingCustom(true);
    try {
      let createdItem;
      try {
        const res = await wqMasters.items.create({
          name: trimmed,
          sellingPrice: priceNum,
          mrpPrice: priceNum,
          costPrice: 0,
          isActive: true,
        });
        createdItem = res.data.item;
        if (setMasters) {
          setMasters((m) => ({ ...m, items: [createdItem, ...m.items] }));
        }
      } catch (err) {
        // Fallback local item if network / master create is restricted
        console.warn('Master item create failed, creating local item:', err);
        createdItem = {
          _id: newObjectId(),
          name: trimmed,
          sellingPrice: priceNum,
          mrpPrice: priceNum,
          costPrice: 0,
          deliverables: [],
          note: '',
          isActive: true,
        };
        if (setMasters) {
          setMasters((m) => ({ ...m, items: [createdItem, ...m.items] }));
        }
      }

      if (customScope === 'all') {
        dispatch({ type: 'addEntryAllDays', item: createdItem, side });
        toast.success(`Custom service "${trimmed}" added to all dates (${formatINR(priceNum)})`);
      } else {
        dispatch({ type: 'addEntry', dayIndex: i, item: createdItem, side });
        toast.success(`Custom service "${trimmed}" added (${formatINR(priceNum)})`);
      }

      setCustomName('');
      setCustomPrice('');
      setCustomModalOpen(false);
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Could not add custom service');
    } finally {
      setCreatingCustom(false);
    }
  };

  return (
    <section className="flex items-start gap-2 sm:gap-4">
      <DateRail days={state.days} active={i} onChange={(index) => dispatch({ type: 'setActiveDay', index })} />

      <div className="min-w-0 flex-1">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-ink-900 sm:text-xl">{W.itemsTitle} {formatDate(day.date, 'plain')}</h2>
            <p className="text-sm text-ink-500">{fmt(W.dayOf, { n: i + 1, total: state.days.length })}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="brand"
              icon={Plus}
              onClick={() => setCustomModalOpen(true)}
            >
              Custom Service
            </Button>
            {i > 0 && day.entries.length === 0 && state.days[i - 1].entries.length > 0 && (
              <Button size="sm" variant="secondary" icon={Copy} onClick={() => { dispatch({ type: 'copyDayEntries', fromDayIndex: i - 1, toDayIndex: i }); toast.success(W.copiedPreviousDay); }}>{W.copyPreviousDay}</Button>
            )}
          </div>
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

            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-semibold text-ink-700">{W.availableItems}</p>
              <button
                type="button"
                onClick={() => setCustomModalOpen(true)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 transition"
              >
                <Plus className="h-3.5 w-3.5" /> Add custom service
              </button>
            </div>
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
            <SelectedServices day={day} dayIndex={i} allDays={state.days} subtotal={subtotal} dispatch={dispatch} />
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
              <SelectedServices day={day} dayIndex={i} allDays={state.days} subtotal={subtotal} dispatch={dispatch} compact />
            </aside>
          </>
        )}

        {/* Custom Service Modal (Name & Price Only) */}
        {customModalOpen && (
          <Modal
            open={customModalOpen}
            onClose={() => setCustomModalOpen(false)}
            layer={80}
            title="Add Custom Service"
            description="Enter the service name and price. It will be added to this quote and included in the total."
            footer={
              <div className="flex items-center justify-end gap-2">
                <Button variant="secondary" onClick={() => setCustomModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="brand"
                  loading={creatingCustom}
                  onClick={handleAddCustomService}
                >
                  Add Service
                </Button>
              </div>
            }
          >
            <form onSubmit={handleAddCustomService} className="space-y-4 py-1">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink-600 mb-1">
                  Service Name <span className="text-red-500">*</span>
                </label>
                <Input
                  autoFocus
                  placeholder="e.g. Drone Cinematography, LED Wall 8x12, Jimmy Jib"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink-600 mb-1">
                  Price (₹) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-semibold text-ink-400">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    placeholder="e.g. 15000"
                    value={customPrice}
                    onChange={(e) => setCustomPrice(e.target.value)}
                    className="h-10 w-full rounded-xl pl-8 pr-3 text-sm font-semibold text-ink-900 border border-ink-200 bg-white shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <p className="mt-1 text-2xs text-ink-400">This price will be added directly into the quote subtotal.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink-600 mb-1">
                  Apply To
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCustomScope('current')}
                    className={cn(
                      'rounded-xl p-2.5 text-left text-xs font-medium border transition',
                      customScope === 'current'
                        ? 'border-brand-500 bg-brand-50/50 text-brand-900 font-semibold'
                        : 'border-ink-200 bg-white text-ink-700 hover:border-ink-300',
                    )}
                  >
                    <p className="font-semibold">This Date Only</p>
                    <p className="text-2xs text-ink-400">{formatDate(day.date, 'plain')}</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomScope('all')}
                    className={cn(
                      'rounded-xl p-2.5 text-left text-xs font-medium border transition',
                      customScope === 'all'
                        ? 'border-brand-500 bg-brand-50/50 text-brand-900 font-semibold'
                        : 'border-ink-200 bg-white text-ink-700 hover:border-ink-300',
                    )}
                  >
                    <p className="font-semibold">All Dates</p>
                    <p className="text-2xs text-ink-400">{state.days.length} dates in quote</p>
                  </button>
                </div>
              </div>
            </form>
          </Modal>
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

const SelectedServices = ({ day, dayIndex, allDays = [], subtotal, dispatch, compact = false }) => {
  const handleRemoveFromThisDate = (entry) => {
    dispatch({
      type: 'removeEntry',
      dayIndex,
      dayId: day._id,
      entryId: entry._id,
    });
    toast.success(`Removed ${entry.itemSnapshot?.name || 'item'} from this date`);
  };

  const handleRemoveFromAllDates = (entry, count) => {
    dispatch({
      type: 'removeEntryAllDays',
      itemId: entry.itemId,
      itemName: entry.itemSnapshot?.name,
      entryId: entry._id,
    });
    toast.success(`Removed "${entry.itemSnapshot?.name || 'Service'}" from all ${count} dates`);
  };

  return (
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
        {day.entries.map((entry) => {
          const matchingDays = (allDays || []).filter((d) =>
            d.entries?.some((e) =>
              (entry.itemId && e.itemId && String(e.itemId) === String(entry.itemId)) ||
              (e.itemSnapshot?.name && entry.itemSnapshot?.name && e.itemSnapshot.name.trim().toLowerCase() === entry.itemSnapshot.name.trim().toLowerCase())
            )
          );
          const isCommon = matchingDays.length > 1;

          return (
            <li key={entry._id} className="rounded-xl bg-ink-50 p-2.5 ring-1 ring-inset ring-ink-100">
              <div className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="truncate font-medium text-ink-900">
                      <span className="text-brand-700">{entry.quantity ?? 1} ×</span> {entry.itemSnapshot.name}
                    </p>
                    {isCommon && (
                      <button
                        type="button"
                        onClick={() => handleRemoveFromAllDates(entry, matchingDays.length)}
                        className="inline-flex items-center gap-1 rounded-full bg-brand-50 hover:bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-brand-800 hover:text-red-700 border border-brand-200/60 transition cursor-pointer"
                        title={`Present on ${matchingDays.length} dates. Click to remove from all dates.`}
                      >
                        <span>On {matchingDays.length} dates</span>
                        <span className="text-red-500 font-bold hover:underline">· Remove all</span>
                      </button>
                    )}
                  </div>
                  <p className="tabular text-xs text-ink-400">
                    {formatINR(entry.itemSnapshot.sellingPrice)}
                    {Number(entry.quantity) > 1 ? ` · ${formatINR(entry.itemSnapshot.sellingPrice * entry.quantity)}` : ''}
                  </p>
                </div>
                <Input aria-label={`${W.quantity}: ${entry.itemSnapshot.name}`} type="number" min="1" max="99" inputMode="numeric" wrapperClassName="w-16 shrink-0"
                  value={entry.quantity ?? 1} onChange={(event) => dispatch({ type: 'updateEntry', dayIndex, entryId: entry._id, patch: { quantity: Math.max(1, Math.min(99, Number(event.target.value) || 1)) } })} />
              </div>
              <div className="mt-2 grid grid-cols-[112px_minmax(0,1fr)_auto] gap-1.5">
                <Select aria-label={`${W.side}: ${entry.itemSnapshot.name}`} value={entry.side} options={SIDES.map((value) => ({ value, label: T.sides[value] }))}
                  onChange={(event) => dispatch({ type: 'updateEntry', dayIndex, entryId: entry._id, patch: { side: event.target.value } })} />
                <Input aria-label={`${W.entryNote}: ${entry.itemSnapshot.name}`} placeholder={W.entryNote} value={entry.note}
                  onChange={(event) => dispatch({ type: 'updateEntry', dayIndex, entryId: entry._id, patch: { note: event.target.value } })} />
                <Button
                  size="sm"
                  variant="ghost"
                  iconOnly
                  icon={Trash2}
                  aria-label={`${T.common.remove} ${entry.itemSnapshot.name}`}
                  onClick={() => handleRemoveFromThisDate(entry)}
                  title="Remove from this date"
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

// ---------------------------------------------------------------- step 4
const StepDeliverables = ({ state, dispatch, sets, onChoose, onMakeDefault }) => {
  const [newText, setNewText] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newNote, setNewNote] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const activeLines = useMemo(() => state.lines.filter((l) => !l.disabled), [state.lines]);
  const disabledCount = state.lines.length - activeLines.length;
  const deliverablesTotalPrice = useMemo(
    () => activeLines.reduce((sum, l) => sum + (Number(l.sellingPrice) || 0), 0),
    [activeLines],
  );

  const handleAddLine = (e) => {
    e?.preventDefault?.();
    const textTrimmed = newText.trim();
    if (!textTrimmed) {
      toast.error('Please enter deliverable text');
      return;
    }
    const priceNum = Math.max(0, Number(newPrice) || 0);
    dispatch({ type: 'addLine', text: textTrimmed, price: priceNum, note: newNote.trim() });
    toast.success(`Deliverable added (${formatINR(priceNum)})`);
    setNewText('');
    setNewPrice('');
    setNewNote('');
    setShowAddForm(false);
  };

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-semibold text-ink-900">{W.setTitle}</h2>
          <p className="text-xs text-ink-500">Choose a deliverable preset or customize deliverables below</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {sets.map((s) => {
          const isSelected = state.setId === s._id;
          return (
            <div
              key={s._id}
              className={cn(
                'relative flex flex-col justify-between rounded-2xl bg-white p-4 ring-1 transition cursor-pointer',
                isSelected ? 'ring-2 ring-brand-500 bg-brand-50/20 shadow-sm' : 'ring-ink-200 hover:ring-brand-200',
              )}
              onClick={() => onChoose(s)}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <p className="flex items-center gap-2 font-semibold text-ink-900">
                    {s.name}
                    {s.isDefault && <Badge tone="brand" size="sm">{T.sets.defaultBadge}</Badge>}
                  </p>
                  <input
                    type="radio"
                    name="deliverable_set"
                    checked={isSelected}
                    readOnly
                    className="h-4 w-4 border-ink-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                  />
                </div>
                <p className="mt-2 text-xs text-ink-500 leading-relaxed line-clamp-2">
                  {s.lines.map((l) => l.text).join(' · ')}
                </p>
              </div>
              <div className="mt-3 flex items-center justify-between pt-2 border-t border-ink-100 text-2xs text-ink-400">
                <span>{s.lines?.length ?? 0} deliverables included</span>
                {onMakeDefault && !s.isDefault && (
                  <Button
                    size="xs"
                    variant="link"
                    icon={Star}
                    className="px-0 text-brand-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMakeDefault(s);
                    }}
                  >
                    {T.sets.makeDefault}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Deliverable Items List Header */}
      <div className="mt-6 rounded-2xl bg-white p-4 ring-1 ring-ink-200 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 pb-3">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-ink-900">Quote Deliverables</h3>
            <Badge tone="brand" size="sm">
              {activeLines.length} Active
            </Badge>
            {disabledCount > 0 && (
              <Badge tone="neutral" size="sm">
                {disabledCount} Off / Excluded
              </Badge>
            )}
            {deliverablesTotalPrice > 0 && (
              <Badge tone="success" size="sm">
                Deliverables: +{formatINR(deliverablesTotalPrice)}
              </Badge>
            )}
          </div>
          <Button
            size="sm"
            variant="secondary"
            icon={Plus}
            onClick={() => setShowAddForm((v) => !v)}
          >
            {showAddForm ? 'Cancel' : '+ Add Deliverable'}
          </Button>
        </div>

        {/* Quick Add Deliverable Inline Form */}
        {showAddForm && (
          <form onSubmit={handleAddLine} className="mb-4 rounded-xl border border-brand-200 bg-brand-50/30 p-3.5 space-y-3">
            <p className="text-xs font-semibold text-brand-900">Add New Deliverable Item</p>
            <div className="grid gap-2 sm:grid-cols-[1fr_130px_1fr_auto] sm:items-center">
              <Input
                autoFocus
                placeholder="Deliverable text (e.g. 1 Canvas Photo Frame 20x30)"
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
              />
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-ink-400">₹</span>
                <input
                  type="number"
                  min="0"
                  step="100"
                  placeholder="Price (0)"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  className="h-9 w-full rounded-xl pl-6 pr-2 text-xs font-semibold tabular border border-ink-200 bg-white focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
              <Input
                placeholder="Details / Note (optional)"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
              />
              <Button type="submit" size="sm" variant="brand">
                Add
              </Button>
            </div>
            <p className="text-2xs text-ink-500">
              Deliverables with a price will immediately be included in the client total. You can turn any item on or off below anytime.
            </p>
          </form>
        )}

        {/* Deliverable Items List */}
        <div className="space-y-2.5">
          {state.lines.map((l) => {
            const isOff = Boolean(l.disabled);
            return (
              <div
                key={l._id}
                className={cn(
                  'rounded-xl border p-3 transition',
                  isOff
                    ? 'border-ink-200 bg-ink-50/50 opacity-70'
                    : 'border-ink-200/90 bg-white shadow-xs hover:border-brand-300',
                )}
              >
                <div className="grid gap-2 sm:grid-cols-[auto_minmax(0,1fr)_120px_minmax(0,1fr)_auto] sm:items-center">
                  {/* On/Off Toggle Button */}
                  <button
                    type="button"
                    onClick={() => dispatch({ type: 'toggleLine', lineId: l._id })}
                    className={cn(
                      'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition shrink-0',
                      isOff
                        ? 'bg-ink-100 text-ink-500 hover:bg-ink-200 ring-1 ring-ink-200'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 ring-1 ring-emerald-300',
                    )}
                    title={isOff ? 'Click to turn ON this deliverable' : 'Click to turn OFF (band) this deliverable'}
                  >
                    {isOff ? (
                      <>
                        <EyeOff className="h-3.5 w-3.5" />
                        <span>Off</span>
                      </>
                    ) : (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        <span>Active</span>
                      </>
                    )}
                  </button>

                  {/* Text Input */}
                  <div className="min-w-0">
                    <Input
                      aria-label="Deliverable line"
                      value={l.text}
                      disabled={isOff}
                      onChange={(e) => dispatch({ type: 'editLine', lineId: l._id, text: e.target.value })}
                      className={cn(isOff && 'line-through text-ink-400')}
                      trailing={
                        <span className="flex items-center gap-1.5">
                          {l.isAuto && (
                            <Badge size="sm" tone={l.isEdited ? 'warning' : 'brand'}>
                              {l.isEdited ? W.edited : W.autoLine}
                            </Badge>
                          )}
                        </span>
                      }
                    />
                  </div>

                  {/* Instant Price Input */}
                  <div className="relative shrink-0">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-ink-400">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      placeholder="0"
                      value={l.sellingPrice ?? ''}
                      disabled={isOff}
                      onChange={(e) =>
                        dispatch({ type: 'setLinePrice', lineId: l._id, price: e.target.value })
                      }
                      title="Deliverable price (updates quote total immediately)"
                      className={cn(
                        'h-9 w-full rounded-xl pl-6 pr-2 text-xs font-semibold tabular border transition focus:outline-none focus:ring-1 focus:ring-brand-500',
                        isOff
                          ? 'border-ink-200 bg-ink-100/60 text-ink-400'
                          : Number(l.sellingPrice) > 0
                          ? 'border-brand-400 bg-brand-50/40 text-brand-900 font-bold focus:border-brand-500'
                          : 'border-ink-200 bg-white text-ink-900 focus:border-brand-500',
                      )}
                    />
                  </div>

                  {/* Note Input */}
                  <div className="min-w-0">
                    <Input
                      aria-label={T.common.note}
                      placeholder={T.common.note}
                      value={l.note ?? ''}
                      disabled={isOff}
                      onChange={(e) =>
                        dispatch({ type: 'setLineNote', lineId: l._id, note: e.target.value })
                      }
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {l.isAuto && l.isEdited && (
                      <Button
                        size="xs"
                        variant="ghost"
                        icon={RotateCcw}
                        title={W.resetAuto}
                        onClick={() => dispatch({ type: 'resetReels' })}
                      />
                    )}
                    <Button
                      size="xs"
                      variant="ghost"
                      iconOnly
                      icon={Trash2}
                      className="text-ink-400 hover:text-red-600"
                      title="Remove deliverable line"
                      onClick={() => dispatch({ type: 'removeLine', lineId: l._id })}
                    />
                  </div>
                </div>

                {isOff && (
                  <p className="mt-1 text-2xs text-ink-400 italic">
                    This deliverable is turned off. It will not appear on the client quote and its price is excluded from the total.
                  </p>
                )}
                {!isOff && Number(l.sellingPrice) > 0 && (
                  <p className="mt-1 text-2xs text-emerald-600 font-medium">
                    +{formatINR(l.sellingPrice)} included in quote total.
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Deliverables summary bar */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-ink-100 pt-3 text-xs text-ink-500">
          <span>
            {activeLines.length} deliverables will be printed on the quote.{' '}
            {disabledCount > 0 && `(${disabledCount} excluded)`}
          </span>
          <span className="font-semibold text-ink-900">
            Deliverables value: {formatINR(deliverablesTotalPrice)}
          </span>
        </div>
      </div>
    </section>
  );
};

// ---------------------------------------------------------------- step 5
const StepAddOn = ({ state, dispatch, addOns }) => {
  const serviceCount = state.days.reduce((sum, day) => sum + day.entries.length, 0);

  const selectedList = useMemo(() => {
    if (state.selectedAddOns && state.selectedAddOns.length > 0) {
      return state.selectedAddOns;
    }
    if (state.addOnId) {
      return [{ addOnId: state.addOnId, includeInTotal: state.includeAddOnInTotal }];
    }
    return [];
  }, [state.selectedAddOns, state.addOnId, state.includeAddOnInTotal]);

  const activeAddOns = selectedList
    .map((sel) => {
      const found = addOns.find((a) => String(a._id) === String(sel.addOnId));
      return found ? { snapshot: { ...found, includeInTotal: sel.includeInTotal } } : null;
    })
    .filter(Boolean);

  const total = computePricing({
    days: state.days,
    deliverables: { lines: state.lines },
    addOns: activeAddOns,
  }).auto.selling;

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-ink-900">{W.addOnTitle}</h2>
          <p className="text-xs text-ink-500">Select one or multiple add-ons for this wedding quote</p>
        </div>
        {selectedList.length > 0 && (
          <Badge tone="brand" size="sm">
            {selectedList.length} selected
          </Badge>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {addOns.map((a) => {
          const isSelected = selectedList.some((s) => String(s.addOnId) === String(a._id));
          const currentEntry = selectedList.find((s) => String(s.addOnId) === String(a._id));
          return (
            <div
              key={a._id}
              className={cn(
                'relative flex flex-col justify-between rounded-2xl bg-white p-4 text-left ring-1 transition cursor-pointer',
                isSelected ? 'ring-2 ring-brand-500 bg-brand-50/20' : 'ring-ink-200 hover:ring-brand-200',
              )}
              onClick={() => dispatch({ type: 'toggleAddOn', addOnId: String(a._id) })}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-ink-900 flex items-center gap-1.5">
                    {a.badge && <Badge size="sm">{a.badge}</Badge>}
                    {a.title}
                  </p>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    readOnly
                    className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                  />
                </div>
                <p className="mt-1 text-sm text-ink-500">{a.text}</p>
                {Number(a.priceAmount) > 0 && (
                  <p className="mt-2 text-xs font-semibold text-brand-700">
                    +{formatINR(a.priceAmount)}
                  </p>
                )}
              </div>

              {isSelected && Number(a.priceAmount) > 0 && (
                <div
                  className="mt-3 pt-3 border-t border-ink-100 flex items-center justify-between text-xs"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="text-ink-600 font-medium">Include in client total:</span>
                  <button
                    type="button"
                    onClick={() => dispatch({ type: 'toggleAddOnInTotal', addOnId: String(a._id) })}
                    className={cn(
                      'px-2.5 py-1 rounded-full text-xs font-semibold transition',
                      currentEntry?.includeInTotal
                        ? 'bg-brand-500 text-white'
                        : 'bg-ink-100 text-ink-600 hover:bg-ink-200',
                    )}
                  >
                    {currentEntry?.includeInTotal ? 'Included' : 'Extra (Separate)'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 rounded-2xl bg-ink-900 p-4 text-white sm:flex sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-white/55">{W.quoteSummary}</p>
          <p className="mt-1 text-sm text-white/75">{state.days.length} dates · {serviceCount} {W.services} · {selectedList.length} add-on{selectedList.length === 1 ? '' : 's'}</p>
        </div>
        <p className="mt-3 tabular text-xl font-semibold sm:mt-0">
          <span className="mr-2 text-xs font-medium uppercase tracking-wider text-white/55">{W.total}</span>
          {formatINR(total)}
        </p>
      </div>
    </section>
  );
};

export default CreateWizard;
