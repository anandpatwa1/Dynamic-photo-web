import { Reveal } from '../components/Reveal';
import { useSiteContent } from '../content/SiteContent';

/**
 * Press/credential strip directly under the hero.
 *
 * Rendered as text wordmarks rather than logo images on purpose: six remote
 * logos immediately below the LCP element is a measurable cost for a band that
 * is pure reassurance. When an admin uploads real logos the markup swaps to
 * `SmoothImage` with the same layout.
 */
export const FeaturedIn = () => {
  const { featuredIn } = useSiteContent();
  if (!featuredIn?.length) return null;

  return (
    <section aria-label="Featured in" className="border-b border-site-line bg-site-paper">
      <div className="mx-auto max-w-8xl px-5 py-10 sm:px-8 sm:py-12 lg:px-12">
        <Reveal className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6 sm:gap-x-14">
          <p className="text-site-eyebrow font-medium uppercase text-site-muted">Featured in</p>

          {featuredIn.map((item) => (
            <span
              key={item.name}
              className="font-serif text-lg font-medium tracking-wide text-site-ink/45 transition-colors duration-300 hover:text-site-ink/75 sm:text-xl"
            >
              {item.name}
            </span>
          ))}
        </Reveal>
      </div>
    </section>
  );
};
