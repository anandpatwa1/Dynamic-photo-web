import { cn } from '@/utils/cn';

/**
 * Underlined tab bar. `tabs: [{ value, label, icon?, count? }]`.
 */
export const Tabs = ({ tabs = [], value, onChange, className, size = 'md' }) => (
  <div className={cn('flex items-center gap-1 border-b border-ink-200/80 overflow-x-auto scrollbar-slim', className)}>
    {tabs.map((tab) => {
      const active = tab.value === value;
      const Icon = tab.icon;

      return (
        <button
          key={tab.value}
          type="button"
          onClick={() => onChange(tab.value)}
          aria-current={active ? 'page' : undefined}
          className={cn(
            'relative -mb-px flex items-center gap-2 whitespace-nowrap border-b-2 font-medium transition-colors',
            size === 'sm' ? 'px-3 py-2.5 text-sm' : 'px-3.5 py-3 text-base',
            active
              ? 'border-brand-500 text-ink-900'
              : 'border-transparent text-ink-500 hover:border-ink-300 hover:text-ink-800',
          )}
        >
          {Icon && <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />}
          {tab.label}
          {tab.count !== undefined && (
            <span
              className={cn(
                'rounded-full px-1.5 py-0.5 text-2xs font-semibold tabular',
                active ? 'bg-brand-100 text-brand-700' : 'bg-ink-100 text-ink-500',
              )}
            >
              {tab.count}
            </span>
          )}
        </button>
      );
    })}
  </div>
);

/** Compact segmented control for filters that sit inside toolbars. */
export const SegmentedControl = ({ options = [], value, onChange, className }) => (
  <div className={cn('inline-flex rounded-xl bg-ink-100 p-1', className)}>
    {options.map((option) => {
      const active = option.value === value;
      return (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            'rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-150 ease-smooth',
            active ? 'bg-white text-ink-900 shadow-xs' : 'text-ink-500 hover:text-ink-800',
          )}
        >
          {option.label}
        </button>
      );
    })}
  </div>
);
