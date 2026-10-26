import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Button } from './Button';
import { PAGE_SIZE_OPTIONS } from '@/constants';

/** Builds a compact page list with ellipses: 1 … 4 5 6 … 20 */
const buildPages = (current, total) => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  if (start > 2) pages.push('…');
  for (let page = start; page <= end; page += 1) pages.push(page);
  if (end < total - 1) pages.push('…');
  pages.push(total);

  return pages;
};

export const Pagination = ({ meta, onPageChange, onLimitChange, className }) => {
  if (!meta || meta.total === 0) return null;

  const { page = 1, limit = 20, total = 0, totalPages = 1 } = meta;
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div
      className={cn(
        'flex flex-col-reverse items-center justify-between gap-4 border-t border-ink-200/70 px-6 py-3.5 sm:flex-row',
        className,
      )}
    >
      <div className="flex items-center gap-4">
        <p className="text-sm text-ink-500">
          <span className="font-medium text-ink-700">
            {from}–{to}
          </span>{' '}
          of <span className="font-medium text-ink-700">{total}</span>
        </p>

        {onLimitChange && (
          <label className="flex items-center gap-1.5 text-sm text-ink-500">
            <span className="hidden sm:inline">Rows</span>
            <select
              value={limit}
              onChange={(event) => onLimitChange(Number(event.target.value))}
              className="h-8 cursor-pointer rounded-lg bg-white pl-2 pr-7 text-sm text-ink-700 ring-1 ring-inset ring-ink-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <nav className="flex items-center gap-1" aria-label="Pagination">
        <Button
          variant="secondary"
          size="sm"
          iconOnly
          icon={ChevronLeft}
          aria-label="Previous page"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        />

        <div className="hidden items-center gap-1 sm:flex">
          {buildPages(page, totalPages).map((entry, index) =>
            entry === '…' ? (
              <span key={`gap-${index}`} className="px-1.5 text-sm text-ink-400">
                …
              </span>
            ) : (
              <button
                key={entry}
                type="button"
                onClick={() => onPageChange(entry)}
                aria-current={entry === page ? 'page' : undefined}
                className={cn(
                  'h-8.5 min-w-8.5 rounded-lg px-2.5 text-sm font-medium transition-colors',
                  entry === page
                    ? 'bg-ink-900 text-white'
                    : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900',
                )}
              >
                {entry}
              </button>
            ),
          )}
        </div>

        <span className="px-2 text-sm text-ink-500 sm:hidden">
          {page} / {totalPages}
        </span>

        <Button
          variant="secondary"
          size="sm"
          iconOnly
          icon={ChevronRight}
          aria-label="Next page"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        />
      </nav>
    </div>
  );
};
