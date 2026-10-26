import { ArrowRight } from 'lucide-react';
import { cn } from '@/utils/cn';

/**
 * The reference uses exactly three button treatments, so this exposes exactly
 * three. Anything outside the set would drift from the approved design.
 *
 *  outline — hairline box on photography (hero "VIEW OUR WORK")
 *  solid   — filled dark pill (packages "ENQUIRE NOW")
 *  ghost   — hairline box on paper (section CTAs)
 *
 * Renders as `<a>` when given `href` and `<button>` otherwise, so a link is
 * always a real link — keyboard and middle-click behaviour comes free.
 */
const VARIANTS = {
  outline:
    'border border-white/45 text-white hover:border-white hover:bg-white hover:text-site-ink',
  solid: 'bg-site-ink text-white border border-site-ink hover:bg-site-ink-soft',
  ghost:
    'border border-site-ink/25 text-site-ink hover:border-site-ink hover:bg-site-ink hover:text-white',
};

export const SiteButton = ({
  href,
  variant = 'ghost',
  withArrow = true,
  className,
  children,
  ...rest
}) => {
  const Tag = href ? 'a' : 'button';

  return (
    <Tag
      href={href}
      type={href ? undefined : 'button'}
      className={cn(
        'group/btn inline-flex items-center justify-center gap-3',
        'px-7 py-3.5 sm:px-8 sm:py-4',
        'text-site-eyebrow font-medium uppercase',
        'transition-colors duration-300 ease-smooth',
        // Focus must be visible against both photography and paper.
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-accent focus-visible:ring-offset-2',
        VARIANTS[variant],
        className,
      )}
      {...rest}
    >
      <span>{children}</span>
      {withArrow && (
        <ArrowRight
          className="h-4 w-4 shrink-0 transition-transform duration-300 ease-smooth group-hover/btn:translate-x-1 motion-reduce:transition-none motion-reduce:group-hover/btn:translate-x-0"
          aria-hidden="true"
          strokeWidth={1.5}
        />
      )}
    </Tag>
  );
};
