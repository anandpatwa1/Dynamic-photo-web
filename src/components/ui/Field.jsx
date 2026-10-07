import { useId } from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/utils/cn';

/** Base control styling shared by Input, Textarea and Select. */
export const controlClasses = ({ hasError, hasLeftIcon, hasRightIcon } = {}) =>
  cn(
    'block w-full rounded-xl bg-white text-base text-ink-900 shadow-xs',
    'ring-1 ring-inset ring-ink-200 placeholder:text-ink-400',
    'transition-all duration-150 ease-smooth',
    'focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-500',
    'disabled:cursor-not-allowed disabled:bg-ink-100 disabled:text-ink-500',
    'read-only:bg-ink-50',
    hasError && 'ring-danger-300 focus:ring-danger-500',
    hasLeftIcon ? 'pl-10' : 'pl-3.5',
    hasRightIcon ? 'pr-10' : 'pr-3.5',
  );

/**
 * Label + control + help/error wrapper. Wires up `htmlFor`, `aria-describedby`
 * and `aria-invalid` from one place so every form field is accessible by default.
 */
export const Field = ({
  label,
  hint,
  error,
  required = false,
  optional = false,
  htmlFor,
  className,
  labelClassName,
  children,
}) => {
  const generatedId = useId();
  const id = htmlFor ?? generatedId;
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <div className="mb-1.5 flex items-baseline justify-between gap-2">
          <label htmlFor={id} className={cn('text-sm font-medium text-ink-700', labelClassName)}>
            {label}
            {required && (
              <span className="ml-0.5 text-danger-500" aria-hidden="true">
                *
              </span>
            )}
          </label>
          {optional && <span className="text-xs text-ink-400">Optional</span>}
        </div>
      )}

      {typeof children === 'function'
        ? children({ id, describedBy, hasError: Boolean(error) })
        : children}

      {error ? (
        <p id={`${id}-error`} className="mt-1.5 flex items-start gap-1.5 text-xs text-danger-600">
          <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="mt-1.5 text-xs text-ink-500">
            {hint}
          </p>
        )
      )}
    </div>
  );
};
