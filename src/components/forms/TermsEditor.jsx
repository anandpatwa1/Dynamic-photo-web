import { useFieldArray } from 'react-hook-form';
import { GripVertical, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui';
import { cn } from '@/utils/cn';

/**
 * Repeatable list editor for terms & conditions.
 *
 * Stored as `[{ value }]` rather than `[string]` because React Hook Form's
 * `useFieldArray` needs object items to keep stable keys while reordering.
 */
export const TermsEditor = ({
  control,
  register,
  name,
  errors,
  label,
  hint,
  max = 25,
  rows = 2,
  placeholder = 'Describe one condition…',
  emptyText = 'No terms yet — add the conditions you want printed on this document.',
  addLabel = 'Add term',
}) => {
  const { fields, append, remove, move } = useFieldArray({ control, name });

  return (
    <div>
      <div className="mb-2 flex items-end justify-between gap-3">
        <div>
          {label && <p className="text-sm font-medium text-ink-700">{label}</p>}
          {hint && <p className="mt-0.5 text-xs text-ink-500">{hint}</p>}
        </div>
        <span className="shrink-0 text-xs text-ink-400 tabular">
          {fields.length} / {max}
        </span>
      </div>

      <div className="space-y-2">
        {fields.map((field, index) => {
          const error = errors?.[index]?.value?.message;

          return (
            <div key={field.id} className="group flex items-start gap-2">
              <div className="flex flex-col items-center pt-2.5">
                <button
                  type="button"
                  onClick={() => index > 0 && move(index, index - 1)}
                  disabled={index === 0}
                  aria-label="Move term up"
                  className="cursor-grab text-ink-300 transition-colors hover:text-ink-500 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <GripVertical className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              <span className="tabular mt-2.5 w-5 shrink-0 text-right text-xs text-ink-400">
                {index + 1}.
              </span>

              <div className="min-w-0 flex-1">
                <textarea
                  rows={rows}
                  {...register(`${name}.${index}.value`)}
                  className={cn(
                    'block w-full resize-y rounded-xl bg-white px-3.5 py-2.5 text-base leading-relaxed text-ink-900 shadow-xs',
                    'ring-1 ring-inset ring-ink-200 placeholder:text-ink-400',
                    'focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-500',
                    error && 'ring-danger-300 focus:ring-danger-500',
                  )}
                  placeholder={placeholder}
                />
                {error && <p className="mt-1 text-xs text-danger-600">{error}</p>}
              </div>

              <Button
                variant="ghost"
                size="sm"
                iconOnly
                icon={Trash2}
                onClick={() => remove(index)}
                aria-label={`Remove item ${index + 1}`}
                className="mt-1 text-ink-400 opacity-0 transition-opacity hover:text-danger-600 focus-visible:opacity-100 group-hover:opacity-100"
              />
            </div>
          );
        })}
      </div>

      {fields.length === 0 && (
        <p className="rounded-xl border border-dashed border-ink-200 px-4 py-6 text-center text-sm text-ink-400">
          {emptyText}
        </p>
      )}

      <Button
        variant="secondary"
        size="sm"
        icon={Plus}
        onClick={() => append({ value: '' })}
        disabled={fields.length >= max}
        className="mt-3"
      >
        {addLabel}
      </Button>
    </div>
  );
};

/** Converts `['a','b']` ⇄ `[{ value: 'a' }, { value: 'b' }]` for the form. */
export const termsToFields = (terms = []) => terms.map((value) => ({ value }));
export const fieldsToTerms = (fields = []) =>
  fields.map((field) => field.value?.trim()).filter(Boolean);
