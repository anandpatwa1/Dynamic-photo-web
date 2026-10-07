import { useEffect, useMemo, useRef, useState } from 'react';
import { Clock, Facebook, Instagram, Mail, MapPin, Phone, Youtube } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Reveal } from '../components/Reveal';
import { useSection, useSiteContent } from '../content/SiteContent';
import { useEnquiry } from '../content/EnquiryContext';
import { publicApi } from '../api/publicApi';

const SOCIAL_ICONS = { instagram: Instagram, facebook: Facebook, youtube: Youtube };

const EVENT_TYPES = ['Wedding', 'Pre-Wedding', 'Cinematic Film', 'Other'];

/** Mirrors the server validator. Client-side checks are UX, never the authority. */
const validate = (values) => {
  const errors = {};
  if (!values.name.trim()) errors.name = 'Please tell us your name.';
  if (!values.phone.trim() && !values.email.trim())
    errors.email = 'Leave a phone number or an email so we can reply.';
  if (values.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email))
    errors.email = 'That email address does not look right.';
  if (values.phone.trim() && values.phone.replace(/\D/g, '').length < 7)
    errors.phone = 'That phone number looks too short.';
  return errors;
};

const EMPTY = { name: '', email: '', phone: '', eventType: '', eventDate: '', message: '' };

