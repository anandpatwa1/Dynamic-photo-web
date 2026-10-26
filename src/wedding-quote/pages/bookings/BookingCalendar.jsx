import { bookingDateLabel, groupBookings } from '../../utils/bookingGroups';
import { Link, useParams } from 'react-router-dom';
import { BookingNav } from './BookingNav';
import { useEffect, useMemo, useState } from 'react';
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  Button, Card, CardBody, CardHeader, CardTitle, ConfirmDialog, Input, Modal, PageHeader, Select,
} from '@/components/ui';
import { cn } from '@/utils/cn';
import { CRM } from '@/routes/paths';
import { Calendar } from '../../components/Calendar';
import { PermissionGate } from '../../components/PermissionGate';
import { useBookingCalendar } from '../../hooks/useBookingCalendar';
import { useWqPermissions } from '../../hooks/useWqPermissions';
import { wqBookingApi } from '../../api/wqApi';
import { formatDate, MONTHS } from '../../utils/engine/dates';
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
  const { typeKey } = useParams();
  const [activeDate, setActiveDate] = useState(null);
  const [selectedDates, setSelectedDates] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [listMode, setListMode] = useState(false);
  const source = useBookingCalendar(view, refreshKey, listMode ? 'all' : 'month');
  const calendar = { ...source, bookings: typeKey ? source.bookings.filter(b=>b.typeKey===typeKey) : source.bookings };
  const activeType = source.bookingTypes.find(t=>t.key===typeKey);
  useEffect(()=>{setActiveDate(null);setSelectedDates([]);setEditingId(null);setForm(emptyForm(typeKey));},[typeKey]);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [deleteItem, setDeleteItem] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!calendar.bookingTypes.length) return;
    if (!calendar.bookingTypes.some((type) => type.key === form.typeKey)) {
      setForm((current) => ({ ...current, typeKey: calendar.bookingTypes[0].key, color: '' }));
    }
  }, [calendar.bookingTypes, form.typeKey]);

  const activeKey = activeDate ? keyOf(activeDate) : null;
  const effectiveDates = useMemo(() => {
    if (selectedDates.length > 0) return selectedDates;
    return activeDate ? [activeDate] : [];
  }, [selectedDates, activeDate]);

  const selectedKeys = useMemo(
    () => new Set(effectiveDates.map(keyOf)),
    [effectiveDates],
  );

  const selectedBookings = useMemo(
    () => calendar.bookings.filter((booking) => selectedKeys.has(booking.dateKey)),
    [calendar.bookings, selectedKeys],
  );

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
    setForm(emptyForm(typeKey || calendar.bookingTypes[0]?.key));
  };

  const changeView = (next) => {
    setView(next);
    setActiveDate(null);
    setEditingId(null);
    setForm(emptyForm(typeKey || calendar.bookingTypes[0]?.key));
  };

  const focusDate = (date) => {
    setActiveDate(date);
    setView({ month: date.month, year: date.year });
    setEditingId(null);
    setForm(emptyForm(typeKey || calendar.bookingTypes[0]?.key));
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
      setSelectedDates([]);
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
    if (booking.dateKey) {
      const [y, m, day] = booking.dateKey.split('-').map(Number);
      const bDate = { year: y, month: m, day };
      setActiveDate(bDate);
      setSelectedDates([bDate]);
    } else {
      setSelectedDates([activeDate]);
    }
    setForm({ title: booking.title ?? '', typeKey: booking.typeKey, color: booking.color ?? '', note: booking.note ?? '' });
  };

  const relatedBookings = useMemo(() => {
    if (!deleteItem) return [];
    return (calendar.bookings || []).filter((b) =>
      (deleteItem.groupId && b.groupId && b.groupId === deleteItem.groupId) ||
      (deleteItem.quoteId && b.quoteId && String(b.quoteId) === String(deleteItem.quoteId)) ||
      (b.title && deleteItem.title && b.title === deleteItem.title && b.typeKey === deleteItem.typeKey) ||
      (selectedDates.length > 1 && selectedDates.some((sd) => keyOf(sd) === b.dateKey) && b.title === deleteItem.title)
    );
  }, [deleteItem, calendar.bookings, selectedDates]);

  const removeAllDates = async () => {
    setDeleting(true);
    try {
      if (deleteItem.groupId || deleteItem.quoteId) {
        await wqBookingApi.remove(deleteItem._id, { scope: 'all' });
      } else if (relatedBookings.length > 1) {
        await wqBookingApi.removeBulk({ ids: relatedBookings.map((b) => b._id) });
      } else {
        await wqBookingApi.remove(deleteItem._id);
      }
      toast.success(`Booking deleted from all ${relatedBookings.length} dates`);
      if (relatedBookings.some((b) => b._id === editingId)) {
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

  const removeSingleDate = async () => {
    setDeleting(true);
    try {
      await wqBookingApi.remove(deleteItem._id);
      toast.success('Booking deleted from this date');
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

  return (
    <>
      <PageHeader title={activeType ? `${activeType.name} bookings` : B.title} description="Manage bookings by date or open an individual booking type’s calendar."
        breadcrumbs={[{ label: 'Booking Calendar', to: CRM.wqBookings }, ...(activeType ? [{ label: activeType.name }] : [])]} />

      <BookingNav/>
      <div className="mb-5 flex gap-2" aria-label="Calendar display">
        <Button variant={listMode ? 'secondary' : 'primary'} aria-pressed={!listMode} onClick={()=>setListMode(false)}>Calendar view</Button>
        <Button variant={listMode ? 'primary' : 'secondary'} aria-pressed={listMode} onClick={()=>setListMode(true)}>List view — all bookings</Button>
      </div>
      {listMode && <Card><CardHeader><CardTitle>{activeType?.name || 'All booked events'} — all dates</CardTitle></CardHeader><CardBody className="space-y-3">
        {calendar.loading ? <p role="status">Loading all bookings…</p> : calendar.error ? <p role="alert">{calendar.error}</p> : <>
          {!calendar.bookings.length && <p>No booked events.</p>}
          {groupBookings(calendar.bookings).map(b=><button type="button" key={b._id} className="flex w-full items-center gap-3 rounded-xl border p-3 text-left" onClick={()=>{const [year,month,day]=b.dateKey.split('-').map(Number);focusDate({year,month,day});setListMode(false);}}><span className="h-4 w-4 shrink-0 rounded-full" style={{background:b.resolvedColor}}/><div><p className="font-semibold">{b.title||b.typeName}</p><time dateTime={b.dateKey} className="text-sm text-ink-500">{b.dateLabel} · {b.typeName}{b.dates.length > 1 ? ` · ${b.dates.length} dates` : ''}</time></div></button>)}
        </>}
      </CardBody></Card>}

      {typeKey && !activeType && !calendar.loading && <p role="alert">Booking type not found.</p>}
      {!listMode && <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.65fr)]">
        <div className="contents xl:block xl:space-y-5">
          <Card>
            <CardBody className="relative">
              <Calendar view={view} onViewChange={changeView} selected={selectedDates} max={62}
                onToggle={chooseDate} bookings={calendar.bookings} festivals={calendar.festivals} showSelectionOrder={false} />
              {calendar.loading && <div className="pointer-events-none absolute inset-4 rounded-2xl bg-white/55 backdrop-blur-[1px]" />}
              {calendar.error && <p className="mt-3 text-sm text-danger-600">{calendar.error}</p>}
              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t border-ink-100 pt-4 text-xs text-ink-500">
                {calendar.bookingTypes.map((type) => (
                  <Link key={type.key} to={`${CRM.wqBookings}/type/${type.key}`} className="inline-flex items-center gap-1.5 underline">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: type.color }} />{type.name}
                  </Link>
                ))}
                {calendar.showFestivals && <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-500" />{B.festivals}</span>}
              </div>
            </CardBody>
          </Card>

          <Card><CardHeader><CardTitle>{activeType?.name || 'All bookings'} — date-wise list</CardTitle></CardHeader><CardBody className="space-y-2">
            {!calendar.bookings.length && <p className="text-sm text-ink-500">No bookings in this month.</p>}
            {groupBookings(calendar.bookings).map(b=><button type="button" key={b._id} onClick={()=>{const [year,month,day]=b.dateKey.split('-').map(Number);focusDate({year,month,day});}} className="flex w-full items-center gap-3 rounded-xl border p-3 text-left"><span className="h-4 w-4 shrink-0 rounded-full" style={{background:b.resolvedColor}}/><div><p className="font-semibold">{b.title||b.typeName}</p><p className="text-sm text-ink-500">{b.dateLabel} · {b.typeName}{b.dates.length > 1 ? ` · ${b.dates.length} dates` : ''}</p></div></button>)}
          </CardBody></Card>
        </div>

        <Card className="order-2 xl:order-none xl:sticky xl:top-20">
          <CardHeader>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">
                {selectedDates.length > 1 ? `${selectedDates.length} Selected Dates` : B.selectedDate}
              </p>
              <CardTitle className="mt-1">
                {selectedDates.length > 1
                  ? bookingDateLabel(selectedDates.map(keyOf))
                  : activeDate
                    ? formatDate(activeDate, 'plain', activeDate.year)
                    : 'Choose a date'}
              </CardTitle>
            </div>
            <span className="rounded-full bg-ink-100 px-2.5 py-1 text-xs font-semibold text-ink-600">
              {selectedBookings.length === 1 ? B.oneBooking : B.count.replace('{n}', selectedBookings.length)}
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

            {/* Display bookings: Multi-date view when >1 date selected, single-date view otherwise */}
            {selectedDates.length > 1 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-ink-600">Events Across Selected Dates</p>
                  <span className="text-xs text-ink-400">{selectedBookings.length} total event{selectedBookings.length === 1 ? '' : 's'}</span>
                </div>

                {!selectedBookings.length && (
                  <p className="rounded-xl bg-ink-50 px-3 py-4 text-center text-sm text-ink-400">
                    {B.noBookings} on these {selectedDates.length} dates
                  </p>
                )}

                {effectiveDates.map((dateObj) => {
                  const dateKey = keyOf(dateObj);
                  const bookingsOnDate = calendar.bookings.filter((b) => b.dateKey === dateKey);
                  const festivalsOnDate = calendar.festivals.filter((f) => f.dateKey === dateKey);

                  return (
                    <div
                      key={dateKey}
                      className={cn(
                        'rounded-xl border p-3.5 transition-colors space-y-2',
                        dateKey === activeKey ? 'border-brand-400 bg-brand-50/20 ring-1 ring-brand-300' : 'border-ink-200 bg-ink-50/40',
                      )}
                    >
                      <div className="flex items-center justify-between border-b border-ink-100 pb-1.5">
                        <button
                          type="button"
                          onClick={() => focusDate(dateObj)}
                          className="flex items-center gap-2 text-xs font-bold text-ink-900 hover:text-brand-600 transition-colors"
                        >
                          <span className={cn('h-2 w-2 rounded-full', dateKey === activeKey ? 'bg-brand-600' : 'bg-ink-400')} />
                          {formatDate(dateObj, 'plain', dateObj.year)}
                        </button>
                        <span className="text-[11px] font-medium text-ink-500">
                          {bookingsOnDate.length} booking{bookingsOnDate.length === 1 ? '' : 's'}
                        </span>
                      </div>

                      {festivalsOnDate.length > 0 && (
                        <div className="rounded-md bg-amber-50 px-2 py-0.5 text-2xs font-semibold text-amber-800">
                          Festival: {festivalsOnDate.map((f) => f.name).join(' · ')}
                        </div>
                      )}

                      {!bookingsOnDate.length ? (
                        <p className="py-1 text-xs italic text-ink-400">No events on this date</p>
                      ) : (
                        <div className="space-y-2">
                          {bookingsOnDate.map((booking) => (
                            <div key={booking._id} className="flex flex-col gap-1.5 rounded-lg bg-white p-2.5 ring-1 ring-ink-200 shadow-xs">
                              <div className="flex items-center gap-2.5">
                                <span className="h-8 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: booking.resolvedColor }} />
                                <div className="min-w-0 flex-1">
                                  <p className="truncate font-semibold text-xs text-ink-900">{booking.title || booking.typeName}</p>
                                  <p className="truncate text-2xs text-ink-500">{booking.typeName}{booking.note ? ` · ${booking.note}` : ''}</p>
                                </div>
                                {canWrite && <Button size="xs" variant="ghost" iconOnly icon={Pencil} aria-label={B.edit} onClick={() => edit(booking)} />}
                                {canWrite && <Button size="xs" variant="danger-soft" iconOnly icon={Trash2} aria-label={B.delete} onClick={() => setDeleteItem(booking)} />}
                              </div>

                              {(booking.quoteId || booking.clientName || booking.status) && (
                                <div className="flex flex-wrap items-center gap-2 border-t border-ink-100 pt-1.5 text-2xs">
                                  {booking.status && (
                                    <span className={cn(
                                      'rounded-full px-1.5 py-0.5 font-medium capitalize',
                                      booking.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700' :
                                      booking.status === 'tentative' ? 'bg-amber-50 text-amber-700' :
                                      booking.status === 'completed' ? 'bg-blue-50 text-blue-700' : 'bg-ink-100 text-ink-600',
                                    )}>
                                      {booking.status}
                                    </span>
                                  )}
                                  {booking.clientName && (
                                    <span className="font-medium text-ink-700">👤 {booking.clientName}</span>
                                  )}
                                  {booking.clientPhone && (
                                    <span className="text-ink-500">📞 {booking.clientPhone}</span>
                                  )}
                                  {booking.quoteId && (
                                    <Link
                                      to={CRM.wqQuoteEdit(booking.quoteId)}
                                      className="ml-auto inline-flex items-center gap-1 font-semibold text-brand-600 hover:text-brand-800 hover:underline"
                                    >
                                      View Quote ↗
                                    </Link>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <>
                {dayFestivals.length > 0 && (
                  <div className="rounded-xl bg-amber-50 px-3 py-2.5 ring-1 ring-inset ring-amber-200">
                    <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">{B.festivals}</p>
                    <p className="mt-1 text-sm font-medium text-amber-900">{dayFestivals.map((festival) => festival.name).join(' · ')}</p>
                  </div>
                )}

                <div className="space-y-2">
                  {!dayBookings.length && <p className="rounded-xl bg-ink-50 px-3 py-4 text-center text-sm text-ink-400">{B.noBookings}</p>}
                  {dayBookings.map((booking) => (
                    <div key={booking._id} className="flex flex-col gap-2 rounded-xl bg-white p-3 ring-1 ring-ink-200">
                      <div className="flex items-center gap-3">
                        <span className="h-10 w-2 shrink-0 rounded-full" style={{ backgroundColor: booking.resolvedColor }} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-ink-900">{booking.title || booking.typeName}</p>
                          <p className="truncate text-xs text-ink-500">{booking.typeName}{booking.note ? ` · ${booking.note}` : ''}</p>
                        </div>
                        {canWrite && <Button size="xs" variant="ghost" iconOnly icon={Pencil} aria-label={B.edit} onClick={() => edit(booking)} />}
                        {canWrite && <Button size="xs" variant="danger-soft" iconOnly icon={Trash2} aria-label={B.delete} onClick={() => setDeleteItem(booking)} />}
                      </div>

                      {(booking.quoteId || booking.clientName || booking.status) && (
                        <div className="flex flex-wrap items-center gap-2 border-t border-ink-100 pt-2 text-xs">
                          {booking.status && (
                            <span className={cn(
                              'rounded-full px-2 py-0.5 font-medium text-[11px] capitalize',
                              booking.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700' :
                              booking.status === 'tentative' ? 'bg-amber-50 text-amber-700' :
                              booking.status === 'completed' ? 'bg-blue-50 text-blue-700' : 'bg-ink-100 text-ink-600',
                            )}>
                              {booking.status}
                            </span>
                          )}
                          {booking.clientName && (
                            <span className="font-medium text-ink-700">👤 {booking.clientName}</span>
                          )}
                          {booking.clientPhone && (
                            <span className="text-ink-500">📞 {booking.clientPhone}</span>
                          )}
                          {booking.quoteId && (
                            <Link
                              to={CRM.wqQuoteEdit(booking.quoteId)}
                              className="ml-auto inline-flex items-center gap-1 font-semibold text-brand-600 hover:text-brand-800 hover:underline"
                            >
                              View Quote ↗
                            </Link>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}

            {canWrite && calendar.bookingTypes.length > 0 && (
              <div className="space-y-4 border-t border-ink-100 pt-5">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-ink-900">{editingId ? B.update : B.add}</p>
                  {editingId && <Button size="xs" variant="ghost" onClick={() => { setEditingId(null); setForm(emptyForm(form.typeKey)); }}>{T.common.cancel}</Button>}
                </div>
                <Select label={B.type} value={form.typeKey} options={calendar.bookingTypes.filter(type=>!typeKey||type.key===typeKey).map((type) => ({ value: type.key, label: type.name }))}
                  onChange={(event) => setForm({ ...form, typeKey: event.target.value, color: '' })} />
                <Input label={B.bookingTitle} optional hint={B.bookingTitleHint} value={form.title} aria-label={B.bookingTitle}
                  onChange={(event) => setForm({ ...form, title: event.target.value })} />
                <div>
                  <p className="mb-2 text-sm font-medium text-ink-700">{B.colour}</p>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => setForm({ ...form, color: '' })}
                      className={cn('flex h-9 items-center gap-1.5 rounded-lg bg-white px-2.5 text-xs font-medium ring-1 ring-inset', !form.color ? 'ring-2 ring-slate-600 text-brand-700' : 'ring-ink-200 text-ink-600')}>
                      {!form.color && <Check className="h-3.5 w-3.5" />}{B.useTypeColour}
                    </button>
                    {QUICK_COLORS.map((color) => (
                      <button key={color} type="button" aria-label={`Use ${color}`} onClick={() => setForm({ ...form, color })}
                        className={cn('grid h-9 w-9 place-items-center rounded-lg ring-offset-2', form.color === color && 'ring-2 ring-slate-600')}
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
      </div>}

      {deleteItem && relatedBookings.length > 1 ? (
        <Modal
          open={Boolean(deleteItem)}
          onClose={() => setDeleteItem(null)}
          title={`Delete "${deleteItem.title || deleteItem.typeName}"`}
          description={`This booking is scheduled across ${relatedBookings.length} dates.`}
          footer={
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button variant="secondary" onClick={() => setDeleteItem(null)}>
                Cancel
              </Button>
              <Button variant="secondary" loading={deleting} onClick={removeSingleDate}>
                This Date Only ({activeDate.day} {MONTHS[activeDate.month - 1].slice(0, 3)})
              </Button>
              <Button variant="danger" autoFocus loading={deleting} onClick={removeAllDates}>
                Delete from All {relatedBookings.length} Dates
              </Button>
            </div>
          }
        >
          <div className="py-2 text-sm text-ink-600">
            <p>
              This event is booked across <strong>{relatedBookings.length} dates</strong>:
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {relatedBookings.map((b) => (
                <span key={b._id} className="rounded-lg bg-ink-100 px-2.5 py-1 text-xs font-semibold text-ink-800">
                  {b.dateKey}
                </span>
              ))}
            </div>
            <p className="mt-3 text-xs text-ink-400">
              Click <strong>"Delete from All {relatedBookings.length} Dates"</strong> to remove this booking across all dates.
            </p>
          </div>
        </Modal>
      ) : (
        <ConfirmDialog
          open={Boolean(deleteItem)}
          onClose={() => setDeleteItem(null)}
          onConfirm={removeSingleDate}
          loading={deleting}
          title="Delete this booking?"
          message={deleteItem?.title || deleteItem?.typeName}
        />
      )}
    </>
  );
};

export default BookingCalendarPage;
