import { cn } from '@/utils/cn';

const TONES = {
  neutral: 'bg-ink-100 text-ink-600 ring-ink-200',
  brand: 'bg-brand-50 text-brand-700 ring-brand-200',
  success: 'bg-success-50 text-success-700 ring-success-100',
  warning: 'bg-warning-50 text-warning-700 ring-warning-100',
  danger: 'bg-danger-50 text-danger-700 ring-danger-100',
  info: 'bg-info-50 text-info-700 ring-info-100',
  olive: 'bg-olive-50 text-olive-700 ring-olive-200',
};

const DOT_TONES = {
  neutral: 'bg-ink-400',
  brand: 'bg-brand-500',
  success: 'bg-success-500',
  warning: 'bg-warning-500',
  danger: 'bg-danger-500',
  info: 'bg-info-500',
  olive: 'bg-olive-500',
};

const SIZES = {
  sm: 'px-2 py-0.5 text-2xs gap-1',
  md: 'px-2.5 py-1 text-xs gap-1.5',
};

export const Badge = ({ tone = 'neutral', size = 'md', dot = false, className, children, ...props }) => (
  <span
    className={cn(
      'inline-flex items-center rounded-full font-medium ring-1 ring-inset',
      TONES[tone] ?? TONES.neutral,
      SIZES[size],
      className,
    )}
    {...props}
  >
    {dot && (
      <span
        className={cn('h-1.5 w-1.5 shrink-0 rounded-full', DOT_TONES[tone] ?? DOT_TONES.neutral)}
        aria-hidden="true"
      />
    )}
    {children}
  </span>
);

/**
 * Renders a status value using a `{ status: { label, tone } }` lookup map,
 * so status vocabularies stay declared in constants rather than in JSX.
 */
export const StatusBadge = ({ status, meta, fallbackLabel, ...props }) => {
  const config = meta?.[status];
  return (
    <Badge tone={config?.tone ?? 'neutral'} dot {...props}>
      {config?.label ?? fallbackLabel ?? status ?? '—'}
    </Badge>
  );
};
