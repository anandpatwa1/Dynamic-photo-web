import { useEffect, useRef, useState } from 'react';
import { Camera } from 'lucide-react';
import { cn } from '@/utils/cn';

/*
 * Google Drive answers a burst of photo requests with an error page, which
 * Chrome then blocks (it shows up as a red "(failed)" row in the Network tab)
 * and the photo stays on its blurred placeholder. A portfolio gallery asks for
 * dozens at once, so remote images go through a small queue instead: only a
 * few are in flight at any moment, and the rest wait their turn.
 */
const MAX_PARALLEL_REMOTE = 3;
let activeRemote = 0;
const waitingRemote = [];

const acquireSlot = () =>
  new Promise((resolve) => {
    if (activeRemote < MAX_PARALLEL_REMOTE) {
      activeRemote += 1;
      resolve();
    } else {
      waitingRemote.push(resolve);
    }
  });

const releaseSlot = () => {
  const next = waitingRemote.shift();
  if (next) next();
  else activeRemote -= 1;
};

const isRemoteHost = (url) => /googleusercontent\.com|drive\.google\.com/.test(url ?? '');

/**
 * The site's only image primitive.
 *
 * Three jobs:
 *  1. Reserve the box before the pixels land. Every caller passes a `ratio`, so
 *     the layout never reflows on load — the single biggest CLS source on an
 *     image-led page.
 *  2. Fade in from the stored LQIP rather than snapping, which is what makes
 *     loading read as "considered" instead of "slow".
 *  3. Degrade gracefully when there is no image yet. Photography arrives via
 *     Website Management; until an admin uploads, this draws a tonal placeholder
 *     in the brand palette rather than a broken-image glyph.
 *
 * `alt` is required by the caller in the same way it is required by the Asset
 * schema — an image nobody described is an accessibility bug, not a shortcut.
 */
export const SmoothImage = ({
  /**
   * A processed asset from the CMS — `{ url, alt, srcSet, placeholder }`.
   * Preferred over the individual props, which remain for callers that only
   * have a bare URL. Taking the whole object keeps the unpacking in one place
   * instead of at every call site.
   */
  asset,
  src: srcProp,
  alt: altProp,
  ratio = '3 / 4',
  className,
  imgClassName,
  placeholder: placeholderProp,
  priority = false,
  sizes = '100vw',
  srcSet: srcSetProp,
  // Full-bleed backgrounds carry text on top, where a centred placeholder glyph
  // lands over the headline. Those callers opt out of the icon and keep the tone.
  bare = false,
  children,
}) => {
  const [loaded, setLoaded] = useState(false);

  const src = asset?.url ?? srcProp;
  const srcSet = asset?.srcSet ?? srcSetProp;
  const placeholder = asset?.placeholder ?? placeholderProp;
  // An explicit `alt` still wins, so a caller can override the stored text for
  // context — a gallery thumbnail beside its own caption, for instance.
  const alt = altProp ?? asset?.alt ?? '';

  /*
   * Remote (Google Drive) photos: wait until the tile is near the viewport,
   * then wait for a free download slot. Failures are retried after a short,
   * growing delay, because the first burst of requests is what gets refused.
   * Local/Cloudinary images and `priority` images skip all of this.
   */
  const gated = isRemoteHost(src) && !priority;
  const wrapRef = useRef(null);
  const holding = useRef(false);
  const retryTimer = useRef(null);
  const [visible, setVisible] = useState(!gated);
  const [ready, setReady] = useState(!gated);
  const [attempt, setAttempt] = useState(0);
  const MAX_RETRIES = 4;

  const freeSlot = () => {
    if (holding.current) {
      holding.current = false;
      releaseSlot();
    }
  };

  useEffect(() => {
    if (!gated || visible) return undefined;
    const node = wrapRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return undefined;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [gated, visible]);

  useEffect(() => {
    if (!gated || !visible || !src) return undefined;
    let cancelled = false;
    setReady(false);
    acquireSlot().then(() => {
      if (cancelled) {
        releaseSlot();
        return;
      }
      holding.current = true;
      setReady(true);
    });
    return () => {
      cancelled = true;
      freeSlot();
    };
  }, [gated, visible, src, attempt]);

  useEffect(() => () => clearTimeout(retryTimer.current), []);

  const handleLoad = () => {
    setLoaded(true);
    freeSlot();
  };

  const handleError = () => {
    freeSlot();
    if (attempt >= MAX_RETRIES) return;
    const delay = 1500 * 2 ** attempt + Math.random() * 1000;
    retryTimer.current = setTimeout(() => setAttempt((n) => n + 1), delay);
  };

  return (
    <div
      ref={wrapRef}
      className={cn('relative overflow-hidden bg-site-paper-alt', className)}
      style={{ aspectRatio: ratio }}
    >
      {src ? (
        <>
          {placeholder && !loaded && (
            <img
              src={placeholder}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full scale-105 object-cover blur-xl"
            />
          )}
          {ready && (
          <img
            key={attempt}
            src={src}
            srcSet={srcSet}
            sizes={sizes}
            alt={alt}
            // The hero image is the LCP element; everything else waits its turn.
            loading={priority || gated ? 'eager' : 'lazy'}
            /*
             * Lowercase deliberately. React 18 does not know the camelCase
             * `fetchPriority` prop — it warns and drops the attribute entirely,
             * so the priority hint on the LCP image silently does nothing.
             * React 19 adds the camelCase form; until then this is the spelling
             * that actually reaches the DOM.
             */
            fetchpriority={priority ? 'high' : undefined}
            decoding="async"
            onLoad={handleLoad}
            onError={handleError}
            className={cn(
              'absolute inset-0 h-full w-full object-cover',
              'transition-opacity duration-700 ease-smooth',
              loaded ? 'opacity-100' : 'opacity-0',
              imgClassName,
            )}
          />
          )}
        </>
      ) : (
        // No upload yet. Keep the composition legible so layout review is still
        // possible, and label it for screen readers as decorative-empty.
        <div
          role="img"
          aria-label={alt || 'Photograph coming soon'}
          className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-site-paper-alt via-site-sand/40 to-site-sand-deep/50"
        >
          {!bare && (
            <Camera className="h-7 w-7 text-site-accent/35" aria-hidden="true" strokeWidth={1.25} />
          )}
        </div>
      )}

      {children}
    </div>
  );
};
