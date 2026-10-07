import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

const SWIPE_DISTANCE = 50;

/**
 * Full-screen photo viewer.
 *
 * Opens when `index` is a number and closes when it is null. Works with the
 * keyboard (Esc, arrows, Tab stays inside), with touch (swipe left/right) and
 * with a plain tap on the dark backdrop, and puts focus back on whatever
 * opened it. The page behind cannot scroll while it is open.
 */
export const Lightbox = ({ images, index, onClose, onIndexChange }) => {
  const open = typeof index === 'number' && images?.length > 0;
  const count = images?.length ?? 0;
  const image = open ? images[index] : null;

  const closeRef = useRef(null);
  const prevRef = useRef(null);
  const nextRef = useRef(null);
  const opener = useRef(null);
  const touch = useRef(null);
  const [loaded, setLoaded] = useState(false);

  const go = useCallback(
    (step) => {
      if (count > 1) onIndexChange((index + step + count) % count);
    },
    [count, index, onIndexChange],
  );

  // Scroll lock and focus hand-off.
  useEffect(() => {
    if (!open) return undefined;
    opener.current = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      opener.current?.focus?.();
    };
  }, [open]);

  // Keyboard.
  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
      else if (event.key === 'ArrowLeft') go(-1);
      else if (event.key === 'ArrowRight') go(1);
      else if (event.key === 'Tab') {
        const stops = [closeRef.current, prevRef.current, nextRef.current].filter(Boolean);
        const at = stops.indexOf(document.activeElement);
        event.preventDefault();
        const next = event.shiftKey ? at - 1 : at + 1;
        stops[(next + stops.length) % stops.length]?.focus();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, go, onClose]);

  // A new photo starts on the spinner; its neighbours download in advance.
  useEffect(() => {
    if (!open) return;
    setLoaded(false);
    [index - 1, index + 1].forEach((neighbour) => {
      const target = images[(neighbour + count) % count];
      if (target?.url) new Image().src = target.url;
    });
  }, [open, index, images, count]);

  if (!open || !image) return null;

  const onTouchStart = (event) => {
    const point = event.touches[0];
    touch.current = { x: point.clientX, y: point.clientY };
  };

  const onTouchEnd = (event) => {
    if (!touch.current) return;
    const point = event.changedTouches[0];
    const dx = point.clientX - touch.current.x;
    const dy = point.clientY - touch.current.y;
    touch.current = null;
    // A mostly-horizontal drag is a swipe; anything else is a scroll or pinch.
    if (Math.abs(dx) > SWIPE_DISTANCE && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx < 0 ? 1 : -1);
  };

  const stop = (event) => event.stopPropagation();

  const button =
    'grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white';

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Photo viewer"
      className="fixed inset-0 z-[100] flex flex-col bg-black/95"
      onClick={onClose}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="flex items-center justify-between px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-6">
        <span className="text-sm tracking-widest text-white/70" aria-live="polite">
          {count > 1 ? `${index + 1} / ${count}` : ''}
        </span>
        <button ref={closeRef} type="button" onClick={onClose} className={button} aria-label="Close photo viewer">
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 sm:px-20">
        {!loaded && (
          <span
            className="absolute h-8 w-8 animate-spin rounded-full border-2 border-white/25 border-t-white"
            aria-hidden="true"
          />
        )}

        <img
          key={image.url}
          src={image.url}
          srcSet={image.srcSet}
          sizes="100vw"
          alt={image.alt || ''}
          onLoad={() => setLoaded(true)}
          onClick={stop}
          draggable={false}
          className={`max-h-full max-w-full select-none object-contain transition-opacity duration-300 ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {count > 1 && (
          <>
            <button
              ref={prevRef}
              type="button"
              onClick={(event) => {
                stop(event);
                go(-1);
              }}
              className={`${button} absolute left-2 top-1/2 -translate-y-1/2 sm:left-5`}
              aria-label="Previous photo"
            >
              <ChevronLeft className="h-6 w-6" aria-hidden="true" />
            </button>
            <button
              ref={nextRef}
              type="button"
              onClick={(event) => {
                stop(event);
                go(1);
              }}
              className={`${button} absolute right-2 top-1/2 -translate-y-1/2 sm:right-5`}
              aria-label="Next photo"
            >
              <ChevronRight className="h-6 w-6" aria-hidden="true" />
            </button>
          </>
        )}
      </div>

      <div className="min-h-[1.5rem] px-6 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 text-center text-sm text-white/60">
        {image.alt}
      </div>
    </div>,
    document.body,
  );
};

export default Lightbox;
