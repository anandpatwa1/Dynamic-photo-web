import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/utils/cn';

/**
 * Standard page masthead: optional breadcrumbs, a display title, a supporting
 * line and a right-aligned action slot. Consistent use of this is most of what
 * makes the app read as one product.
 */
export const PageHeader = ({ title, description, breadcrumbs = [], actions, className, children }) => (
  <header className={cn('mb-6', className)}>
    {breadcrumbs.length > 0 && (
      <nav aria-label="Breadcrumb" className="mb-2.5">
        <ol className="flex flex-wrap items-center gap-1 text-sm text-ink-500">
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;
            return (
              <li key={`${crumb.label}-${index}`} className="flex items-center gap-1">
                {crumb.to && !isLast ? (
                  <Link to={crumb.to} className="transition-colors hover:text-ink-800">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className={isLast ? 'font-medium text-ink-700' : undefined}>
                    {crumb.label}
                  </span>
                )}
                {!isLast && (
                  <ChevronRight className="h-3.5 w-3.5 text-ink-300" aria-hidden="true" />
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    )}

    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-3xl font-semibold text-ink-900">{title}</h1>
        {description && (
          <p className="mt-1.5 max-w-2xl text-pretty text-md text-ink-500">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2.5">{actions}</div>}
    </div>

    {children}
  </header>
);

/** Toolbar strip that sits above a table: filters left, actions right. */
export const Toolbar = ({ className, children }) => (
  <div className={cn('mb-4 flex flex-wrap items-center gap-3', className)}>{children}</div>
);
