import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/utils/cn';

const VIEWPORT_MARGIN = 8;
const TRIGGER_GAP = 8;

/**
 * Lightweight popover menu anchored to a trigger.
 * `trigger` receives `{ open, toggle, close }` so callers can render any control.
 *
 * The menu is rendered in a portal on `document.body` and positioned with
 * `position: fixed`. Anchoring it in-flow meant any ancestor that scrolls or
 * clips (the DataTable's `overflow-x-auto` wrapper, cards with rounded
 * corners, the sidebar nav) cut the menu off — note that `overflow-x: auto`
 * forces the used value of `overflow-y: visible` to `auto`, so a table row's
 * menu could never escape the scroll box. Portalling sidesteps clipping and
 * z-index stacking contexts entirely.
 */
export const Dropdown = ({ trigger, children, align = 'right', className, menuClassName }) => {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState(null);
  const containerRef = useRef(null);
  const menuRef = useRef(null);

  const close = useCallback(() => setOpen(false), []);

  const updatePosition = useCallback(() => {
    const anchor = containerRef.current;
    const menu = menuRef.current;
    if (!anchor || !menu) return;

    const rect = anchor.getBoundingClientRect();
    const { innerWidth: vw, innerHeight: vh } = window;

    // Measure the menu at its natural size so the flip decision is honest.
    // `scrollHeight` ignores the max-height we may have applied on a previous
    // pass, and neither value is affected by framer-motion's scale transform.
    const menuWidth = menu.offsetWidth;
    const menuHeight = menu.scrollHeight;

    const spaceBelow = vh - rect.bottom - TRIGGER_GAP - VIEWPORT_MARGIN;
    const spaceAbove = rect.top - TRIGGER_GAP - VIEWPORT_MARGIN;
    const placeAbove = menuHeight > spaceBelow && spaceAbove > spaceBelow;

    const maxHeight = Math.max(120, placeAbove ? spaceAbove : spaceBelow);
    const height = Math.min(menuHeight, maxHeight);

    let top = placeAbove ? rect.top - TRIGGER_GAP - height : rect.bottom + TRIGGER_GAP;
    // A trigger pinned to the very bottom (or top) of the viewport leaves less
    // room than the menu's floor height, so nudge it back on screen.
    top = Math.min(top, vh - height - VIEWPORT_MARGIN);
    top = Math.max(VIEWPORT_MARGIN, top);

    let left = align === 'right' ? rect.right - menuWidth : rect.left;
    left = Math.min(left, vw - menuWidth - VIEWPORT_MARGIN);
    left = Math.max(VIEWPORT_MARGIN, left);

    setPosition({ top, left, maxHeight, placeAbove });
  }, [align]);

  // Position before the first paint so the menu never flashes at the origin.
  useLayoutEffect(() => {
    if (!open) {
      setPosition(null);
      return undefined;
    }
    updatePosition();

    let frame = null;
    const schedule = () => {
      if (frame !== null) return;
      frame = requestAnimationFrame(() => {
        frame = null;
        updatePosition();
      });
    };

    // `capture` catches scrolling of any ancestor, not just the window.
    window.addEventListener('scroll', schedule, true);
    window.addEventListener('resize', schedule);

    const observer =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(schedule) : null;
    if (observer && menuRef.current) observer.observe(menuRef.current);

    return () => {
      if (frame !== null) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule, true);
      window.removeEventListener('resize', schedule);
      observer?.disconnect();
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return undefined;

    const onPointerDown = (event) => {
      const inTrigger = containerRef.current?.contains(event.target);
      const inMenu = menuRef.current?.contains(event.target);
      if (!inTrigger && !inMenu) setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const menu = (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, scale: 0.96, y: -4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: -2 }}
          transition={{ duration: 0.14, ease: [0.32, 0.72, 0, 1] }}
          role="menu"
          // Clicking any item closes the menu, so callers don't have to.
          // The portal keeps React's event tree intact, so stop the click from
          // reaching row-level handlers behind the trigger.
          onClick={(event) => {
            event.stopPropagation();
            close();
          }}
          style={{
            position: 'fixed',
            top: position?.top ?? 0,
            left: position?.left ?? 0,
            maxHeight: position?.maxHeight,
            visibility: position ? 'visible' : 'hidden',
          }}
          className={cn(
            'scrollbar-slim z-[60] min-w-52 overflow-y-auto rounded-xl bg-white p-1.5 shadow-popover',
            position?.placeAbove ? 'origin-bottom' : 'origin-top',
            menuClassName,
          )}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {trigger({ open, toggle: () => setOpen((value) => !value), close })}
      {typeof document !== 'undefined' ? createPortal(menu, document.body) : null}
    </div>
  );
};

export const DropdownItem = ({
  icon: Icon,
  danger = false,
  className,
  children,
  as: Component = 'button',
  ...props
}) => (
  <Component
    role="menuitem"
    type={Component === 'button' ? 'button' : undefined}
    className={cn(
      'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-base font-medium transition-colors',
      'disabled:pointer-events-none disabled:opacity-50',
      danger
        ? 'text-danger-600 hover:bg-danger-50'
        : 'text-ink-700 hover:bg-ink-100 hover:text-ink-900',
      className,
    )}
    {...props}
  >
    {Icon && <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />}
    <span className="truncate">{children}</span>
  </Component>
);

export const DropdownLabel = ({ children }) => (
  <p className="px-2.5 pb-1 pt-2 text-2xs font-semibold uppercase tracking-wider text-ink-400">
    {children}
  </p>
);

export const DropdownDivider = () => <div className="my-1.5 h-px bg-ink-200/70" />;
