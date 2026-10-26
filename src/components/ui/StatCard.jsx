import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Skeleton } from './Skeleton';

const ACCENTS = {
  brand: 'bg-brand-50 text-brand-600 ring-brand-200/60',
  success: 'bg-success-50 text-success-600 ring-success-100',
  warning: 'bg-warning-50 text-warning-600 ring-warning-100',
  danger: 'bg-danger-50 text-danger-600 ring-danger-100',
  info: 'bg-info-50 text-info-600 ring-info-100',
  olive: 'bg-olive-50 text-olive-600 ring-olive-200/60',
};

/**
 * Dashboard metric tile. `delta` is a signed percentage; pass `null` to hide
 * the trend row entirely rather than rendering a meaningless 0%.
 */
export const StatCard = ({
  label,
  value,
  hint,
  icon: Icon,
  accent = 'brand',
  delta = null,
  deltaLabel = 'vs last month',
  loading = false,
  className,
  onClick,
}) => {
  const TrendIcon = delta === null ? Minus : delta > 0 ? ArrowUpRight : delta < 0 ? ArrowDownRight : Minus;
  const trendTone =
    delta === null || delta === 0
      ? 'text-ink-500'
      : delta > 0
        ? 'text-success-600'
        : 'text-danger-600';

  return (
    <div
      onClick={onClick}
      className={cn(
        'group relative overflow-hidden rounded-2xl bg-white p-5 shadow-card',
        onClick && 'cursor-pointer transition-all duration-200 ease-smooth hover:-translate-y-0.5 hover:shadow-card-hover',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-ink-500">{label}</p>
        {Icon && (
          <span
            className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset',
              ACCENTS[accent] ?? ACCENTS.brand,
            )}
          >
            <Icon className="h-4.5 w-4.5" aria-hidden="true" />
          </span>
        )}
      </div>

      {loading ? (
        <Skeleton className="mt-3.5 h-8 w-28" />
      ) : (
        <p className="tabular mt-3 text-3xl font-semibold text-ink-900">{value}</p>
      )}

      {(delta !== null || hint) && !loading && (
        <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          {delta !== null && (
            <span className={cn('inline-flex items-center gap-0.5 font-medium', trendTone)}>
              <TrendIcon className="h-3.5 w-3.5" aria-hidden="true" />
              {Math.abs(delta).toFixed(1)}%
            </span>
          )}
          <span className="text-ink-400">{delta !== null ? deltaLabel : hint}</span>
        </div>
      )}
    </div>
  );
};
