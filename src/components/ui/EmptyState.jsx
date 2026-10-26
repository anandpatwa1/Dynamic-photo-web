import { cn } from '@/utils/cn';
import { Button } from './Button';

/**
 * Shown when a collection is empty or a search returns nothing. Keeping this
 * generous and centered is a big part of why the app never feels like a
 * bare CRUD table.
 */
export const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  actionLabel,
  actionIcon,
  onAction,
  className,
  compact = false,
}) => (
  <div
    className={cn(
      'flex flex-col items-center justify-center text-center',
      compact ? 'px-6 py-12' : 'px-6 py-20',
      className,
    )}
  >
    {Icon && (
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-b from-brand-50 to-brand-100/60 ring-1 ring-inset ring-brand-200/60">
        <Icon className="h-6 w-6 text-brand-600" aria-hidden="true" />
      </div>
    )}
    <h3 className="text-md font-semibold text-ink-900">{title}</h3>
    {description && (
      <p className="mt-1.5 max-w-sm text-balance text-sm leading-relaxed text-ink-500">
        {description}
      </p>
    )}
    {(action || (actionLabel && onAction)) && (
      <div className="mt-6">
        {action ?? (
          <Button icon={actionIcon} onClick={onAction}>
            {actionLabel}
          </Button>
        )}
      </div>
    )}
  </div>
);
