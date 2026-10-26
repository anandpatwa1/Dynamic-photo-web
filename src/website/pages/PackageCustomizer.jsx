import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Calendar as CalendarIcon,
  Camera,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  Film,
  MessageCircle,
  Package,
  Printer,
  RotateCcw,
  Share2,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { publicApi } from '../api/publicApi';

const FUNCTION_PRESETS = [
  'Wedding Day',
  'Sangeet & Cocktail',
  'Haldi Ceremony',
  'Mehndi',
  'Ring Ceremony / Engagement',
  'Reception',
  'Pre-Wedding Shoot',
  'Pheras / Mandap',
];

const TIME_SLOTS = [
  { id: 'Full Day', label: 'Full Day' },
  { id: 'Morning', label: 'Morning' },
  { id: 'Evening', label: 'Evening' },
  { id: 'Night', label: 'Night' },
];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const PackageCustomizer = () => {
  // Stepper: 0 = Dates & Functions, 1 = Services, 2 = Deliverables, 3 = Summary & Quote
  const [step, setStep] = useState(0);

  // Loaded options from studio
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [options, setOptions] = useState({ services: [], deliverables: [], studio: null });

  // Customizer state
  // days: [ { date: { year, month, day }, functionName: '', slot: 'Full Day', itemIds: [] } ]
  const [days, setDays] = useState([]);
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [deliverables, setDeliverables] = useState([]);

  // Client info
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');

  // Submission / Quote result
  const [generating, setGenerating] = useState(false);
  const [quoteResult, setQuoteResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [confirmRemoveCommon, setConfirmRemoveCommon] = useState(null);

  // Calendar navigation
  const today = useMemo(() => new Date(), []);
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [calYear, setCalYear] = useState(today.getFullYear());

  // Load masters on mount
  useEffect(() => {
    let active = true;
    setLoading(true);
    publicApi.getCustomizerOptions()
      .then((res) => {
        if (!active) return;
        const data = res?.data || {};
        setOptions({
          services: data.services || [],
          deliverables: data.deliverables || [],
          studio: data.studio || null,
        });
        // Initial deliverables state (all enabled by default)
        setDeliverables((data.deliverables || []).map((d) => ({ text: d.text, note: d.note, disabled: false })));
        setLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setError(err.message || 'Could not load customizer options');
        setLoading(false);
      });
    return () => { active = false; };
  }, []);

  // Calendar calculations
  const daysInMonth = useMemo(() => new Date(calYear, calMonth + 1, 0).getDate(), [calYear, calMonth]);
  const firstDayOfWeek = useMemo(() => new Date(calYear, calMonth, 1).getDay(), [calYear, calMonth]);

  const prevMonth = () => {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear((y) => y - 1);
    } else {
      setCalMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear((y) => y + 1);
    } else {
      setCalMonth((m) => m + 1);
    }
  };

  const isDateSelected = (year, month, day) => {
    return days.some((d) => d.date.year === year && d.date.month === month + 1 && d.date.day === day);
  };

  const toggleDate = (year, month, day) => {
    const m1 = month + 1;
    const existsIndex = days.findIndex((d) => d.date.year === year && d.date.month === m1 && d.date.day === day);
    if (existsIndex >= 0) {
      // Remove
      const nextDays = days.filter((_, idx) => idx !== existsIndex);
      setDays(nextDays);
      if (activeDayIndex >= nextDays.length) {
        setActiveDayIndex(Math.max(0, nextDays.length - 1));
      }
    } else {
      // Add
      const defaultName = days.length === 0 ? 'Wedding Day' : days.length === 1 ? 'Sangeet & Cocktail' : 'Haldi Ceremony';
      const defaultItemIds = options.services.slice(0, 2).map((s) => s._id);
      const newDay = {
        date: { year, month: m1, day },
        functionName: defaultName,
        slot: 'Full Day',
        itemIds: defaultItemIds,
      };
      setDays((prev) => [...prev, newDay]);
      setActiveDayIndex(days.length);
    }
  };

  const removeDay = (index) => {
    const nextDays = days.filter((_, i) => i !== index);
    setDays(nextDays);
    if (activeDayIndex >= nextDays.length) {
      setActiveDayIndex(Math.max(0, nextDays.length - 1));
    }
  };

  const updateDay = (index, field, value) => {
    setDays((prev) => prev.map((d, i) => (i === index ? { ...d, [field]: value } : d)));
  };

  const toggleDayService = (dayIndex, serviceId) => {
    const currentDay = days[dayIndex];
    const isSelected = currentDay?.itemIds.includes(serviceId);

    if (!isSelected) {
      setDays((prev) =>
        prev.map((d, i) => (i === dayIndex ? { ...d, itemIds: [...d.itemIds, serviceId] } : d)),
      );
      return;
    }

    const daysWithThisService = days.filter((d) => d.itemIds.includes(serviceId));
    if (daysWithThisService.length > 1) {
      const sName = options.services.find((s) => s._id === serviceId)?.name || 'Service';
      setConfirmRemoveCommon({
        serviceId,
        dayIndex,
        matchingCount: daysWithThisService.length,
        serviceName: sName,
      });
      return;
    }

    setDays((prev) =>
      prev.map((d, i) =>
        i === dayIndex ? { ...d, itemIds: d.itemIds.filter((id) => id !== serviceId) } : d,
      ),
    );
  };

  const removeServiceAllDays = (serviceId) => {
    setDays((prev) =>
      prev.map((d) => ({
        ...d,
        itemIds: d.itemIds.filter((id) => id !== serviceId),
      })),
    );
    setConfirmRemoveCommon(null);
  };

  const removeServiceCurrentDay = (dayIndex, serviceId) => {
    setDays((prev) =>
      prev.map((d, i) =>
        i === dayIndex ? { ...d, itemIds: d.itemIds.filter((id) => id !== serviceId) } : d,
      ),
    );
    setConfirmRemoveCommon(null);
  };

  const applyServicesToAll = (sourceDayIndex) => {
    const sourceItems = days[sourceDayIndex]?.itemIds || [];
    setDays((prev) => prev.map((d) => ({ ...d, itemIds: [...sourceItems] })));
  };

  const toggleDeliverable = (index) => {
    setDeliverables((prev) =>
      prev.map((d, i) => (i === index ? { ...d, disabled: !d.disabled } : d)),
    );
  };

  // Generate / Submit Quote
  const handleGenerateQuote = async () => {
    if (days.length === 0) return;
    setGenerating(true);
    try {
      const payload = {
        clientName: clientName.trim(),
        clientPhone: clientPhone.trim(),
        days: days.map((d) => ({
          date: d.date,
          functionName: d.functionName || 'Wedding Function',
          slot: d.slot || 'Full Day',
          itemIds: d.itemIds,
        })),
        deliverables: deliverables.map((d) => ({
          text: d.text,
          disabled: Boolean(d.disabled),
        })),
      };
      const res = await publicApi.submitCustomQuote(payload);
      setQuoteResult(res?.data || null);
      setStep(3);
    } catch (err) {
      alert(err.message || 'Could not generate quote. Please verify selections.');
    } finally {
      setGenerating(false);
    }
  };

  const shareUrl = useMemo(() => {
    if (!quoteResult?.shareToken) return '';
    return `${window.location.origin}/quote/${quoteResult.shareToken}`;
  }, [quoteResult]);

  const copyShareLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
    }
  };

  const handleWhatsAppShare = () => {
    if (!quoteResult) return;
    const clientGreeting = clientName ? `for ${clientName}` : '';
    const text = `Namaste! Here is our customized wedding photography proposal ${clientGreeting} from ${options.studio?.name || 'Dynamic Photography'}:\n${shareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-site-paper">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-site-accent border-t-transparent" />
          <p className="font-serif text-lg text-site-ink">Loading Package Customizer…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid min-h-screen place-items-center bg-site-paper px-6 text-center">
        <div className="max-w-md">
          <p className="font-serif text-2xl text-site-ink">Service Unavailable</p>
          <p className="mt-2 text-sm text-site-body">{error}</p>
          <a
            href="/"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-site-ink px-6 py-2.5 text-xs font-medium uppercase tracking-wider text-white"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-site-paper text-site-ink">
      {/* Header bar */}
      <header className="sticky top-0 z-30 border-b border-site-line bg-site-paper/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <a
            href="/"
            className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-site-body transition-colors hover:text-site-ink"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Website
          </a>

          <div className="flex flex-col items-center text-center">
            <span className="font-serif text-lg font-normal tracking-wide text-site-ink">
              {options.studio?.name || 'Dynamic Photography'}
            </span>
            <span className="text-[10px] uppercase tracking-widest text-site-accent">
              Wedding Package Customizer
            </span>
          </div>

          <div className="w-24 text-right">
            <span className="rounded-full bg-site-paper-alt px-3 py-1 text-[11px] font-medium text-site-accent">
              Step {step + 1} of 4
            </span>
          </div>
        </div>

        {/* Stepper Progress Bar */}
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-4 gap-2 pb-3">
            {[
              { idx: 0, label: '1. Dates & Events' },
              { idx: 1, label: '2. Select Services' },
              { idx: 2, label: '3. Deliverables' },
              { idx: 3, label: '4. Summary & Quote' },
            ].map((s) => (
              <button
                key={s.idx}
                type="button"
                onClick={() => {
                  if (s.idx < step || (s.idx === 1 && days.length > 0) || (s.idx === 2 && days.length > 0)) {
                    setStep(s.idx);
                  }
                }}
                disabled={s.idx > step && (days.length === 0 || s.idx === 3)}
                className={cn(
                  'flex flex-col border-t-2 pt-2 text-left transition-colors',
                  step === s.idx
                    ? 'border-site-accent text-site-accent'
                    : step > s.idx
                      ? 'border-site-ink text-site-ink'
                      : 'border-site-line text-site-muted opacity-60',
                )}
              >
                <span className="text-[11px] font-medium uppercase tracking-wider">
                  {s.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
        {/* ================= STEP 0: DATES & FUNCTIONS ================= */}
        {step === 0 && (
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="font-serif text-3xl font-light sm:text-4xl">
                Choose Your Wedding Dates & Functions
              </h1>
              <p className="mt-2 text-sm text-site-body">
                Select your wedding dates on the calendar below. You can assign functions like Sangeet, Haldi, or Wedding Day to each date.
              </p>
            </div>

            <div className="grid gap-8 lg:grid-cols-12">
              {/* Calendar Picker (No booking data - completely clean) */}
              <div className="rounded-2xl border border-site-line bg-site-paper-alt p-6 shadow-sm lg:col-span-6">
                <div className="flex items-center justify-between pb-4 border-b border-site-line">
                  <h2 className="font-serif text-lg font-medium text-site-ink">
                    {MONTH_NAMES[calMonth]} {calYear}
                  </h2>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={prevMonth}
                      className="rounded-full p-2 text-site-body hover:bg-site-paper hover:text-site-ink"
                      aria-label="Previous Month"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={nextMonth}
                      className="rounded-full p-2 text-site-body hover:bg-site-paper hover:text-site-ink"
                      aria-label="Next Month"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Days of week */}
                <div className="mt-4 grid grid-cols-7 text-center text-xs font-medium uppercase tracking-wider text-site-muted">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                    <div key={d} className="py-2">{d}</div>
                  ))}
                </div>

                {/* Day cells */}
                <div className="grid grid-cols-7 gap-1.5 text-center text-sm">
                  {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                    <div key={`empty-${i}`} className="h-10" />
                  ))}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const dayNum = i + 1;
                    const selected = isDateSelected(calYear, calMonth, dayNum);
                    return (
                      <button
                        key={`day-${dayNum}`}
                        type="button"
                        onClick={() => toggleDate(calYear, calMonth, dayNum)}
                        className={cn(
                          'relative flex h-10 items-center justify-center rounded-xl font-medium transition-all duration-200',
                          selected
                            ? 'bg-site-accent text-white shadow-md shadow-site-accent/30'
                            : 'text-site-ink hover:bg-site-sand/50',
                        )}
                      >
                        {dayNum}
                        {selected && (
                          <span className="absolute bottom-1 h-1 w-1 rounded-full bg-white" />
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-site-line pt-3 text-xs text-site-muted">
                  <span>Click on dates to select or unselect</span>
                  <span className="font-medium text-site-accent">
                    {days.length} date{days.length === 1 ? '' : 's'} selected
                  </span>
                </div>
              </div>

              {/* Selected Dates & Functions List */}
              <div className="space-y-4 lg:col-span-6">
                <div className="flex items-center justify-between">
                  <h2 className="font-serif text-lg font-medium text-site-ink">
                    Selected Functions ({days.length})
                  </h2>
                  {days.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setDays([])}
                      className="text-xs text-site-muted hover:text-red-600 transition-colors"
                    >
                      Clear all
                    </button>
                  )}
                </div>

                {days.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-site-line p-10 text-center text-site-muted">
                    <CalendarIcon className="h-10 w-10 stroke-[1.2] text-site-accent" />
                    <p className="mt-3 font-serif text-base text-site-ink">No dates selected yet</p>
                    <p className="mt-1 text-xs">
                      Click any date on the calendar to begin building your package.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {days.map((dayObj, idx) => (
                      <div
                        key={`${dayObj.date.year}-${dayObj.date.month}-${dayObj.date.day}`}
                        className="rounded-xl border border-site-line bg-site-paper p-4 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 flex-col items-center justify-center rounded-xl bg-site-sand text-site-ink">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-site-accent">
                                {MONTH_NAMES[dayObj.date.month - 1].slice(0, 3)}
                              </span>
                              <span className="font-serif text-lg font-semibold leading-none">
                                {dayObj.date.day}
                              </span>
                            </div>
                            <div>
                              <div className="text-xs font-medium text-site-muted">
                                Day {idx + 1} • {dayObj.date.year}
                              </div>
                              <input
                                type="text"
                                value={dayObj.functionName}
                                onChange={(e) => updateDay(idx, 'functionName', e.target.value)}
                                placeholder="Function Name (e.g. Wedding Day)"
                                className="mt-0.5 font-serif text-base font-medium text-site-ink placeholder:text-site-muted/50 focus:outline-none"
                              />
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeDay(idx)}
                            className="rounded-lg p-1.5 text-site-muted hover:bg-red-50 hover:text-red-600 transition-colors"
                            aria-label="Remove Date"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        {/* Quick Function Chips */}
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {FUNCTION_PRESETS.map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => updateDay(idx, 'functionName', preset)}
                              className={cn(
                                'rounded-full px-2.5 py-1 text-[11px] transition-colors',
                                dayObj.functionName === preset
                                  ? 'bg-site-accent text-white font-medium'
                                  : 'bg-site-paper-alt text-site-body hover:bg-site-sand/50',
                              )}
                            >
                              {preset}
                            </button>
                          ))}
                        </div>

                        {/* Timing Slot */}
                        <div className="mt-3 flex items-center gap-2 border-t border-site-line pt-3">
                          <Clock className="h-3.5 w-3.5 text-site-muted" />
                          <span className="text-xs text-site-muted">Slot:</span>
                          <div className="flex gap-1.5">
                            {TIME_SLOTS.map((slot) => (
                              <button
                                key={slot.id}
                                type="button"
                                onClick={() => updateDay(idx, 'slot', slot.id)}
                                className={cn(
                                  'rounded-md px-2 py-0.5 text-xs transition-colors',
                                  dayObj.slot === slot.id
                                    ? 'bg-site-ink text-white font-medium'
                                    : 'text-site-body hover:bg-site-paper-alt',
                                )}
                              >
                                {slot.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Continue button */}
                <div className="pt-4">
                  <button
                    type="button"
                    disabled={days.length === 0}
                    onClick={() => setStep(1)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-site-ink py-3.5 text-xs font-semibold uppercase tracking-wider text-white shadow-lg transition hover:bg-site-ink-soft disabled:opacity-40"
                  >
                    Next: Choose Services ({days.length} functions) <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 1: SELECT SERVICES ================= */}
        {step === 1 && (
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="font-serif text-3xl font-light sm:text-4xl">
                Select Services for Each Function
              </h1>
              <p className="mt-2 text-sm text-site-body">
                Choose the coverage you want (Candid Photography, Cinematic Films, Drone, etc.).
              </p>
            </div>

            {/* Function Tabs */}
            <div className="flex flex-wrap items-center justify-center gap-2 border-b border-site-line pb-4">
              {days.map((d, idx) => (
                <button
                  key={`day-tab-${idx}`}
                  type="button"
                  onClick={() => setActiveDayIndex(idx)}
                  className={cn(
                    'flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-medium transition-all',
                    activeDayIndex === idx
                      ? 'bg-site-accent text-white shadow-md'
                      : 'bg-site-paper-alt text-site-body hover:bg-site-sand',
                  )}
                >
                  <span>{d.functionName || `Function ${idx + 1}`}</span>
                  <span className={cn(
                    'rounded-full px-1.5 py-0.5 text-[10px]',
                    activeDayIndex === idx ? 'bg-white/20 text-white' : 'bg-site-line text-site-muted',
                  )}>
                    {d.itemIds.length}
                  </span>
                </button>
              ))}
            </div>

            {/* Active Function Header */}
            {days[activeDayIndex] && (
              <div className="rounded-xl border border-site-line bg-site-paper-alt p-4">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div>
                    <h2 className="font-serif text-xl font-medium text-site-ink">
                      {days[activeDayIndex].functionName || `Function ${activeDayIndex + 1}`}
                    </h2>
                    <p className="text-xs text-site-muted">
                      {days[activeDayIndex].date.day} {MONTH_NAMES[days[activeDayIndex].date.month - 1]} {days[activeDayIndex].date.year} • {days[activeDayIndex].slot}
                    </p>
                  </div>

                  {days.length > 1 && (
                    <button
                      type="button"
                      onClick={() => applyServicesToAll(activeDayIndex)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-site-accent/40 bg-white px-3 py-1.5 text-xs font-medium text-site-accent hover:bg-site-accent hover:text-white transition-colors"
                    >
                      <Sparkles className="h-3.5 w-3.5" /> Apply these services to all functions
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Services Grid (NO PRICES SHOWN - strictly follows user request) */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {options.services.map((service) => {
                const currentDay = days[activeDayIndex];
                const isSelected = currentDay?.itemIds.includes(service._id);
                const matchingCount = days.filter((d) => d.itemIds.includes(service._id)).length;
                const isCommon = matchingCount > 1;

                return (
                  <div
                    key={service._id}
                    role="checkbox"
                    aria-checked={Boolean(isSelected)}
                    tabIndex={0}
                    onKeyDown={(event) => { if (event.target === event.currentTarget && [' ', 'Enter'].includes(event.key)) { event.preventDefault(); toggleDayService(activeDayIndex, service._id); } }}
                    onClick={() => toggleDayService(activeDayIndex, service._id)}
                    className={cn(
                      'group relative flex cursor-pointer flex-col justify-between rounded-2xl border p-5 transition-all duration-200 select-none',
                      isSelected
                        ? 'border-site-accent bg-site-paper shadow-md ring-1 ring-site-accent'
                        : 'border-site-line bg-site-paper-alt hover:border-site-line/80 hover:bg-site-paper',
                    )}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className={cn(
                            'grid h-9 w-9 place-items-center rounded-xl transition-colors',
                            isSelected ? 'bg-site-accent text-white' : 'bg-site-sand text-site-accent',
                          )}>
                            {service.name.toLowerCase().includes('film') || service.name.toLowerCase().includes('video') ? (
                              <Film className="h-4 w-4" />
                            ) : (
                              <Camera className="h-4 w-4" />
                            )}
                          </div>
                          <div>
                            <h3 className="font-serif text-base font-medium text-site-ink">
                              {service.name}
                            </h3>
                            {isCommon && (
                              <span className="inline-block mt-0.5 rounded-full bg-site-sand px-2 py-0.5 text-[10px] font-medium text-site-accent">
                                Common on {matchingCount} functions
                              </span>
                            )}
                          </div>
                        </div>

                        <div className={cn(
                          'grid h-6 w-6 place-items-center rounded-full border transition-colors',
                          isSelected ? 'border-site-accent bg-site-accent text-white' : 'border-site-line bg-white',
                        )}>
                          {isSelected && <Check className="h-3.5 w-3.5 stroke-[2.5]" />}
                        </div>
                      </div>

                      {service.note && (
                        <p className="mt-3 text-xs leading-relaxed text-site-body">
                          {service.note}
                        </p>
                      )}

                      {service.deliverables?.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-1.5">
                          {service.deliverables.map((item, i) => (
                            <span
                              key={i}
                              className="rounded-md bg-site-paper-alt px-2 py-0.5 text-[10px] text-site-muted"
                            >
                              • {item}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="mt-5 flex items-center justify-between border-t border-site-line/60 pt-3">
                      <span className="text-[11px] font-medium uppercase tracking-wider text-site-accent">
                        {isSelected ? '✓ Included for this function' : '+ Click to add'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Confirm Remove Common Service Modal */}
            {confirmRemoveCommon && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
                <div className="w-full max-w-md rounded-2xl border border-site-line bg-white p-6 shadow-2xl">
                  <h3 className="font-serif text-xl font-medium text-site-ink">
                    Remove "{confirmRemoveCommon.serviceName}"
                  </h3>
                  <p className="mt-2 text-xs text-site-body">
                    This service is common across <strong>{confirmRemoveCommon.matchingCount} functions</strong>. Where would you like to delete/remove it from?
                  </p>
                  <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={() => setConfirmRemoveCommon(null)}
                      className="rounded-xl border border-site-line px-4 py-2 text-xs font-medium text-site-ink hover:bg-site-paper-alt transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => removeServiceCurrentDay(confirmRemoveCommon.dayIndex, confirmRemoveCommon.serviceId)}
                      className="rounded-xl border border-site-line bg-site-paper-alt px-4 py-2 text-xs font-medium text-site-ink hover:bg-site-line/50 transition-colors"
                    >
                      This Function Only
                    </button>
                    <button
                      type="button"
                      autoFocus
                      onClick={() => removeServiceAllDays(confirmRemoveCommon.serviceId)}
                      className="rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-red-700 transition-colors"
                    >
                      Delete from All {confirmRemoveCommon.matchingCount} Functions
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Actions: Backward & Forward */}
            <div className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => setStep(0)}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-site-line bg-site-paper px-6 py-3 text-xs font-semibold uppercase tracking-wider text-site-ink transition hover:bg-site-paper-alt"
              >
                <ArrowLeft className="h-4 w-4" /> Back to Dates
              </button>

              <button
                type="button"
                onClick={() => setStep(2)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-site-ink px-8 py-3 text-xs font-semibold uppercase tracking-wider text-white shadow-lg transition hover:bg-site-ink-soft"
              >
                Next: Deliverables <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 2: DELIVERABLES ================= */}
        {step === 2 && (
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="font-serif text-3xl font-light sm:text-4xl">
                Included Deliverables & Keepsakes
              </h1>
              <p className="mt-2 text-sm text-site-body">
                These are the physical albums, teaser films, full-length reels, and master footage delivered to you.
              </p>
            </div>

            <div className="mx-auto max-w-3xl space-y-3">
              {deliverables.map((deliv, idx) => (
                <div
                  key={idx}
                  role="checkbox"
                  aria-checked={!deliv.disabled}
                  tabIndex={0}
                  onKeyDown={(event) => { if ([' ', 'Enter'].includes(event.key)) { event.preventDefault(); toggleDeliverable(idx); } }}
                  onClick={() => toggleDeliverable(idx)}
                  className={cn(
                    'flex cursor-pointer items-center justify-between rounded-xl border p-4 transition-all',
                    deliv.disabled
                      ? 'border-site-line bg-site-paper-alt opacity-50'
                      : 'border-site-accent/40 bg-site-paper shadow-sm',
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'grid h-8 w-8 place-items-center rounded-lg',
                      deliv.disabled ? 'bg-site-line text-site-muted' : 'bg-site-sand text-site-accent',
                    )}>
                      <Package className="h-4 w-4" />
                    </div>
                    <div>
                      <p className={cn(
                        'text-sm font-medium',
                        deliv.disabled ? 'text-site-muted line-through' : 'text-site-ink',
                      )}>
                        {deliv.text}
                      </p>
                      {deliv.note && (
                        <p className="text-xs text-site-body">{deliv.note}</p>
                      )}
                    </div>
                  </div>

                  <div className={cn(
                    'grid h-6 w-6 place-items-center rounded-full border transition-colors',
                    deliv.disabled ? 'border-site-line bg-white' : 'border-site-accent bg-site-accent text-white',
                  )}>
                    {!deliv.disabled && <Check className="h-3.5 w-3.5 stroke-[2.5]" />}
                  </div>
                </div>
              ))}
            </div>

            {/* Client Details Section */}
            <div className="mx-auto max-w-xl rounded-2xl border border-site-line bg-site-paper-alt p-6">
              <h2 className="font-serif text-lg font-medium text-site-ink">
                Personalize Your Proposal
              </h2>
              <p className="mt-1 text-xs text-site-body">
                Enter your names to display on your custom quote and to receive the share link.
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-[11px] font-medium uppercase tracking-wider text-site-muted">
                    Bride & Groom / Client Name
                  </label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="e.g. Rohit & Chahetee"
                    className="mt-1 w-full rounded-xl border border-site-line bg-white px-3.5 py-2 text-sm text-site-ink placeholder:text-site-muted/50 focus:border-site-accent focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium uppercase tracking-wider text-site-muted">
                    Phone / WhatsApp Number
                  </label>
                  <input
                    type="tel"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="mt-1 w-full rounded-xl border border-site-line bg-white px-3.5 py-2 text-sm text-site-ink placeholder:text-site-muted/50 focus:border-site-accent focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Bottom Actions: Backward & Generate Quote */}
            <div className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-site-line bg-site-paper px-6 py-3 text-xs font-semibold uppercase tracking-wider text-site-ink transition hover:bg-site-paper-alt"
              >
                <ArrowLeft className="h-4 w-4" /> Back to Services
              </button>

              <button
                type="button"
                disabled={generating}
                onClick={handleGenerateQuote}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-site-accent to-site-ink px-8 py-3 text-xs font-semibold uppercase tracking-wider text-white shadow-xl transition hover:opacity-90 disabled:opacity-50"
              >
                {generating ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Calculating & Generating Quote…
                  </>
                ) : (
                  <>
                    View My Custom Package <Sparkles className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 3: SUMMARY & FINAL QUOTE ================= */}
        {step === 3 && quoteResult && (
          <div className="space-y-8">
            <div className="text-center no-print">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3.5 py-1 text-xs font-medium text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" /> Custom Package Ready
              </span>
              <h1 className="mt-2 font-serif text-3xl font-light sm:text-4xl">
                Your Customized Wedding Package
              </h1>
              <p className="mt-1 text-sm text-site-body">
                Crafted for {clientName || 'You'} • Single Theme Proposal
              </p>
            </div>

            {/* Action Bar (Download, Share, Print, Go Back) */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-site-line bg-site-paper-alt p-4 shadow-sm no-print">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="inline-flex items-center gap-2 rounded-xl border border-site-line bg-white px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-site-ink hover:bg-site-sand/50 transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Modify Package
              </button>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-site-line bg-white px-4 py-2 text-xs font-medium text-site-ink hover:bg-site-paper transition-colors"
                >
                  <Printer className="h-4 w-4 text-site-accent" /> Print / Save PDF
                </button>

                <button
                  type="button"
                  onClick={handleWhatsAppShare}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-700 transition-colors shadow-sm"
                >
                  <MessageCircle className="h-4 w-4" /> WhatsApp Share
                </button>

                <button
                  type="button"
                  onClick={copyShareLink}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-site-ink px-4 py-2 text-xs font-medium text-white hover:bg-site-ink-soft transition-colors shadow-sm"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'Link Copied!' : 'Copy Link'}
                </button>
              </div>
            </div>

            {/* Single Elegant Theme Quotation Card */}
            <div className="proposal-card mx-auto max-w-4xl overflow-hidden rounded-3xl border border-site-line bg-white shadow-2xl">
              {/* Proposal Header Banner */}
              <div className="border-b border-site-line bg-[#FAF7F2] p-8 text-center sm:p-12">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-site-accent">
                  Wedding Photography Proposal
                </p>
                <h2 className="mt-2 font-serif text-3xl font-light text-site-ink sm:text-4xl">
                  {quoteResult.studio?.name || 'Dynamic Photography'}
                </h2>
                {clientName && (
                  <p className="mt-3 font-serif text-xl italic text-site-body">
                    Specially created for {clientName}
                  </p>
                )}
                <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-xs text-site-muted">
                  <span>{days.length} Celebrations</span>
                  <span>•</span>
                  <span>{quoteResult.studio?.city || 'India'}</span>
                  {quoteResult.studio?.phone && (
                    <>
                      <span>•</span>
                      <span>{quoteResult.studio.phone}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Proposal Body */}
              <div className="space-y-8 p-6 sm:p-10">
                {/* Functions & Services Breakdown */}
                <div>
                  <h3 className="font-serif text-xl font-medium text-site-ink border-b border-site-line pb-3">
                    Scheduled Functions & Coverage
                  </h3>
                  <div className="mt-4 space-y-4">
                    {days.map((d, idx) => {
                      const selectedServices = options.services.filter((s) => d.itemIds.includes(s._id));
                      return (
                        <div
                          key={idx}
                          className="rounded-2xl border border-site-line/80 bg-site-paper/60 p-5"
                        >
                          <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-center">
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-widest text-site-accent">
                                Event {idx + 1}
                              </span>
                              <h4 className="font-serif text-lg font-medium text-site-ink">
                                {d.functionName || 'Wedding Function'}
                              </h4>
                            </div>
                            <div className="text-xs text-site-body">
                              {d.date.day} {MONTH_NAMES[d.date.month - 1]} {d.date.year} • {d.slot}
                            </div>
                          </div>

                          <div className="mt-3 flex flex-wrap gap-2">
                            {selectedServices.map((s) => (
                              <span
                                key={s._id}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-site-line bg-white px-3 py-1.5 text-xs font-medium text-site-ink shadow-xs"
                              >
                                <Check className="h-3.5 w-3.5 text-site-accent" /> {s.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Deliverables Section */}
                <div>
                  <h3 className="font-serif text-xl font-medium text-site-ink border-b border-site-line pb-3">
                    Deliverables & Deliverable Sets
                  </h3>
                  <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                    {deliverables
                      .filter((d) => !d.disabled)
                      .map((d, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-2.5 rounded-xl border border-site-line/60 bg-site-paper-alt p-3.5 text-xs text-site-ink"
                        >
                          <Package className="mt-0.5 h-4 w-4 shrink-0 text-site-accent" />
                          <span>{d.text}</span>
                        </div>
                      ))}
                  </div>
                </div>

                {/* FINAL PRICING BLOCK (Only final Selling & MRP shown - strictly follows requirements!) */}
                <div className="rounded-3xl border-2 border-site-accent/30 bg-gradient-to-br from-[#FAF7F2] to-[#F5ECE1] p-6 text-center sm:p-8">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-site-accent">
                    Complete Package Investment
                  </span>

                  <div className="mt-4 flex flex-col items-center justify-center gap-1">
                    {/* MRP / Original Price */}
                    {quoteResult.price?.hasDiscount && quoteResult.price?.mrp && (
                      <div className="flex items-center gap-2 text-sm text-site-muted">
                        <span>Original Value:</span>
                        <span className="line-through">{quoteResult.price.mrp}</span>
                        {quoteResult.price.discountText && (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                            {quoteResult.price.discountText}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Final Selling Rate */}
                    <div className="font-serif text-4xl font-semibold text-site-ink sm:text-5xl">
                      {quoteResult.price?.selling}
                    </div>

                    <p className="mt-2 text-xs text-site-body">
                      All-inclusive customized package rate for your wedding celebrations.
                    </p>
                  </div>
                </div>

                {/* Studio Footer */}
                <div className="border-t border-site-line pt-6 text-center text-xs text-site-muted">
                  <p className="font-medium text-site-ink">
                    {quoteResult.studio?.name || 'Dynamic Photography'}
                  </p>
                  <p className="mt-1">
                    For bookings and inquiries, please reach out directly at {quoteResult.studio?.phone || 'our studio'}.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Print Stylesheet */}
      <style>{`
        @media print {
          body {
            background-color: #ffffff !important;
            color: #111827 !important;
          }
          header, button, .no-print {
            display: none !important;
          }
          main {
            max-width: 100% !important;
            padding: 0 !important;
          }
          .proposal-card {
            border: none !important;
            box-shadow: none !important;
            max-width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
};

