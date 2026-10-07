import { Reveal } from '../components/Reveal';
import { SmoothImage } from '../components/SmoothImage';
import { SiteButton } from '../components/SiteButton';
import { useSection } from '../content/SiteContent';

/**
 * "We Capture Emotions" — copy on the left, three category cards on the right.
 *
 * The cards are anchors, not decorated divs: each one navigates. Wrapping the
 * whole card makes the entire target clickable without a nested-interactive
 * violation, and gives keyboard users one stop per card instead of three.
 */
export const FeaturedWork = () => {
  const featured = useSection('featured');
  if (!featured) return null;

  return (
    <section id="featured" aria-labelledby="featured-title" className="bg-site-paper">
      <div className="mx-auto max-w-8xl px-5 py-20 sm:px-8 sm:py-24 lg:px-12 lg:py-28">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-4 lg:sticky lg:top-32 lg:self-start">
            <Reveal as="p" className="text-site-eyebrow font-medium uppercase text-site-accent">
              {featured.eyebrow}
            </Reveal>

            <Reveal
              as="h2"
              id="featured-title"
              delay={80}
              className="mt-5 font-serif text-site-h2 font-light text-site-ink"
            >
              {featured.title}
            </Reveal>

            <Reveal as="p" delay={160} className="mt-6 max-w-sm text-site-body">
              {featured.body}
            </Reveal>

            <Reveal delay={240} className="mt-9">
              <SiteButton href={featured.ctaHref ?? '#portfolio'} variant="ghost">
                {featured.ctaLabel}
              </SiteButton>
            </Reveal>
          </div>

          <div className="grid gap-5 sm:grid-cols-3 lg:col-span-8">
            {featured.cards?.map((card, i) => (
              <Reveal key={card.title} delay={i * 110}>
                <a
                  href={card.href ?? '#portfolio'}
                  className="group/card block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-accent focus-visible:ring-offset-4"
                >
                  <SmoothImage
                    asset={card.image}
                    alt={`${card.title} — ${card.caption}`}
                    ratio="3 / 4"
                    sizes="(min-width: 1024px) 25vw, (min-width: 640px) 30vw, 100vw"
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-site-ink/85 via-site-ink/15 to-transparent" />

                    {/* Slow zoom on hover — the only movement the reference
                        implies, and it stays still for reduced-motion users. */}
                    <div className="absolute inset-x-0 bottom-0 p-5">
                      <h3 className="text-site-eyebrow font-semibold uppercase text-white">
                        {card.title}
                      </h3>
                      <p className="mt-1.5 text-sm text-white/75">{card.caption}</p>
                    </div>
                  </SmoothImage>
                </a>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
