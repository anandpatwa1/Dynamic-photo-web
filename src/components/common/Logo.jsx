import { cn } from '@/utils/cn';

/**
 * The Dynamic Production mark — a camera body wrapping an aperture, recreated
 * from the letterhead in the reference documents. `currentColor` throughout so
 * it can sit on light or dark surfaces.
 */
export const LogoMark = ({ className }) => (
  <svg viewBox="0 0 48 44" fill="none" className={cn('h-8 w-auto', className)} aria-hidden="true">
    {/* Camera body */}
    <rect x="1.6" y="8.4" width="44.8" height="34" rx="8" stroke="currentColor" strokeWidth="3.2" />
    {/* Top plate / viewfinder hump */}
    <path
      d="M14.5 8.4l3.1-5.2a3 3 0 0 1 2.6-1.5h7.6a3 3 0 0 1 2.6 1.5l3.1 5.2"
      stroke="currentColor"
      strokeWidth="3.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Aperture ring */}
    <circle cx="24" cy="25.4" r="10.4" stroke="currentColor" strokeWidth="3.2" />
    {/* Shutter blades */}
    <path
      d="M24 15v9.4l8.1 4.7M24 24.4l-8.1 4.7M24 24.4l8.1-4.7"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      opacity="0.55"
    />
    <circle cx="24" cy="25.4" r="3.4" fill="currentColor" />
  </svg>
);

/** Full lockup: mark + DYNAMIC / PRODUCTION wordmark, optionally with tagline. */
export const Logo = ({ className, tagline = false, inverted = false, size = 'md' }) => {
  const scale = {
    sm: { mark: 'h-7', title: 'text-lg', sub: 'text-[0.5rem]' },
    md: { mark: 'h-9', title: 'text-xl', sub: 'text-[0.5625rem]' },
    lg: { mark: 'h-12', title: 'text-3xl', sub: 'text-[0.6875rem]' },
  }[size];

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <LogoMark className={cn(scale.mark, inverted ? 'text-brand-300' : 'text-brand-500')} />

      <div className="min-w-0 leading-none">
        <p
          className={cn(
            'font-semibold tracking-tight',
            scale.title,
            inverted ? 'text-white' : 'text-ink-900',
          )}
        >
          DYNAMIC
        </p>
        <p
          className={cn(
            'mt-1 font-semibold uppercase',
            scale.sub,
            inverted ? 'text-brand-300' : 'text-brand-600',
          )}
          style={{ letterSpacing: '0.42em' }}
        >
          Production
        </p>
        {tagline && (
          <p
            className={cn(
              'mt-2 text-[0.5625rem] uppercase',
              inverted ? 'text-white/50' : 'text-ink-400',
            )}
            style={{ letterSpacing: '0.24em' }}
          >
            Capturing Moments, Creating Impact
          </p>
        )}
      </div>
    </div>
  );
};
