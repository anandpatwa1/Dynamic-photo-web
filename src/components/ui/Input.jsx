import { forwardRef } from 'react';
import { cn } from '@/utils/cn';
import { Field, controlClasses } from './Field';

/**
 * Text input with optional leading icon, trailing adornment and prefix.
 * Pass `error` (a message string) to render the invalid state and message.
 */
export const Input = forwardRef(function Input(
  {
    label,
    hint,
    error,
    required,
    optional,
    icon: Icon,
    prefix,
    suffix,
    trailing,
    className,
    wrapperClassName,
    id: idProp,
    ...props
  },
  ref,
) {
  const hasLeft = Boolean(Icon || prefix);
  const hasRight = Boolean(trailing || suffix);

  return (
    <Field
      label={label}
      hint={hint}
      error={error}
      required={required}
      optional={optional}
      htmlFor={idProp}
      className={wrapperClassName}
    >
      {({ id, describedBy, hasError }) => (
        <div className="relative">
          {Icon && (
            <Icon
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
              aria-hidden="true"
            />
          )}
          {prefix && !Icon && (
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-base text-ink-500">
              {prefix}
            </span>
          )}

          <input
            ref={ref}
            id={id}
            aria-invalid={hasError || undefined}
            aria-describedby={describedBy}
            className={cn(
              controlClasses({ hasError, hasLeftIcon: hasLeft, hasRightIcon: hasRight }),
              'h-10',
              prefix && !Icon && 'pl-8',
              className,
            )}
            {...props}
          />

          {suffix && !trailing && (
            <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-ink-500">
              {suffix}
            </span>
          )}
          {trailing && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2">{trailing}</div>
          )}
        </div>
      )}
    </Field>
  );
});

/** Right-aligned, tabular-figure input for money and quantity columns. */
export const NumberInput = forwardRef(function NumberInput({ className, ...props }, ref) {
  return (
    <Input
      ref={ref}
      type="number"
      inputMode="decimal"
      step="0.01"
      className={cn('tabular text-right', className)}
      {...props}
    />
  );
});
