import { useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Field } from '@/components/ui/Field';

/**
 * Chip-style tag entry. Commits on Enter or comma, removes the last chip on
 * Backspace when the input is empty, and silently ignores duplicates.
 */
export const TagInput = ({ label, hint, error, value = [], onChange, max = 12, placeholder = 'Add a tag…' }) => {
  const [draft, setDraft] = useState('');

  const commit = () => {
    const tag = draft.trim().replace(/,$/, '');
    if (!tag || value.length >= max || value.includes(tag)) {
      setDraft('');
      return;
    }
    onChange([...value, tag]);
    setDraft('');
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      commit();
    } else if (event.key === 'Backspace' && !draft && value.length) {
      onChange(value.slice(0, -1));
    }
  };

  return (
    <Field label={label} hint={hint} error={error}>
      {({ id, hasError }) => (
        <div
          className={cn(
            'flex min-h-10 w-full flex-wrap items-center gap-1.5 rounded-xl bg-white px-2 py-1.5 shadow-xs',
            'ring-1 ring-inset ring-ink-200 transition-shadow',
            'focus-within:ring-2 focus-within:ring-inset focus-within:ring-brand-500',
            hasError && 'ring-danger-300',
          )}
        >
          {value.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-lg bg-brand-50 py-0.5 pl-2 pr-1 text-sm font-medium text-brand-700 ring-1 ring-inset ring-brand-200/60"
            >
              {tag}
              <button
                type="button"
                onClick={() => onChange(value.filter((item) => item !== tag))}
                aria-label={`Remove ${tag}`}
                className="rounded p-0.5 text-brand-500 transition-colors hover:bg-brand-100 hover:text-brand-800"
              >
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            </span>
          ))}

          <input
            id={id}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={commit}
            disabled={value.length >= max}
            placeholder={value.length >= max ? `Up to ${max} tags` : placeholder}
            className="min-w-24 flex-1 border-0 bg-transparent px-1.5 py-0.5 text-base text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-0 disabled:cursor-not-allowed"
          />
        </div>
      )}
    </Field>
  );
};
