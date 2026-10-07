import { cn } from '@/utils/cn';
import { Reveal } from './Reveal';

/**
 * The reference has one heading construction, used centred on Portfolio and
 * Packages and left-aligned in Featured/About: an optional wide-tracked eyebrow,
 * a large serif title, and an optional lead line beneath.
 *
 * `as` exists because heading level is a document-structure decision, not a
 * visual one — sections need `h2` while the hero owns `h1`.
 */
export const SectionHeading = ({
  eyebrow,
  title,
  subtitle,
  align = 'center',
  tone = 'dark',
  as: Tag = 'h2',
  className,
}) => {
  const centred = align === 'center';

  return (
    <div
      className={cn(
        'flex flex-col',
        centred ? 'items-center text-center' : 'items-start text-left',
        className,
      )}
    >
      {eyebrow && (
        <Reveal
          as="p"
          className={cn(
            'text-site-eyebrow font-medium uppercase',
            tone === 'light' ? 'text-site-accent-soft' : 'text-site-accent',
          )}
        >
          {eyebrow}
        </Reveal>
      )}

      <Reveal
        as={Tag}
        delay={eyebrow ? 80 : 0}
        className={cn(
          'font-serif font-light text-site-h2',
          eyebrow && 'mt-4',
          tone === 'light' ? 'text-white' : 'text-site-ink',
        )}
      >
        {title}
      </Reveal>

      {subtitle && (
        <Reveal
          as="p"
          delay={160}
          className={cn(
            'mt-4 max-w-xl text-site-body',
            centred && 'mx-auto',
            tone === 'light' ? 'text-white/70' : 'text-site-body',
          )}
        >
          {subtitle}
        </Reveal>
      )}
    </div>
  );
};