export const Contact = () => {
  const contact = useSection('contact');
  const { packages, portfolio } = useSiteContent();
  // Occasions follow the categories the studio actually shoots; the list used
  // to be fixed in code, so a new category never appeared in the form.
  const occasions = useMemo(() => {
    const fromWork = (portfolio?.categories ?? []).filter((category) => category.id !== 'all').map((category) => category.label);
    return [...(fromWork.length > 0 ? fromWork : EVENT_TYPES.slice(0, -1)), 'Other'];
  }, [portfolio?.categories]);
  const { selectedPackageId, setSelectedPackageId } = useEnquiry();

  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error
  const mountedAt = useRef(Date.now());
  const honeypot = useRef(null);

  // Clear a field's error as soon as the visitor starts correcting it.
  const update = (field) => (event) => {
    const { value } = event.target;
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  };

  useEffect(() => {
    if (status !== 'sent') return undefined;
    const timer = setTimeout(() => setStatus('idle'), 8000);
    return () => clearTimeout(timer);
  }, [status]);

  const onSubmit = async (event) => {
    event.preventDefault();

    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setStatus('sending');

    try {
      /*
       * Send the package *name*, not its id. `Inquiry.packageInterest` is
       * deliberately free text so the record still reads correctly after a
       * package is renamed or deleted — and an ObjectId satisfies none of that,
       * it just puts "6a6cc7aa54c2…" in front of whoever reads the inbox.
       */
      const chosen = packages?.items?.find((item) => item.id === selectedPackageId);

      await publicApi.submitInquiry({
        ...values,
        packageInterest: chosen?.name || undefined,
        // Anti-spam signals. Both are advisory — the server decides.
        _hp: honeypot.current?.value ?? '',
        _elapsedMs: Date.now() - mountedAt.current,
      });

      setStatus('sent');
      setValues(EMPTY);
      setSelectedPackageId('');
    } catch {
      setStatus('error');
    }
  };

  if (!contact) return null;

  const fieldClass = (field) =>
    cn(
      // 16px minimum: anything smaller makes iOS zoom the whole page on focus.
      'w-full min-h-[44px] rounded-none border-b bg-transparent px-0 py-3 text-base leading-normal text-site-ink',
      'placeholder:text-site-muted/70',
      'focus:outline-none focus:border-site-accent transition-colors',
      errors[field] ? 'border-red-600' : 'border-site-line',
    );

  return (
    <section id="contact" aria-labelledby="contact-title" className="bg-site-paper">
      <div className="mx-auto max-w-8xl px-5 py-20 sm:px-8 sm:py-24 lg:px-12 lg:py-28">
        <div className="grid gap-14 lg:grid-cols-2 lg:gap-20">
          <div>
            <Reveal as="p" className="text-site-eyebrow font-medium uppercase text-site-accent">
              {contact.eyebrow}
            </Reveal>

            <Reveal
              as="h2"
              id="contact-title"
              delay={80}
              className="mt-5 font-serif text-site-h2 font-light text-site-ink"
            >
              {contact.title}
            </Reveal>

            <Reveal as="ul" delay={160} className="mt-10 space-y-5">
              {contact.phone && (
                <li className="flex items-center gap-4">
                  <Phone className="h-4 w-4 shrink-0 text-site-accent" strokeWidth={1.5} aria-hidden="true" />
                  <a href={`tel:${contact.phone.replace(/\s/g, '')}`} className="text-site-body hover:text-site-ink">
                    {contact.phone}
                  </a>
                </li>
              )}
              {contact.email && (
                <li className="flex items-center gap-4">
                  <Mail className="h-4 w-4 shrink-0 text-site-accent" strokeWidth={1.5} aria-hidden="true" />
                  <a href={`mailto:${contact.email}`} className="break-all text-site-body hover:text-site-ink">
                    {contact.email}
                  </a>
                </li>
              )}
              {contact.address && (
                <li className="flex items-center gap-4">
                  <MapPin className="h-4 w-4 shrink-0 text-site-accent" strokeWidth={1.5} aria-hidden="true" />
                  <span className="text-site-body">{contact.address}</span>
                </li>
              )}
              {contact.hours && (
                <li className="flex items-center gap-4">
                  <Clock className="h-4 w-4 shrink-0 text-site-accent" strokeWidth={1.5} aria-hidden="true" />
                  <span className="text-site-body">{contact.hours}</span>
                </li>
              )}
            </Reveal>

            {contact.socials?.length > 0 && (
              <Reveal delay={240} className="mt-10 flex gap-3">
                {contact.socials.map((social) => {
                  const Icon = SOCIAL_ICONS[social.platform];
                  if (!Icon) return null;
                  return (
                    <a
                      key={social.platform}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${contact.title} on ${social.platform}`}
                      className="grid h-11 w-11 place-items-center border border-site-line text-site-ink transition-colors hover:border-site-ink hover:bg-site-ink hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-accent"
                    >
                      <Icon className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
                    </a>
                  );
                })}
              </Reveal>
            )}
          </div>

          <Reveal delay={120}>
            <form onSubmit={onSubmit} noValidate className="space-y-6">
              {/*
                Honeypot. Hidden from sight and from assistive tech, but a bot
                filling every input will trip it. `sr-only` is deliberately not
                used — screen readers would announce it.
              */}
              <input
                ref={honeypot}
                type="text"
                name="company_website"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                style={{ position: 'absolute', left: '-9999px', opacity: 0, height: 0, width: 0 }}
              />

              <div>
                <label htmlFor="enquiry-name" className="text-site-eyebrow font-medium uppercase text-site-muted">
                  Your name
                </label>
                <input
                  id="enquiry-name"
                  value={values.name}
                  onChange={update('name')}
                  autoComplete="name"
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? 'enquiry-name-error' : undefined}
                  className={fieldClass('name')}
                />
                {errors.name && (
                  <p id="enquiry-name-error" className="mt-2 text-sm text-red-700">
                    {errors.name}
                  </p>
                )}
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="enquiry-email" className="text-site-eyebrow font-medium uppercase text-site-muted">
                    Email
                  </label>
                  <input
                    id="enquiry-email"
                    type="email"
                    value={values.email}
                    onChange={update('email')}
                    autoComplete="email"
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? 'enquiry-email-error' : undefined}
                    className={fieldClass('email')}
                  />
                  {errors.email && (
                    <p id="enquiry-email-error" className="mt-2 text-sm text-red-700">
                      {errors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="enquiry-phone" className="text-site-eyebrow font-medium uppercase text-site-muted">
                    Phone
                  </label>
                  <input
                    id="enquiry-phone"
                    type="tel"
                    value={values.phone}
                    onChange={update('phone')}
                    autoComplete="tel"
                    aria-invalid={Boolean(errors.phone)}
                    aria-describedby={errors.phone ? 'enquiry-phone-error' : undefined}
                    className={fieldClass('phone')}
                  />
                  {errors.phone && (
                    <p id="enquiry-phone-error" className="mt-2 text-sm text-red-700">
                      {errors.phone}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="enquiry-type" className="text-site-eyebrow font-medium uppercase text-site-muted">
                    Occasion
                  </label>
                  <select
                    id="enquiry-type"
                    value={values.eventType}
                    onChange={update('eventType')}
                    className={fieldClass('eventType')}
                  >
                    <option value="">Select…</option>
                    {occasions.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="enquiry-date" className="text-site-eyebrow font-medium uppercase text-site-muted">
                    Date (approx.)
                  </label>
                  <input
                    id="enquiry-date"
                    type="date"
                    value={values.eventDate}
                    onChange={update('eventDate')}
                    className={fieldClass('eventDate')}
                  />
                </div>
              </div>

              {packages?.items?.length > 0 && (
                <div>
                  <label htmlFor="enquiry-package" className="text-site-eyebrow font-medium uppercase text-site-muted">
                    Package of interest
                  </label>
                  <select
                    id="enquiry-package"
                    value={selectedPackageId}
                    onChange={(event) => setSelectedPackageId(event.target.value)}
                    className={fieldClass('package')}
                  >
                    <option value="">No preference yet</option>
                    {packages.items.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label htmlFor="enquiry-message" className="text-site-eyebrow font-medium uppercase text-site-muted">
                  Tell us about your day
                </label>
                <textarea
                  id="enquiry-message"
                  rows={4}
                  value={values.message}
                  onChange={update('message')}
                  className={cn(fieldClass('message'), 'resize-y')}
                />
              </div>

              <button
                type="submit"
                disabled={status === 'sending'}
                className="w-full bg-site-ink px-8 py-4 text-site-eyebrow font-medium uppercase text-white transition-colors hover:bg-site-ink-soft disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-accent focus-visible:ring-offset-2 sm:w-auto"
              >
                {status === 'sending' ? 'Sending…' : 'Send Enquiry'}
              </button>

              {/* Announced to screen readers without stealing focus. */}
              <p role="status" aria-live="polite" className="min-h-[1.5rem] text-sm">
                {status === 'sent' && (
                  <span className="text-site-accent">
                    Thank you — we have your enquiry and will be in touch shortly.
                  </span>
                )}
                {status === 'error' && (
                  <span className="text-red-700">
                    Something went wrong sending that. Please try again, or email us directly.
                  </span>
                )}
              </p>
            </form>
          </Reveal>
        </div>
      </div>
    </section>
  );
};
