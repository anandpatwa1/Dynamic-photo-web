import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useScrollSpy } from '../hooks/useScrollSpy';
import { useSiteContent } from '../content/SiteContent';
import { buildNavLinks } from '../navigation';

/**
 * Sticky header.
 *
 * Two states: transparent while the hero is behind it (the reference shows the
 * nav floating over the photograph), and an opaque paper bar once the reader
 * scrolls past it. The switch is driven by scroll position rather than an
 * IntersectionObserver on the hero because the header must also solidify on
 * pages where the hero section is disabled by the CMS.
 */
export const SiteNav = ({ brand, forceSolid = false }) => {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const content = useSiteContent();
  const navLinks = useMemo(() => buildNavLinks(content), [content]);
  const navIds = useMemo(() => navLinks.map((link) => link.id), [navLinks]);
  const activeId = useScrollSpy(navIds);
  const enquiryLabel = content?.settings?.enquiryLabel || 'Enquiry Now';
  const { pathname } = useLocation();
  const panelRef = useRef(null);
  const toggleRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close the drawer on Escape and return focus to the control that opened it —
  // without this, keyboard users are stranded at the top of the document.
  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (event) => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      toggleRef.current?.focus();
    };

    document.addEventListener('keydown', onKeyDown);
    // Prevent the page scrolling underneath the open drawer.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  // The drawer belongs to the page it was opened on; navigating away or using
  // the browser's back button must not leave it covering the next page.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const solid = forceSolid || scrolled || open;
  const homeHref = pathname === '/' ? '#hero' : '/#hero';
  const sectionHref = (id) => (pathname === '/' ? `#${id}` : `/#${id}`);

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:bg-site-ink focus:px-5 focus:py-3 focus:text-site-eyebrow focus:uppercase focus:text-white"
      >
        Skip to content
      </a>

      <header
        className={cn(
          'fixed inset-x-0 top-0 z-50 transition-colors duration-500 ease-smooth',
          solid ? 'bg-site-paper/95 backdrop-blur-md shadow-[0_1px_0_0_rgba(0,0,0,0.06)]' : 'bg-transparent',
        )}
      >
        <div className="mx-auto flex h-20 max-w-8xl items-center justify-between gap-6 px-5 sm:px-8 lg:px-12">
          <a
            href={homeHref}
            className={cn(
              'flex shrink-0 flex-col leading-none transition-colors duration-500',
              solid ? 'text-site-ink' : 'text-white',
            )}
            aria-label={`${brand?.name ?? 'Dynamic Production'} — home`}
          >
            <span className="font-serif text-2xl font-light tracking-[0.02em]">
              {brand?.monogram ?? 'DP'}
            </span>
            <span className="mt-1 text-[0.5rem] font-medium uppercase tracking-[0.32em] opacity-80">
              {brand?.name ?? 'Dynamic Production'}
            </span>
          </a>

          <nav aria-label="Primary" className="hidden lg:block">
            <ul className="flex items-center gap-9">
              {navLinks.map((link) => {
                const isActive = activeId === link.id;
                return (
                  <li key={link.id}>
                    <a
                      href={sectionHref(link.id)}
                      aria-current={isActive ? 'true' : undefined}
                      className={cn(
                        'relative py-2 text-site-eyebrow font-medium uppercase transition-colors duration-300',
                        'after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left after:scale-x-0',
                        'after:bg-current after:transition-transform after:duration-300 after:ease-smooth',
                        'hover:after:scale-x-100 focus-visible:outline-none focus-visible:after:scale-x-100',
                        isActive && 'after:scale-x-100',
                        solid
                          ? cn('text-site-ink/70 hover:text-site-ink', isActive && 'text-site-ink')
                          : cn('text-white/75 hover:text-white', isActive && 'text-white'),
                      )}
                    >
                      {link.label}
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="flex items-center gap-3">
            <a
              href={sectionHref('contact')}
              className={cn(
                'hidden shrink-0 px-6 py-3 text-site-eyebrow font-medium uppercase transition-colors duration-300 sm:inline-block',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-accent focus-visible:ring-offset-2',
                solid
                  ? 'bg-site-ink text-white hover:bg-site-ink-soft'
                  : 'bg-site-sand text-site-ink hover:bg-white',
              )}
            >
              {enquiryLabel}
            </a>

            <button
              ref={toggleRef}
              type="button"
              onClick={() => setOpen((value) => !value)}
              aria-expanded={open}
              aria-controls="site-mobile-nav"
              aria-label={open ? 'Close menu' : 'Open menu'}
              className={cn(
                'grid h-11 w-11 place-items-center transition-colors duration-300 lg:hidden',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-accent',
                solid ? 'text-site-ink' : 'text-white',
              )}
            >
              {open ? <X className="h-5 w-5" strokeWidth={1.5} /> : <Menu className="h-5 w-5" strokeWidth={1.5} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      <div
        id="site-mobile-nav"
        ref={panelRef}
        hidden={!open}
        className="fixed inset-0 z-40 bg-site-paper lg:hidden"
      >
        <nav
          aria-label="Primary mobile"
          className="flex h-full flex-col justify-center overflow-y-auto px-8 pb-[max(2rem,env(safe-area-inset-bottom))] pt-24"
        >
          <ul className="space-y-1">
            {navLinks.map((link) => (
              <li key={link.id}>
                <a
                  href={sectionHref(link.id)}
                  onClick={() => setOpen(false)}
                  className="block border-b border-site-line py-5 font-serif text-3xl font-light text-site-ink"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          <a
            href={sectionHref('contact')}
            onClick={() => setOpen(false)}
            className="mt-10 inline-block bg-site-ink px-8 py-4 text-center text-site-eyebrow font-medium uppercase text-white"
          >
            {enquiryLabel}
          </a>
        </nav>
      </div>
    </>
  );
};
