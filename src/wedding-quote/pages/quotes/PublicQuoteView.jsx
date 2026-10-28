import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  AlertCircle,
  Calendar,
  Camera,
  Check,
  CheckCircle2,
  Clock,
  Film,
  Gift,
  HelpCircle,
  MapPin,
  MessageCircle,
  Phone,
  Printer,
  Sparkles,
  X,
  XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { publicWqApi } from '../../api/wqApi';
import { formatINR } from '../../utils/engine/money';

export const PublicQuoteView = () => {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  // Response modal state
  const [modalAction, setModalAction] = useState(null); // 'accepted' | 'revision_requested' | 'rejected'
  const [respondName, setRespondName] = useState('');
  const [respondPhone, setRespondPhone] = useState('');
  const [respondNote, setRespondNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    publicWqApi
      .getQuote(token)
      .then((res) => {
        if (active) {
          setData(res);
          if (res.quote?.clientContact?.name) setRespondName(res.quote.clientContact.name);
          if (res.quote?.clientContact?.phone) setRespondPhone(res.quote.clientContact.phone);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err?.response?.data?.message || 'Quotation not found or link has expired.');
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [token]);

  const handleResponse = async () => {
    if (!modalAction) return;
    if (modalAction === 'accepted' && !respondName.trim()) {
      toast.error('Please enter your name');
      return;
    }
    setSubmitting(true);
    try {
      const res = await publicWqApi.respond(token, {
        action: modalAction,
        name: respondName.trim(),
        phone: respondPhone.trim(),
        note: respondNote.trim(),
      });
      toast.success(res?.message || 'Your response has been sent!');
      setData((prev) => ({
        ...prev,
        quote: {
          ...prev.quote,
          status: res.status,
          clientResponse: res.clientResponse,
          clientNote: respondNote.trim(),
          clientContact: {
            ...prev.quote.clientContact,
            name: respondName.trim() || prev.quote?.clientContact?.name,
            phone: respondPhone.trim() || prev.quote?.clientContact?.phone,
          },
        },
      }));
      setModalAction(null);
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Could not submit response. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-900 text-stone-300">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-amber-400 border-t-transparent" />
          <p className="mt-4 font-serif text-lg tracking-wide text-amber-200">Preparing your wedding proposal…</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-900 px-4 text-center">
        <div className="max-w-md rounded-2xl border border-stone-800 bg-stone-950/70 p-8 shadow-2xl backdrop-blur">
          <AlertCircle className="mx-auto h-12 w-12 text-amber-400" />
          <h1 className="mt-4 font-serif text-2xl font-light text-stone-100">Proposal Unavailable</h1>
          <p className="mt-2 text-sm text-stone-400">{error || 'This link may have been updated or removed.'}</p>
        </div>
      </div>
    );
  }

  const { quote, studio, display, isExpired } = data;
  const isAccepted = quote.clientResponse === 'accepted' || quote.status === 'accepted';
  const isRevision = quote.clientResponse === 'revision_requested' || quote.status === 'revision_requested';
  const isRejected = quote.clientResponse === 'rejected' || quote.status === 'rejected';

  const cleanPhone = (studio.phone || '').replace(/[^0-9]/g, '');
  const waUrl = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(`Hi ${studio.name}, regarding the wedding quotation (${quote.label || display.title}): `)}`
    : null;

  const daysLeft = quote.validUntil
    ? Math.max(0, Math.ceil((new Date(quote.validUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 selection:bg-amber-400 selection:text-stone-950">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 border-b border-stone-800/80 bg-stone-950/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-400/20 to-amber-600/30 text-amber-300 ring-1 ring-amber-400/40">
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-xs uppercase tracking-widest text-amber-400">Wedding Proposal</p>
                {quote.quoteCode && (
                  <span className="font-mono text-2xs px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 font-bold border border-amber-400/30">
                    #{quote.quoteCode}
                  </span>
                )}
              </div>
              <h2 className="text-sm font-semibold tracking-wide text-stone-100">{studio.name}</h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-full bg-stone-800 px-3 py-1.5 text-xs font-medium text-stone-200 ring-1 ring-stone-700 transition hover:bg-stone-700 hover:text-amber-300"
              title="Print or Save Proposal as PDF"
            >
              <Printer className="h-3.5 w-3.5 text-amber-400" />
              <span className="hidden sm:inline">Save PDF / Print</span>
            </button>
            {waUrl && (
              <a
                href={waUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600/20 px-3 py-1.5 text-xs font-medium text-emerald-300 ring-1 ring-emerald-500/30 transition hover:bg-emerald-600/30"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                <span>WhatsApp</span>
              </a>
            )}
            {studio.phone && (
              <a
                href={`tel:${studio.phone}`}
                className="inline-flex items-center gap-1.5 rounded-full bg-stone-800 px-3 py-1.5 text-xs font-medium text-stone-200 ring-1 ring-stone-700 transition hover:bg-stone-700"
              >
                <Phone className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{studio.phone}</span>
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        {/* Status Banners */}
        {isAccepted && (
          <div className="mb-8 rounded-2xl border border-emerald-500/30 bg-emerald-950/40 p-4 text-emerald-200 shadow-lg sm:p-5">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-emerald-400 shrink-0" />
              <div>
                <p className="font-medium text-emerald-100">Proposal Accepted!</p>
                <p className="text-xs text-emerald-300/80">
                  Thank you! The studio has been notified. We look forward to capturing your wedding memories.
                </p>
              </div>
            </div>
          </div>
        )}

        {isRevision && (
          <div className="mb-8 rounded-2xl border border-amber-500/30 bg-amber-950/40 p-4 text-amber-200 shadow-lg sm:p-5">
            <div className="flex items-center gap-3">
              <HelpCircle className="h-6 w-6 text-amber-400 shrink-0" />
              <div>
                <p className="font-medium text-amber-100">Revision Requested</p>
                <p className="text-xs text-amber-300/80">
                  {quote.clientNote ? `Your note: "${quote.clientNote}"` : 'Your revision request is under review with the studio.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {isExpired && !isAccepted && (
          <div className="mb-8 rounded-2xl border border-rose-500/30 bg-rose-950/40 p-4 text-rose-200 shadow-lg sm:p-5">
            <div className="flex items-center gap-3">
              <Clock className="h-6 w-6 text-rose-400 shrink-0" />
              <div>
                <p className="font-medium text-rose-100">Proposal Expired</p>
                <p className="text-xs text-rose-300/80">
                  This offer had a validity date that has passed. Please contact the studio for an updated proposal.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Hero Card */}
        <section className="relative overflow-hidden rounded-3xl border border-amber-900/30 bg-gradient-to-b from-stone-900/90 to-stone-900/40 p-6 shadow-2xl backdrop-blur sm:p-10">
          <div className="absolute right-0 top-0 -mt-8 -mr-8 h-48 w-48 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-800 pb-5">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-300 ring-1 ring-amber-400/30">
                <Sparkles className="h-3 w-3" />
                Custom Wedding Quote
              </span>
            </div>
            {quote.validUntil && (
              <span className={`flex items-center gap-1.5 text-xs ${daysLeft !== null && daysLeft <= 3 ? 'text-amber-300 font-medium' : 'text-stone-400'}`}>
                <Clock className="h-3.5 w-3.5 text-amber-400" />
                Valid till {new Date(quote.validUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                {daysLeft !== null && !isExpired && (
                  <span className="ml-1 rounded-full bg-amber-400/10 px-2 py-0.5 text-[11px] text-amber-300 ring-1 ring-amber-400/20">
                    {daysLeft === 0 ? 'Expires today' : `${daysLeft}d left`}
                  </span>
                )}
              </span>
            )}
          </div>

          <div className="mt-6 text-center sm:text-left">
            <h1 className="font-serif text-3xl font-normal tracking-wide text-stone-50 sm:text-4xl md:text-5xl">
              {display.title || 'Wedding Photography Proposal'}
            </h1>
            {display.subtitle && (
              <p className="mt-2 font-serif text-lg italic text-amber-300/90 sm:text-xl">
                {display.subtitle}
              </p>
            )}
            {display.description && (
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-stone-300">
                {display.description}
              </p>
            )}
          </div>

          {/* Quick Stats Grid */}
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-stone-800 bg-stone-950/60 p-3 text-center sm:p-4">
              <p className="text-xs text-stone-400">Total Dates</p>
              <p className="mt-1 font-serif text-xl text-amber-300 sm:text-2xl">{display.dayCount || display.dates?.length || 1}</p>
            </div>
            <div className="rounded-xl border border-stone-800 bg-stone-950/60 p-3 text-center sm:p-4">
              <p className="text-xs text-stone-400">Deliverables</p>
              <p className="mt-1 font-serif text-xl text-amber-300 sm:text-2xl">{display.deliverables?.length || 0}</p>
            </div>
            <div className="rounded-xl border border-stone-800 bg-stone-950/60 p-3 text-center sm:p-4">
              <p className="text-xs text-stone-400">Add-on Offer</p>
              <p className="mt-1 text-sm font-medium text-amber-300 sm:text-base truncate">
                {display.addOn ? display.addOn.badge || 'Included' : 'Standard'}
              </p>
            </div>
            <div className="rounded-xl border border-stone-800 bg-stone-950/60 p-3 text-center sm:p-4">
              <p className="text-xs text-stone-400">Studio City</p>
              <p className="mt-1 text-sm font-medium text-stone-200 sm:text-base truncate">{studio.city || 'Indore'}</p>
            </div>
          </div>
        </section>

        {/* Event Dates & Services Timeline */}
        <section className="mt-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-serif text-xl font-light text-stone-100 sm:text-2xl">
              <Calendar className="h-5 w-5 text-amber-400" />
              Event Schedule &amp; Coverage
            </h2>
            <span className="text-xs text-stone-400">Chronological</span>
          </div>

          <div className="space-y-4">
            {(display.dates || []).map((dateGroup, idx) => (
              <div
                key={dateGroup.key || idx}
                className="overflow-hidden rounded-2xl border border-stone-800/90 bg-stone-900/60 p-5 shadow-sm transition hover:border-amber-900/40"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-800/60 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-400/20 text-xs font-semibold text-amber-300">
                      {idx + 1}
                    </span>
                    <h3 className="font-serif text-lg font-medium text-amber-200 sm:text-xl">
                      {dateGroup.label}
                    </h3>
                  </div>
                  {dateGroup.tile && (
                    <span className="rounded bg-stone-800 px-2 py-0.5 text-xs text-stone-300">
                      {dateGroup.tile.day} {dateGroup.tile.month} {dateGroup.tile.year}
                    </span>
                  )}
                </div>

                <ul className="mt-4 space-y-2.5">
                  {(dateGroup.lines || []).map((line, lIdx) => (
                    <li key={line.path || lIdx} className="flex items-start gap-3 text-sm text-stone-200">
                      <div className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-amber-400/20 text-amber-300">
                        <Check className="h-2.5 w-2.5" />
                      </div>
                      <span className="leading-snug">{line.text}</span>
                    </li>
                  ))}
                  {(!dateGroup.lines || dateGroup.lines.length === 0) && (
                    <li className="text-sm italic text-stone-400">Coverage services configured for this date.</li>
                  )}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Deliverables Section */}
        <section className="mt-10 rounded-2xl border border-stone-800/90 bg-stone-900/60 p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-serif text-xl font-light text-stone-100 sm:text-2xl">
              <Film className="h-5 w-5 text-amber-400" />
              {display.deliverablesHeading || 'Deliverables'}
            </h2>
            <span className="text-xs text-stone-400">{display.deliverables?.length || 0} items</span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {(display.deliverables || []).map((del, dIdx) => (
              <div
                key={del.id || dIdx}
                className="flex items-center gap-3 rounded-xl border border-stone-800/70 bg-stone-950/50 p-3.5 text-sm text-stone-200"
              >
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-400/20 text-amber-300">
                  <Check className="h-3 w-3" />
                </div>
                <span className="flex-1 leading-snug">{del.text}</span>
                {del.isAuto && (
                  <span className="rounded bg-amber-400/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-amber-300 ring-1 ring-amber-400/20">
                    Reels
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Special Offer / Add-On Cards */}
        {((display.addOns && display.addOns.length > 0) ? display.addOns : display.addOn ? [display.addOn] : []).map((addon, aIdx) => (
          <section
            key={addon.id || aIdx}
            className="mt-6 overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-950/40 via-stone-900/60 to-amber-950/30 p-6 shadow-xl"
          >
            <div className="flex items-center gap-2.5">
              <Gift className="h-5 w-5 text-amber-400" />
              <span className="rounded-full bg-amber-400 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-stone-950">
                {addon.badge || 'Add-On'}
              </span>
            </div>

            <h3 className="mt-3 font-serif text-xl font-medium text-stone-100">
              {addon.title}
            </h3>
            {addon.text && (
              <p className="mt-1.5 text-sm leading-relaxed text-stone-300">
                {addon.text}
              </p>
            )}
            {addon.price && (
              <p className="mt-3 text-sm font-semibold text-amber-300">
                {addon.price}
              </p>
            )}
          </section>
        ))}

        {/* Pricing & Investment Card */}
        <section className="mt-10 overflow-hidden rounded-3xl border border-amber-600/40 bg-gradient-to-b from-stone-900 to-stone-950 p-6 shadow-2xl sm:p-10">
          <div className="text-center sm:text-left">
            <p className="text-xs uppercase tracking-widest text-amber-400">Total Investment</p>
            <div className="mt-3 flex flex-wrap items-baseline justify-center gap-3 sm:justify-start">
              <span className="font-serif text-4xl font-bold tracking-tight text-stone-50 sm:text-5xl md:text-6xl">
                {display.price?.sellingText || formatINR(display.price?.selling)}
              </span>
              {display.price?.showMrp && (
                <span className="text-xl text-stone-500 line-through sm:text-2xl">
                  {display.price?.mrpText || formatINR(display.price?.mrp)}
                </span>
              )}
            </div>

            {display.price?.taxEnabled && display.price?.taxAmount > 0 && (
              <p className="mt-2 text-xs font-medium text-amber-300/90">
                {display.price?.taxIncluded
                  ? `(Includes ${display.price.taxRate}% GST: ${formatINR(display.price.taxAmount)})`
                  : `(Base Investment: ${display.price.baseSellingText} ${display.price.taxText})`}
              </p>
            )}

            <p className="mt-2 text-xs text-stone-400">
              Includes full photography, cinematography &amp; deliverables as specified above.
            </p>
          </div>

          {/* Notes & Terms */}
          {display.notes && display.notes.length > 0 && (
            <div className="mt-8 border-t border-stone-800 pt-6">
              <p className="text-xs font-medium uppercase tracking-wider text-stone-400">Important Notes &amp; Terms</p>
              <ul className="mt-3 space-y-2 text-xs text-stone-300">
                {display.notes.map((note, nIdx) => (
                  <li key={nIdx} className="flex items-start gap-2">
                    <span className="text-amber-400">•</span>
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-10 border-t border-stone-800 pt-6">
            {!isAccepted && !isExpired && (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                <button
                  type="button"
                  onClick={() => setModalAction('revision_requested')}
                  className="rounded-full border border-stone-700 bg-stone-800/80 px-6 py-3 text-sm font-medium text-stone-200 transition hover:bg-stone-700 hover:text-white"
                >
                  Request Changes 🔄
                </button>
                <button
                  type="button"
                  onClick={() => setModalAction('accepted')}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 px-8 py-3.5 text-sm font-semibold text-stone-950 shadow-lg transition hover:from-amber-300 hover:to-amber-400"
                >
                  <Check className="h-4 w-4" />
                  Accept Quotation ✅
                </button>
              </div>
            )}

            {isAccepted && (
              <div className="text-center sm:text-right">
                <p className="text-sm font-medium text-emerald-400">✅ Quotation has been accepted</p>
              </div>
            )}
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-16 border-t border-stone-800/80 pt-8 text-center text-xs text-stone-400 sm:text-left">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="font-medium text-stone-200">{studio.name}</p>
              <p className="mt-0.5 text-stone-400">{display.footer}</p>
            </div>
            {studio.website && (
              <a
                href={studio.website}
                target="_blank"
                rel="noreferrer"
                className="text-amber-400 hover:underline"
              >
                {studio.website.replace(/^https?:\/\//, '')}
              </a>
            )}
          </div>
        </footer>
      </main>

      {/* Response Modal */}
      {modalAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-3xl border border-stone-800 bg-stone-900 p-6 shadow-2xl sm:p-8">
            <button
              type="button"
              onClick={() => setModalAction(null)}
              className="absolute right-4 top-4 rounded-full p-2 text-stone-400 hover:bg-stone-800 hover:text-stone-100"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="font-serif text-2xl font-normal text-stone-50">
              {modalAction === 'accepted' ? 'Accept Quotation Proposal' : 'Request Changes'}
            </h3>
            <p className="mt-1 text-xs text-stone-400">
              {modalAction === 'accepted'
                ? 'Confirming informs the studio so they can hold the dates for you.'
                : 'Describe what adjustments you would like to make.'}
            </p>

            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-medium uppercase text-stone-300">Your Full Name *</label>
                <input
                  type="text"
                  value={respondName}
                  onChange={(e) => setRespondName(e.target.value)}
                  placeholder="e.g. Rahul & Priya"
                  className="mt-1.5 w-full rounded-xl border border-stone-700 bg-stone-950 px-4 py-2.5 text-sm text-stone-100 placeholder-stone-500 focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium uppercase text-stone-300">Phone Number (WhatsApp)</label>
                <input
                  type="tel"
                  value={respondPhone}
                  onChange={(e) => setRespondPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="mt-1.5 w-full rounded-xl border border-stone-700 bg-stone-950 px-4 py-2.5 text-sm text-stone-100 placeholder-stone-500 focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium uppercase text-stone-300">
                  {modalAction === 'accepted' ? 'Message / Note (Optional)' : 'Requested Changes / Comments *'}
                </label>
                <textarea
                  rows={3}
                  value={respondNote}
                  onChange={(e) => setRespondNote(e.target.value)}
                  placeholder={
                    modalAction === 'accepted'
                      ? 'Looking forward to meeting you!'
                      : 'e.g. Can we add a drone for the Sangeet night, and adjust pre-wedding dates?'
                  }
                  className="mt-1.5 w-full rounded-xl border border-stone-700 bg-stone-950 px-4 py-2.5 text-sm text-stone-100 placeholder-stone-500 focus:border-amber-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setModalAction(null)}
                className="rounded-full px-5 py-2.5 text-xs font-medium text-stone-400 hover:text-stone-200"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleResponse}
                className="rounded-full bg-gradient-to-r from-amber-400 to-amber-500 px-6 py-2.5 text-xs font-semibold text-stone-950 shadow transition hover:from-amber-300 hover:to-amber-400 disabled:opacity-50"
              >
                {submitting ? 'Sending…' : modalAction === 'accepted' ? 'Confirm Acceptance ✅' : 'Submit Request 🔄'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print Stylesheet */}
      <style>{`
        @media print {
          body {
            background-color: #ffffff !important;
            color: #111827 !important;
          }
          header, button, [role="dialog"], .no-print {
            display: none !important;
          }
          main {
            max-width: 100% !important;
            padding: 0 !important;
          }
          section {
            background: #ffffff !important;
            color: #111827 !important;
            border-color: #e5e7eb !important;
            box-shadow: none !important;
            page-break-inside: avoid;
          }
          h1, h2, h3, p, span, li {
            color: #111827 !important;
          }
          .text-amber-400, .text-amber-300, .text-amber-200 {
            color: #b45309 !important;
          }
          .border-stone-800, .border-stone-700 {
            border-color: #e5e7eb !important;
          }
          .bg-stone-900, .bg-stone-950, .bg-stone-900\\/50 {
            background-color: #f9fafb !important;
          }
        }
      `}</style>
    </div>
  );
};

export default PublicQuoteView;

