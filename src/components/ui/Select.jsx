import { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Field, controlClasses } from './Field';

/**
 * Native select styled to match the design system. Options accept either
 * `{ value, label }` objects or plain strings.
 */
export const Select = forwardRef(function Select(
  {
    label,
    hint,
    error,
    required,
    optional,
    options = [],
    placeholder,
    className,
    wrapperClassName,
    id: idProp,
    children,
    ...props
  },
  ref,
) {
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
          <select
            ref={ref}
            id={id}
            aria-invalid={hasError || undefined}
            aria-describedby={describedBy}
            className={cn(
              controlClasses({ hasError, hasRightIcon: true }),
              'h-10 cursor-pointer appearance-none',
              className,
            )}
            {...props}
          >
            {placeholder && (
              <option value="">{placeholder}</option>
            )}
            {children ??
              options.map((option) => {
                const value = typeof option === 'string' ? option : option.value;
                const text = typeof option === 'string' ? option : option.label;
                return (
                  <option key={value} value={value} disabled={option.disabled}>
                    {text}
                  </option>
                );
              })}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
            aria-hidden="true"
          />
        </div>
      )}
    </Field>
  );
});
