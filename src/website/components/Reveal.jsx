import { useEffect, useRef, useState } from 'react';
import { cn } from '@/utils/cn';

/**
 * Fades content up as it scrolls into view.
 *
 * Deliberately not framer-motion: the CRM bundles it, but the marketing site is
 * judged on LCP and this is the only animation the site needs. An
 * IntersectionObserver plus two CSS classes costs nothing and behaves
 * identically. `prefers-reduced-motion` is honoured in website.css, so no JS
 * branch is needed here.
 *
 * Reveals fire once and then disconnect — content that re-animates every time
 * it re-enters the viewport reads as cheap, not premium.
 */
export const Reveal = ({ as: Tag = 'div', delay = 0, className, children, ...rest }) => {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;

    // Server-rendered/older browsers: show immediately rather than never.
    if (typeof IntersectionObserver === 'undefined') {
      setShown(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setShown(true);
        observer.disconnect();
      },
      // Fire slightly before the element is fully on screen so the motion has
      // finished by the time the reader's eye arrives.
      { rootMargin: '0px 0px -12% 0px', threshold: 0.05 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={cn('site-reveal', shown && 'is-visible', className)}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      {...rest}
    >
      {children}
    </Tag>
  );
};
