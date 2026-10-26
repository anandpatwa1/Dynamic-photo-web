import { useCallback, useEffect, useRef, useState } from 'react';
import { GripVertical } from 'lucide-react';
import { cn } from '@/utils/cn';

/**
 * Drag-and-drop reordering built on the native HTML5 drag events.
 *
 * No dnd library: the CRM does not bundle one, and adding ~30 kB for a handful
 * of admin grids is not a trade worth making. The native API is enough here
 * because the items are a flat list with no cross-container moves.
 *
 * The important part is that it does not *only* work with a mouse. Each item is
 * also focusable and reorderable with the arrow keys, which the drag events
 * alone would not give — a drag-only implementation is unusable for anyone on a
 * keyboard, and this is a required admin task, not a nicety.
 */
export const SortableGrid = ({
  items,
  getKey,
  onReorder,
  renderItem,
  className,
  itemClassName,
  disabled = false,
}) => {
  const [order, setOrder] = useState(items);
  const dragIndex = useRef(null);
  const [overIndex, setOverIndex] = useState(null);

  // Keep local order in step when the parent refetches.
  useEffect(() => setOrder(items), [items]);

  const commit = useCallback(
    (next) => {
      setOrder(next);
      onReorder(next.map(getKey));
    },
    [getKey, onReorder],
  );

  const move = useCallback(
    (from, to) => {
      if (to < 0 || to >= order.length || from === to) return;
      const next = [...order];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      commit(next);
    },
    [order, commit],
  );

  const onKeyDown = (event, index) => {
    // Modifier-less arrows still scroll the page; require a modifier so the
    // grid does not hijack normal navigation.
    if (!event.altKey) return;

    const delta =
      event.key === 'ArrowLeft' || event.key === 'ArrowUp'
        ? -1
        : event.key === 'ArrowRight' || event.key === 'ArrowDown'
          ? 1
          : 0;

    if (!delta) return;
    event.preventDefault();
    move(index, index + delta);

    // Follow the item so repeated presses keep moving the same thing.
    const selector = `[data-sortable-index="${index + delta}"]`;
    requestAnimationFrame(() => document.querySelector(selector)?.focus());
  };

  return (
    <ul className={className}>
      {order.map((item, index) => (
        <li
          key={getKey(item)}
          data-sortable-index={index}
          tabIndex={disabled ? -1 : 0}
          draggable={!disabled}
          aria-label={`Item ${index + 1} of ${order.length}. Hold Alt and press the arrow keys to reorder.`}
          onDragStart={() => {
            dragIndex.current = index;
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setOverIndex(index);
          }}
          onDragLeave={() => setOverIndex(null)}
          onDrop={(event) => {
            event.preventDefault();
            setOverIndex(null);
            if (dragIndex.current !== null) move(dragIndex.current, index);
            dragIndex.current = null;
          }}
          onDragEnd={() => {
            dragIndex.current = null;
            setOverIndex(null);
          }}
          onKeyDown={(event) => onKeyDown(event, index)}
          className={cn(
            'group/sortable relative rounded-2xl transition-shadow',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
            overIndex === index && 'ring-2 ring-brand-500',
            !disabled && 'cursor-grab active:cursor-grabbing',
            itemClassName,
          )}
        >
          {!disabled && (
            <span
              aria-hidden="true"
              className="absolute left-2 top-2 z-10 grid h-7 w-7 place-items-center rounded-lg bg-white/90 text-ink-500 opacity-0 shadow-sm transition-opacity group-hover/sortable:opacity-100"
            >
              <GripVertical className="h-3.5 w-3.5" />
            </span>
          )}
          {renderItem(item, index)}
        </li>
      ))}
    </ul>
  );
};
