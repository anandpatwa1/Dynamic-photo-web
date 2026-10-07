import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/utils/cn';
import { SmoothImage } from '../components/SmoothImage';
import { SiteButton } from '../components/SiteButton';
import { useSection } from '../content/SiteContent';

const AUTOPLAY_MS = 6500;

/** True on phones and small tablets, where portrait artwork fits better. */
const usePhoneScreen = () => {
  const query = '(max-width: 767px)';
  const [matches, setMatches] = useState(() => window.matchMedia?.(query).matches ?? false);

  useEffect(() => {
    const media = window.matchMedia?.(query);
    if (!media) return undefined;
    const onChange = (event) => setMatches(event.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  return matches;
};

export const Hero = () => {
  const hero = useSection('hero');
  const phone = usePhoneScreen();
  // The studio can upload separate portrait slides for phones; without them the
  // desktop slides are used, as before.
  const chosen = phone && hero?.slidesMobile?.length ? hero.slidesMobile : hero?.slides;
  // Slides are processed assets straight from the CMS. Before any upload the
  // array is empty, so fall back to one blank panel rather than rendering
  // nothing — the headline still needs a ground to sit on.
  const slides = chosen?.length ? chosen : [null];
  const [rawIndex, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touch = useRef(null);
  // Switching between the phone and desktop sets can leave the index past the end.
  const index = Math.min(rawIndex, slides.length - 1);

  const go = useCallback(
    (next) => setIndex((current) => (next + slides.length) % slides.length),
    [slides.length],
  );

  // Autoplay, but never against the reader: it pauses on hover/focus, and is
  // switched off entirely for anyone who asked for reduced motion.
  useEffect(() => {
    if (paused || slides.length < 2) return undefined;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;

    const timer = setInterval(() => go(index + 1), AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [index, paused, slides.length, go]);

  return (
    <section
      id="hero"
      aria-label="Introduction"
      className="relative isolate flex min-h-[100svh] flex-col justify-center overflow-hidden bg-site-ink"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onTouchStart={(event) => {
        touch.current = { x: event.touches[0].clientX, y: event.touches[0].clientY };
      }}
      onTouchEnd={(event) => {
        const start = touch.current;
        touch.current = null;
        if (!start || slides.length < 2) return;
        const dx = event.changedTouches[0].clientX - start.x;
        const dy = event.changedTouches[0].clientY - start.y;
        // Only a clearly horizontal swipe changes the slide; vertical drags scroll the page.
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) go(index + (dx < 0 ? 1 : -1));
      }}
    >
      {/* Slides. Only the active one is exposed to assistive tech. */}
      <div className="absolute inset-0 -z-10">
        {slides.map((slide, i) => (
          <div
            key={i}
            aria-hidden={i !== index}
            className={cn(
              'absolute inset-0 transition-opacity duration-[1200ms] ease-smooth',
              i === index ? 'opacity-100' : 'opacity-0',
            )}
          >
            <SmoothImage
              asset={slide}
              // Only the visible slide is described; the others are hidden from
              // assistive tech, so announcing their alt text would be noise.
              alt={i === index ? undefined : ''}
              ratio="auto"
              priority={i === 0}
              sizes="100vw"
              bare
              className="h-full w-full"
            />
          </div>
        ))}

        {/*
          Two overlays, not one. A flat scrim would grey the photograph out; a
          left-weighted gradient plus a gentle vignette keeps the image rich
          while still guaranteeing contrast under the headline.
        */}
        <div className="absolute inset-0 bg-gradient-to-r from-site-ink/92 via-site-ink/65 to-site-ink/25" />
        <div className="absolute inset-0 bg-gradient-to-t from-site-ink/80 via-transparent to-site-ink/45" />
      </div>

      <div className="mx-auto flex w-full max-w-8xl flex-1 flex-col justify-center px-5 pb-28 pt-32 sm:px-8 lg:px-12">
        <div className="flex w-full items-center justify-between gap-10">
          <div className="max-w-3xl">
            <p className="site-enter text-site-eyebrow font-medium uppercase text-white/75">
              {hero?.eyebrow}
            </p>

            <h1 className="mt-6 font-serif font-light text-white text-site-hero">
              <span className="site-enter block" style={{ animationDelay: '120ms' }}>
                {hero?.title}
              </span>
              {hero?.titleScript && (
                <span
                  className="site-enter mt-1 block font-script text-[0.62em] font-normal leading-[1.1] text-white/95"
                  style={{ animationDelay: '260ms' }}
                >
                  {hero.titleScript}
                </span>
              )}
            </h1>

            <p
              className="site-enter mt-8 max-w-md text-site-eyebrow font-medium uppercase leading-relaxed text-white/85"
              style={{ animationDelay: '400ms' }}
            >
              {hero?.subtitle}
            </p>

            <div className="site-enter mt-10" style={{ animationDelay: '520ms' }}>
              <SiteButton href={hero?.ctaHref ?? '#portfolio'} variant="outline">
                {hero?.ctaLabel ?? 'View Our Work'}
              </SiteButton>
            </div>
          </div>

          {/* Pillars — hidden below xl where the headline needs the full width. */}
          {hero?.pillars?.length > 0 && (
            <ul
              className="site-enter hidden shrink-0 space-y-5 border-l border-white/25 pl-7 xl:block"
              style={{ animationDelay: '640ms' }}
            >
              {hero.pillars.map((pillar) => (
                <li key={pillar} className="text-site-eyebrow font-medium uppercase text-white/80">
                  {pillar}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Slide controls */}
      {slides.length > 1 && (
        <div className="absolute inset-x-0 bottom-0 z-10">
          <div className="mx-auto flex max-w-8xl items-center justify-between px-5 pb-10 sm:px-8 lg:px-12">
            <p className="flex items-center gap-4 text-site-eyebrow tabular-nums text-white/70">
              <span className="text-white">{String(index + 1).padStart(2, '0')}</span>
              <span aria-hidden="true" className="h-px w-12 bg-white/35 sm:w-20" />
              <span>{String(slides.length).padStart(2, '0')}</span>
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => go(index - 1)}
                aria-label="Previous slide"
                className="grid h-11 w-11 place-items-center rounded-full border border-white/35 text-white transition-colors duration-300 hover:border-white hover:bg-white hover:text-site-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
              </button>
              <button
                type="button"
                onClick={() => go(index + 1)}
                aria-label="Next slide"
                className="grid h-11 w-11 place-items-center rounded-full border border-white/35 text-white transition-colors duration-300 hover:border-white hover:bg-white hover:text-site-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
