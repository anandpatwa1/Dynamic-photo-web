import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Button } from './Button';

const SIZES = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  '2xl': 'max-w-6xl',
};

/**
 * Centered dialog rendered in a portal. Closes on Escape and backdrop click
 * (both suppressible), and locks body scroll while open.
 */
export const Modal = ({
  open,
  onClose,
  title,
  description,
  size = 'md',
  footer,
  children,
  closeOnBackdrop = true,
  showClose = true,
  className,
}) => {
  const panelRef = useRef(null);

  /**
   * `onClose` is read through a ref so the focus effect below can depend on
   * `open` alone.
   *
   * Callers almost always pass an inline arrow, which is a new reference on
   * every render. With `onClose` in the dependency array, any re-render of the
   * parent — including one per keystroke in a controlled form — tore the effect
   * down and set it up again. The teardown restores focus to whatever was
   * focused before the dialog opened, so typing a single character threw the
   * cursor out of the field. Keeping the callback in a ref makes the dialog
   * immune to how the caller declares it.
   */
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return undefined;

    // Remember where focus came from so it can be handed back on close —
    // otherwise focus falls to the top of the document and keyboard users
    // lose their place in the list they opened the dialog from.
    const previouslyFocused = document.activeElement;

    const focusable = () =>
      Array.from(
        panelRef.current?.querySelectorAll(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      ).filter((element) => element.offsetParent !== null);

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        onCloseRef.current?.();
        return;
      }
      if (event.key !== 'Tab') return;

      // Trap Tab inside the dialog by wrapping at either end.
      const elements = focusable();
      if (elements.length === 0) {
        event.preventDefault();
        return;
      }

      const first = elements[0];
      const last = elements[elements.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Move focus into the dialog once it has mounted.
    const timer = setTimeout(() => {
      const [firstElement] = focusable();
      (firstElement ?? panelRef.current)?.focus();
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
    // Only `open` — see the note on onCloseRef above.
  }, [open]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            className="absolute inset-0 bg-ink-950/30 backdrop-blur-[2px]"
            onClick={closeOnBackdrop ? onClose : undefined}
            aria-hidden="true"
          />

          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={typeof title === 'string' ? title : undefined}
            tabIndex={-1}
            initial={{ opacity: 0, scale: 0.98, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 8 }}
            transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
            className={cn(
              'relative flex max-h-[92vh] w-full flex-col overflow-hidden bg-white shadow-2xl',
              'rounded-t-3xl sm:rounded-2xl',
              SIZES[size],
              className,
            )}
          >
            {(title || showClose) && (
              <header className="flex items-start justify-between gap-4 border-b border-ink-200/70 px-4 py-4 sm:px-6 sm:py-5">
                <div className="min-w-0">
                  {title && <h2 className="text-lg font-semibold text-ink-900">{title}</h2>}
                  {description && <p className="mt-1 text-sm text-ink-500">{description}</p>}
                </div>
                {showClose && (
                  <Button
                    variant="ghost"
                    size="sm"
                    iconOnly
                    icon={X}
                    onClick={onClose}
                    aria-label="Close dialog"
                    className="-mr-1.5 -mt-0.5 shrink-0"
                  />
                )}
              </header>
            )}

            <div className="scrollbar-slim flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">{children}</div>

            {footer && (
              <footer className="flex flex-wrap items-center justify-end gap-3 border-t border-ink-200/70 bg-ink-50/60 px-4 py-3.5 sm:px-6 sm:py-4">
                {footer}
              </footer>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
};
