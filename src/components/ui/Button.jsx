import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';

const VARIANTS = {
  primary:
    'bg-brand-500 text-white shadow-xs hover:bg-brand-600 active:bg-brand-700 disabled:bg-brand-300',
  secondary:
    'bg-white text-ink-700 ring-1 ring-inset ring-ink-200 shadow-xs hover:bg-ink-50 hover:text-ink-900 active:bg-ink-100',
  subtle: 'bg-brand-50 text-brand-700 hover:bg-brand-100 active:bg-brand-200',
  ghost: 'text-ink-600 hover:bg-ink-100 hover:text-ink-900 active:bg-ink-200',
  danger: 'bg-danger-600 text-white shadow-xs hover:bg-danger-700 active:bg-danger-700',
  'danger-soft': 'bg-danger-50 text-danger-700 hover:bg-danger-100 active:bg-danger-100',
  dark: 'bg-ink-900 text-white shadow-xs hover:bg-ink-800 active:bg-ink-950',
  link: 'text-brand-600 underline-offset-4 hover:text-brand-700 hover:underline',
};

const SIZES = {
  xs: 'h-7 gap-1.5 rounded-lg px-2.5 text-xs',
  sm: 'h-8.5 gap-1.5 rounded-lg px-3 text-sm',
  md: 'h-10 gap-2 rounded-xl px-4 text-base',
  lg: 'h-11 gap-2 rounded-xl px-5 text-md',
};

const ICON_SIZES = {
  xs: 'h-7 w-7 rounded-lg',
  sm: 'h-8.5 w-8.5 rounded-lg',
  md: 'h-10 w-10 rounded-xl',
  lg: 'h-11 w-11 rounded-xl',
};

/**
 * The single button primitive for the whole app.
 * `loading` disables interaction and swaps the leading icon for a spinner,
 * keeping the button's width stable so layouts never jump.
 */
export const Button = forwardRef(function Button(
  {
    as: Component = 'button',
    variant = 'primary',
    size = 'md',
    icon: Icon,
    iconRight: IconRight,
    iconOnly = false,
    loading = false,
    fullWidth = false,
    className,
    children,
    disabled,
    type = 'button',
    ...props
  },
  ref,
) {
  const isDisabled = disabled || loading;

  return (
    <Component
      ref={ref}
      type={Component === 'button' ? type : undefined}
      disabled={Component === 'button' ? isDisabled : undefined}
      aria-busy={loading || undefined}
      aria-disabled={isDisabled || undefined}
      className={cn(
        'inline-flex select-none items-center justify-center whitespace-nowrap font-medium',
        'transition-all duration-150 ease-smooth',
        'disabled:pointer-events-none disabled:opacity-60',
        VARIANTS[variant],
        iconOnly ? ICON_SIZES[size] : SIZES[size],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden="true" />
      ) : (
        Icon && <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      )}
      {!iconOnly && children}
      {!iconOnly && !loading && IconRight && (
        <IconRight className="h-4 w-4 shrink-0" aria-hidden="true" />
      )}
    </Component>
  );
});
