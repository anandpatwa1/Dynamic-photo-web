import { useEffect, useMemo, useState } from 'react';
import { Check, Palette, Pencil, Plus, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  Button, Card, CardBody, CardHeader, CardTitle, ConfirmDialog, Input, PageHeader, Select, Skeleton,
} from '@/components/ui';
import { cn } from '@/utils/cn';
import { CRM } from '@/routes/paths';
import { Calendar } from '../../components/Calendar';
import { PermissionGate } from '../../components/PermissionGate';
import { useBookingCalendar } from '../../hooks/useBookingCalendar';
import { useWqPermissions } from '../../hooks/useWqPermissions';
import { wqBookingApi, wqSettingsApi } from '../../api/wqApi';
import { formatDate } from '../../utils/engine/dates';
import { T } from '../../constants/strings';

const B = T.bookings;
const QUICK_COLORS = ['#DC2626', '#2563EB', '#7C3AED', '#EA580C', '#059669', '#DB2777', '#0891B2', '#CA8A04', '#4F46E5', '#475569'];
const keyOf = ({ year, month, day }) => `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
const emptyForm = (typeKey = 'wedding') => ({ title: '', typeKey, color: '', note: '' });

export const BookingCalendarPage = () => (
  <PermissionGate anyOf={['viewQuotes', 'createQuote', 'editQuote', 'manageMasters']}>
    <BookingCalendarInner />
  </PermissionGate>
);

const BookingCalendarInner = () => {
  const now = new Date();
  const perms = useWqPermissions();
  const canWrite = perms.createQuote || perms.editQuote || perms.manageMasters;
  const [view, setView] = useState({ month: now.getMonth() + 1, year: now.getFullYear() });
  const initialDate = { day: now.getDate(), month: now.getMonth() + 1, year: now.getFullYear() };
  const [activeDate, setActiveDate] = useState(initialDate);
  const [selectedDates, setSelectedDates] = useState([initialDate]);
  const [refreshKey, setRefreshKey] = useState(0);
  const calendar = useBookingCalendar(view, refreshKey);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [deleteItem, setDeleteItem] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [typeDraft, setTypeDraft] = useState([]);
  const [savingTypes, setSavingTypes] = useState(false);

  useEffect(() => setTypeDraft(calendar.bookingTypes.map((type) => ({ ...type }))), [calendar.bookingTypes]);
  useEffect(() => {
    if (!calendar.bookingTypes.length) return;
    if (!calendar.bookingTypes.some((type) => type.key === form.typeKey)) {
      setForm((current) => ({ ...current, typeKey: calendar.bookingTypes[0].key, color: '' }));
    }
  }, [calendar.bookingTypes, form.typeKey]);

  const activeKey = keyOf(activeDate);
  const dayBookings = useMemo(
    () => calendar.bookings.filter((booking) => booking.dateKey === activeKey),
    [calendar.bookings, activeKey],
  );
  const dayFestivals = useMemo(
    () => calendar.festivals.filter((festival) => festival.dateKey === activeKey),
    [calendar.festivals, activeKey],
  );

  const chooseDate = (date) => {
    const dateKey = keyOf(date);
    setActiveDate(date);
    setSelectedDates((current) => {
      const exists = current.some((item) => keyOf(item) === dateKey);
      if (exists) return current.filter((item) => keyOf(item) !== dateKey);
      return [...current, date].sort((a, b) => keyOf(a).localeCompare(keyOf(b)));
    });
    setEditingId(null);
    setForm(emptyForm(calendar.bookingTypes[0]?.key));
  };

  const changeView = (next) => {
    setView(next);
    setActiveDate({ day: 1, month: next.month, year: next.year });
    setEditingId(null);
    setForm(emptyForm(calendar.bookingTypes[0]?.key));
  };

  const focusDate = (date) => {
    setActiveDate(date);
    setView({ month: date.month, year: date.year });
    setEditingId(null);
    setForm(emptyForm(calendar.bookingTypes[0]?.key));
  };

  const removeSelectedDate = (date) => {
    const dateKey = keyOf(date);
    setSelectedDates((current) => current.filter((item) => keyOf(item) !== dateKey));
  };

  const reload = () => setRefreshKey((value) => value + 1);

  const submit = async () => {
    if (!form.typeKey || (!editingId && !selectedDates.length)) return;
    setSaving(true);
    try {
      const details = { ...form, color: form.color || null };
      if (editingId) await wqBookingApi.update(editingId, { dateKey: activeKey, ...details });
      else await wqBookingApi.createMany({ dateKeys: selectedDates.map(keyOf), ...details });
      toast.success(editingId ? 'Booking updated' : `Booking added to ${selectedDates.length} date${selectedDates.length > 1 ? 's' : ''}`);
      setEditingId(null);
      setForm(emptyForm(form.typeKey));
      reload();
    } catch (error) {
      toast.error(error?.response?.data?.message ?? 'Booking could not be saved');
    } finally {
      setSaving(false);
    }
  };

  const edit = (booking) => {
    setEditingId(booking._id);
    setSelectedDates([activeDate]);
    setForm({ title: booking.title ?? '', typeKey: booking.typeKey, color: booking.color ?? '', note: booking.note ?? '' });
  };

  const remove = async () => {
    setDeleting(true);
    try {
      await wqBookingApi.remove(deleteItem._id);
      toast.success('Booking deleted');
      if (editingId === deleteItem._id) {
        setEditingId(null);
        setForm(emptyForm(form.typeKey));
      }
      setDeleteItem(null);
      reload();
    } catch (error) {
      toast.error(error?.response?.data?.message ?? 'Booking could not be deleted');
    } finally {
      setDeleting(false);
    }
  };

  const saveTypes = async () => {
    setSavingTypes(true);
    try {
      await wqSettingsApi.update({ bookingTypes: typeDraft });
      toast.success(T.common.saved);
      reload();
    } catch (error) {
      toast.error(error?.response?.data?.message ?? 'Colours could not be saved');
    } finally {
      setSavingTypes(false);
    }
  };

  return (
    <>
      <PageHeader title={B.title} description={B.description}
        breadcrumbs={[{ label: T.module, to: CRM.wqQuotes }, { label: B.title }]} />

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.65fr)]">
        <div className="contents xl:block xl:space-y-5">
          <Card>
            <CardBody className="relative">
              <Calendar view={view} onViewChange={changeView} selected={selectedDates} max={62}
                onToggle={chooseDate} bookings={calendar.bookings} festivals={calendar.festivals} showSelectionOrder={false} />
              {calendar.loading && <div className="pointer-events-none absolute inset-4 rounded-2xl bg-white/55 backdrop-blur-[1px]" />}
              {calendar.error && <p className="mt-3 text-sm text-danger-600">{calendar.error}</p>}
              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t border-ink-100 pt-4 text-xs text-ink-500">
                {calendar.bookingTypes.map((type) => (
                  <span key={type.key} className="inline-flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: type.color }} />{type.name}
                  </span>
                ))}
                {calendar.showFestivals && <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-500" />{B.festivals}</span>}
              </div>
            </CardBody>
          </Card>

          {perms.manageMasters && (
            <Card className="order-3">
              <CardHeader>
                <div><CardTitle>{B.coloursTitle}</CardTitle><p className="mt-1 text-sm text-ink-500">{B.coloursHint}</p></div>
                <Palette className="h-5 w-5 text-brand-500" />
              </CardHeader>
              <CardBody>
                {!typeDraft.length ? <Skeleton className="h-28" /> : (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {typeDraft.map((type, index) => (
                      <div key={type.key} className="flex items-center gap-2 rounded-xl bg-ink-50 p-2.5">
                        <input type="color" value={type.color} aria-label={`${type.name} colour`}
                          onChange={(event) => setTypeDraft(typeDraft.map((item, itemIndex) => itemIndex === index ? { ...item, color: event.target.value.toUpperCase() } : item))}
                          className="h-9 w-10 cursor-pointer rounded-lg border-0 bg-transparent p-0" />
                        <Input value={type.name} aria-label={`${type.key} name`} wrapperClassName="min-w-0 flex-1"
                          onChange={(event) => setTypeDraft(typeDraft.map((item, itemIndex) => itemIndex === index ? { ...item, name: event.target.value } : item))} />
                      </div>
                    ))}
                  </div>
                )}
                <Button className="mt-4" size="sm" loading={savingTypes} onClick={saveTypes}>{B.saveColours}</Button>
              </CardBody>
            </Card>
          )}
        </div>

        <Card className="order-2 xl:order-none xl:sticky xl:top-20">
          <CardHeader>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">{B.selectedDate}</p>
              <CardTitle className="mt-1">{formatDate(activeDate, 'plain', activeDate.year)}</CardTitle>
            </div>
            <span className="rounded-full bg-ink-100 px-2.5 py-1 text-xs font-semibold text-ink-600">
              {dayBookings.length === 1 ? B.oneBooking : B.count.replace('{n}', dayBookings.length)}
            </span>
          </CardHeader>
          <CardBody className="space-y-5">
            {!editingId && (
              <div className="rounded-xl bg-brand-50/70 p-3 ring-1 ring-inset ring-brand-100">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-ink-900">{B.selectedDates} ({selectedDates.length})</p>
                    <p className="mt-0.5 text-xs text-ink-500">{B.selectedDatesHint}</p>
                  </div>
                  {selectedDates.length > 0 && (
                    <button type="button" className="text-xs font-semibold text-brand-700 hover:text-brand-800" onClick={() => setSelectedDates([])}>
                      Clear
                    </button>
                  )}
                </div>
                {selectedDates.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedDates.map((date) => {
                      const dateKey = keyOf(date);
                      return (
                        <div key={dateKey} className={cn('inline-flex items-center overflow-hidden rounded-lg bg-white ring-1 ring-inset', dateKey === activeKey ? 'ring-brand-400' : 'ring-ink-200')}>
                          <button type="button" className="px-2.5 py-1.5 text-xs font-semibold text-ink-700" onClick={() => focusDate(date)}>
                            {formatDate(date, 'short', date.year)}
                          </button>
                          <button type="button" className="grid h-8 w-8 place-items-center text-ink-400 hover:bg-danger-50 hover:text-danger-600"
                            aria-label={`Remove ${formatDate(date, 'plain', date.year)}`} onClick={() => removeSelectedDate(date)}>
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : <p className="mt-3 text-sm font-medium text-brand-800">{B.noSelectedDates}</p>}
              </div>
            )}

            {dayFestivals.length > 0 && (
              <div className="rounded-xl bg-amber-50 px-3 py-2.5 ring-1 ring-inset ring-amber-200">
                <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">{B.festivals}</p>
                <p className="mt-1 text-sm font-medium text-amber-900">{dayFestivals.map((festival) => festival.name).join(' · ')}</p>
              </div>
            )}

            <div className="space-y-2">
              {!dayBookings.length && <p className="rounded-xl bg-ink-50 px-3 py-4 text-center text-sm text-ink-400">{B.noBookings}</p>}
              {dayBookings.map((booking) => (
                <div key={booking._id} className="flex items-center gap-3 rounded-xl bg-white p-3 ring-1 ring-ink-200">
                  <span className="h-10 w-2 shrink-0 rounded-full" style={{ backgroundColor: booking.resolvedColor }} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-ink-900">{booking.title || booking.typeName}</p>
                    <p className="truncate text-xs text-ink-500">{booking.typeName}{booking.note ? ` · ${booking.note}` : ''}</p>
                  </div>
                  {canWrite && <Button size="xs" variant="ghost" iconOnly icon={Pencil} aria-label={B.edit} onClick={() => edit(booking)} />}
                  {canWrite && <Button size="xs" variant="danger-soft" iconOnly icon={Trash2} aria-label={B.delete} onClick={() => setDeleteItem(booking)} />}
                </div>
              ))}
            </div>

            {canWrite && calendar.bookingTypes.length > 0 && (
              <div className="space-y-4 border-t border-ink-100 pt-5">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-ink-900">{editingId ? B.update : B.add}</p>
                  {editingId && <Button size="xs" variant="ghost" onClick={() => { setEditingId(null); setForm(emptyForm(form.typeKey)); }}>{T.common.cancel}</Button>}
                </div>
                <Select label={B.type} value={form.typeKey} options={calendar.bookingTypes.map((type) => ({ value: type.key, label: type.name }))}
                  onChange={(event) => setForm({ ...form, typeKey: event.target.value, color: '' })} />
                <Input label={B.bookingTitle} optional hint={B.bookingTitleHint} value={form.title} aria-label={B.bookingTitle}
                  onChange={(event) => setForm({ ...form, title: event.target.value })} />
                <div>
                  <p className="mb-2 text-sm font-medium text-ink-700">{B.colour}</p>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => setForm({ ...form, color: '' })}
                      className={cn('flex h-9 items-center gap-1.5 rounded-lg bg-white px-2.5 text-xs font-medium ring-1 ring-inset', !form.color ? 'ring-2 ring-brand-500 text-brand-700' : 'ring-ink-200 text-ink-600')}>
                      {!form.color && <Check className="h-3.5 w-3.5" />}{B.useTypeColour}
                    </button>
                    {QUICK_COLORS.map((color) => (
                      <button key={color} type="button" aria-label={`Use ${color}`} onClick={() => setForm({ ...form, color })}
                        className={cn('grid h-9 w-9 place-items-center rounded-lg ring-offset-2', form.color === color && 'ring-2 ring-brand-500')}
                        style={{ backgroundColor: color }}>
                        {form.color === color && <Check className="h-4 w-4 text-white drop-shadow" />}
                      </button>
                    ))}
                  </div>
                </div>
                <Input label={B.note} optional value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} />
                <Button fullWidth icon={editingId ? Check : Plus} loading={saving} disabled={!editingId && !selectedDates.length} onClick={submit}>
                  {editingId ? B.update : selectedDates.length > 1 ? B.addToDates.replace('{n}', selectedDates.length) : B.add}
                </Button>
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      <ConfirmDialog open={Boolean(deleteItem)} onClose={() => setDeleteItem(null)} onConfirm={remove}
        loading={deleting} title="Delete this booking?" message={deleteItem?.title || deleteItem?.typeName} />
    </>
  );
};

export default BookingCalendarPage;
