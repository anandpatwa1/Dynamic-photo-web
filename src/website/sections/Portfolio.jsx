import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/utils/cn';
import { Reveal } from '../components/Reveal';
import { SectionHeading } from '../components/SectionHeading';
import { SmoothImage } from '../components/SmoothImage';
import { SiteButton } from '../components/SiteButton';
import { useSection } from '../content/SiteContent';

const RATIOS = {
  tall: '3 / 4',
  wide: '4 / 3',
  std: '4 / 5',
};

// How many of each category the "All" view opens with, and how many tiles a
// phone shows before "View All Work". Phones get fewer so the page stays light.
const PER_CATEGORY = 3;
const PHONE_LIMIT = 4;

export const Portfolio = () => {
  const portfolio = useSection('portfolio');
  const [active, setActive] = useState('all');
  const [showAll, setShowAll] = useState(false);

  const { items, total } = useMemo(() => {
    const all = portfolio?.items ?? [];
    // Categories come from what the studio has published, not a fixed list.
    const ids = (portfolio?.categories ?? []).filter((category) => category.id !== 'all').map((category) => category.id);
    const grouped = ids.flatMap((id) => all.filter((item) => item.category === id));
    const matching = active === 'all' ? grouped : grouped.filter((item) => item.category === active);

    if (showAll) return { items: matching, total: matching.length };

    // Default view: the first few of each category. "View All Work" lifts that.
    const preview =
      active === 'all'
        ? ids.flatMap((id) => all.filter((item) => item.category === id).slice(0, PER_CATEGORY))
        : matching.slice(0, PER_CATEGORY);
    return { items: preview, total: matching.length };
  }, [active, portfolio?.items, portfolio?.categories, showAll]);

  if (!portfolio) return null;

  const categories = portfolio.categories ?? [];

  const chooseCategory = (id) => {
    setActive(id);
    setShowAll(false);
  };

  return (
    <section id="portfolio" aria-labelledby="portfolio-title" className="bg-site-paper">
      <div className="mx-auto max-w-8xl px-5 py-20 sm:px-8 sm:py-24 lg:px-12 lg:py-28">
        <SectionHeading
          title={portfolio.title}
          subtitle={portfolio.subtitle}
          align="center"
        />

        {categories.length > 1 && (
          <Reveal
            delay={200}
            className="-mx-5 mt-10 flex gap-2 overflow-x-auto px-5 pb-2 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:justify-center sm:gap-3 sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden"
          >
            {categories.map((category) => {
              const isActive = active === category.id;
              return (
                <button
                  key={category.id}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => chooseCategory(category.id)}
                  className={cn(
                    'min-h-[44px] shrink-0 whitespace-nowrap rounded-full px-5 py-2.5 text-site-eyebrow font-medium uppercase transition-colors duration-300',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-accent focus-visible:ring-offset-2',
                    isActive
                      ? 'bg-site-ink text-white'
                      : 'bg-transparent text-site-muted hover:bg-site-paper-alt hover:text-site-ink',
                  )}
                >
                  {category.label}
                </button>
              );
            })}
          </Reveal>
        )}

        {items.length > 0 ? (
          <ul className="mt-12 gap-4 [column-count:1] sm:gap-5 sm:[column-count:2] lg:[column-count:3] [column-gap:1rem] sm:[column-gap:1.25rem]">
            {items.map((item, index) => (
              <Reveal
                as="li"
                key={item.id}
                delay={(index % 3) * 100}
                className={cn(
                  'group/tile mb-4 break-inside-avoid sm:mb-5',
                  !showAll && index >= PHONE_LIMIT && 'hidden sm:block',
                )}
              >
                <Link to={`/${item.slug}`} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-accent">
                  <SmoothImage
                    asset={item.image}
                    alt={item.title}
                    ratio={RATIOS[item.span] ?? RATIOS.std}
                    className="w-full"
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  >
                    <div className="absolute inset-0 flex items-end bg-gradient-to-t from-site-ink/80 via-transparent to-transparent opacity-0 transition-opacity duration-500 ease-smooth group-hover/tile:opacity-100">
                      <p className="p-5 text-site-eyebrow font-medium uppercase text-white">
                        {item.title}
                      </p>
                    </div>
                  </SmoothImage>
                </Link>
              </Reveal>
            ))}
          </ul>
        ) : (
          <p className="mt-16 text-center text-site-body text-site-muted">
            No work in this category yet — please check back soon.
          </p>
        )}

        {(showAll || items.length < total) && (
          <Reveal className="mt-14 flex justify-center">
            <SiteButton variant="ghost" onClick={() => setShowAll((current) => !current)}>
              {showAll ? 'Show Featured Work' : portfolio.ctaLabel || 'View All Work'}
            </SiteButton>
          </Reveal>
        )}
      </div>
    </section>
  );
};
