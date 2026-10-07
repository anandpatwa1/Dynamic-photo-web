import { cn } from '@/utils/cn';

export const Skeleton = ({ className, ...props }) => (
  <div className={cn('skeleton h-4 w-full', className)} aria-hidden="true" {...props} />
);

/** Placeholder rows that mirror the real table's column layout. */
export const TableSkeleton = ({ rows = 6, columns = 5 }) => (
  <div className="divide-y divide-ink-200/70">
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="flex items-center gap-4 px-6 py-4">
        {Array.from({ length: columns }).map((__, colIndex) => (
          <Skeleton
            key={colIndex}
            className={cn('h-3.5', colIndex === 0 ? 'w-1/4' : 'flex-1', colIndex === columns - 1 && 'w-16 flex-none')}
          />
        ))}
      </div>
    ))}
  </div>
);

export const CardSkeleton = ({ className }) => (
  <div className={cn('rounded-2xl bg-white p-6 shadow-card', className)}>
    <Skeleton className="h-3 w-24" />
    <Skeleton className="mt-4 h-7 w-32" />
    <Skeleton className="mt-3 h-3 w-20" />
  </div>
);

export const Spinner = ({ className }) => (
  <span
    role="status"
    aria-label="Loading"
    className={cn(
      'inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent',
      className,
    )}
  />
);

/** Full-area loading state for route-level suspense boundaries. */
export const PageLoader = ({ label = 'Loading' }) => (
  <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
    <Spinner className="h-6 w-6 text-brand-500" />
    <p className="text-sm text-ink-500">{label}…</p>
  </div>
);
