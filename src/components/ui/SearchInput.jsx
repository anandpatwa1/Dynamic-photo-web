import { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/utils/cn';

/**
 * Debounced search box. Keeps its own immediate value for a responsive feel
 * while only notifying the parent (and therefore the API) after `delay`.
 */
export const SearchInput = ({
  value = '',
  onChange,
  placeholder = 'Search…',
  delay = 350,
  className,
  autoFocus = false,
}) => {
  const [draft, setDraft] = useState(value);

  // Re-sync when the parent resets the query (e.g. "clear all filters").
  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (draft === value) return undefined;
    const timer = setTimeout(() => onChange(draft), delay);
    return () => clearTimeout(timer);
  }, [draft, delay, onChange, value]);

  return (
    <div className={cn('relative', className)}>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
        aria-hidden="true"
      />
      <input
        type="search"
        value={draft}
        autoFocus={autoFocus}
        onChange={(event) => setDraft(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className={cn(
          'h-10 w-full rounded-xl bg-white pl-10 pr-9 text-base text-ink-900 shadow-xs',
          'ring-1 ring-inset ring-ink-200 placeholder:text-ink-400',
          'transition-shadow focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-500',
          '[&::-webkit-search-cancel-button]:appearance-none',
        )}
      />
      {draft && (
        <button
          type="button"
          onClick={() => setDraft('')}
          aria-label="Clear search"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      )}
    </div>
  );
};
