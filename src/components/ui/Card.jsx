import { cn } from '@/utils/cn';

/**
 * Surface primitive. The resting state is a hairline ring plus a whisper of
 * ambient shadow — never a heavy drop shadow.
 */
export const Card = ({ as: Component = 'div', className, interactive = false, ...props }) => (
  <Component
    className={cn(
      'rounded-2xl bg-white shadow-card',
      interactive &&
        'cursor-pointer transition-all duration-200 ease-smooth hover:-translate-y-0.5 hover:shadow-card-hover',
      className,
    )}
    {...props}
  />
);

export const CardHeader = ({ className, bordered = true, ...props }) => (
  <div
    className={cn(
      'flex flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 sm:py-5',
      bordered && 'border-b border-ink-200/70',
      className,
    )}
    {...props}
  />
);

export const CardTitle = ({ as: Component = 'h3', className, ...props }) => (
  <Component className={cn('text-lg font-semibold text-ink-900', className)} {...props} />
);

export const CardDescription = ({ className, ...props }) => (
  <p className={cn('mt-1 text-sm text-ink-500', className)} {...props} />
);

export const CardBody = ({ className, ...props }) => (
  <div className={cn('px-4 py-4 sm:px-6 sm:py-5', className)} {...props} />
);

export const CardFooter = ({ className, bordered = true, ...props }) => (
  <div
    className={cn(
      'flex flex-wrap items-center justify-end gap-3 px-4 py-3.5 sm:px-6 sm:py-4',
      bordered && 'border-t border-ink-200/70',
      className,
    )}
    {...props}
  />
);
