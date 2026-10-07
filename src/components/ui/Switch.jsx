import { forwardRef, useId } from 'react';
import { cn } from '@/utils/cn';

/**
 * Accessible toggle built on a visually-hidden checkbox so it works inside
 * forms and with React Hook Form's `register`.
 *
 * The track and knob are rendered as *siblings* of the input — Tailwind's
 * `peer-*` variants use the general sibling combinator, which cannot reach
 * nested elements.
 */
export const Switch = forwardRef(function Switch(
  { label, description, className, id: idProp, ...props },
  ref,
) {
  const generatedId = useId();
  const id = idProp ?? generatedId;

  return (
    <div className={cn('flex items-start gap-3', className)}>
      <span className="relative mt-0.5 inline-flex h-5.5 w-9.5 shrink-0">
        <input ref={ref} id={id} type="checkbox" role="switch" className="peer sr-only" {...props} />

        <label
          htmlFor={id}
          className={cn(
            'absolute inset-0 cursor-pointer rounded-full bg-ink-300 transition-colors duration-200 ease-smooth',
            'peer-checked:bg-brand-500',
            'peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
            'peer-focus-visible:ring-2 peer-focus-visible:ring-brand-500/40 peer-focus-visible:ring-offset-2',
          )}
        />

        <span
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute left-0.5 top-0.5 h-4.5 w-4.5 rounded-full bg-white shadow-sm',
            'transition-transform duration-200 ease-smooth peer-checked:translate-x-4',
          )}
        />
      </span>

      {(label || description) && (
        <label htmlFor={id} className="cursor-pointer select-none">
          {label && <span className="block text-sm font-medium text-ink-800">{label}</span>}
          {description && <span className="mt-0.5 block text-xs text-ink-500">{description}</span>}
        </label>
      )}
    </div>
  );
});
