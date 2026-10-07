import { Star } from 'lucide-react';
import { Reveal } from '../components/Reveal';
import { SectionHeading } from '../components/SectionHeading';
import { SmoothImage } from '../components/SmoothImage';
import { useSection } from '../content/SiteContent';

/**
 * The reference sheet does not include a testimonials layout, so this is built
 * from the design language it does establish — paper ground, serif quote,
 * hairline rules, wide-tracked caps for attribution.
 *
 * Rendered as a static grid rather than a carousel on purpose: an auto-rotating
 * quote strip is one of the most common accessibility failures on sites like
 * this, and with three testimonials there is nothing to gain by hiding two.
 */
export const Testimonials = () => {
  const testimonials = useSection('testimonials');
  if (!testimonials?.items?.length) return null;

  return (
    <section id="testimonials" aria-labelledby="testimonials-title" className="bg-site-paper-alt">
      <div className="mx-auto max-w-8xl px-5 py-20 sm:px-8 sm:py-24 lg:px-12 lg:py-28">
        <SectionHeading title={testimonials.title} subtitle={testimonials.subtitle} align="center" />

        <ul className="mt-14 grid gap-6 md:grid-cols-3">
          {testimonials.items.map((item, i) => (
            <Reveal
              as="li"
              key={item.id}
              delay={i * 120}
              className="flex flex-col bg-site-paper p-8 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]"
            >
              {item.rating > 0 && (
                <p
                  className="flex gap-1"
                  aria-label={`Rated ${item.rating} out of 5`}
                >
                  {Array.from({ length: 5 }, (_, starIndex) => (
                    <Star
                      key={starIndex}
                      aria-hidden="true"
                      className={
                        starIndex < item.rating
                          ? 'h-3.5 w-3.5 fill-site-accent text-site-accent'
                          : 'h-3.5 w-3.5 text-site-line'
                      }
                      strokeWidth={1.5}
                    />
                  ))}
                </p>
              )}

              <blockquote className="mt-5 flex-1">
                <p className="font-serif text-xl font-light leading-relaxed text-site-ink">
                  “{item.quote}”
                </p>
              </blockquote>

              <figcaption className="mt-7 flex items-center gap-3.5 border-t border-site-line pt-6">
                <SmoothImage
                  asset={item.avatar}
                  alt=""
                  ratio="1 / 1"
                  className="h-11 w-11 shrink-0 rounded-full"
                />
                <span>
                  <span className="block text-site-eyebrow font-semibold uppercase text-site-ink">
                    {item.name}
                  </span>
                  <span className="mt-1 block text-sm text-site-muted">{item.role}</span>
                </span>
              </figcaption>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
};
