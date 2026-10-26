import { forwardRef } from 'react';
import { cn } from '@/utils/cn';
import { Field, controlClasses } from './Field';

export const Textarea = forwardRef(function Textarea(
  { label, hint, error, required, optional, rows = 4, className, wrapperClassName, id: idProp, ...props },
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
        <textarea
          ref={ref}
          id={id}
          rows={rows}
          aria-invalid={hasError || undefined}
          aria-describedby={describedBy}
          className={cn(controlClasses({ hasError }), 'resize-y py-2.5 leading-relaxed', className)}
          {...props}
        />
      )}
    </Field>
  );
});
