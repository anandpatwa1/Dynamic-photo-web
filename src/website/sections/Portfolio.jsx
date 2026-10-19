import { useMemo, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { portfolioView } from '../utils/portfolioView';
import { Link } from 'react-router-dom';
import { cn } from '@/utils/cn';
import { Reveal } from '../components/Reveal';
import { SectionHeading } from '../components/SectionHeading';
import { SmoothImage } from '../components/SmoothImage';
import { SiteButton } from '../components/SiteButton';
import { useSection } from '../content/SiteContent';

const RATIOS = { tall: '3 / 4', wide: '4 / 3', std: '4 / 5' };
const PHONE_LIMIT = 4;

export const Portfolio = () => {
  const portfolio = useSection('portfolio');
  const [active, setActive] = useState('all');
  const [showAll, setShowAll] = useState(false);

  const { items, total } = useMemo(
    () => portfolioView(portfolio?.items, active, showAll),
    [portfolio?.items, active, showAll],
  );

  if (!portfolio) return null;

  const categories = portfolio.categories ?? [];

  const chooseCategory = (id) => {
    setActive(id);
    setShowAll(false);
  };

  return (
    <section id="portfolio" aria-labelledby="portfolio-title" className="bg-site-paper">
      <div className="mx-auto max-w-8xl px-5 py-14 sm:px-8 sm:py-24 lg:px-12 lg:py-28">
        <SectionHeading
          id="portfolio-title"
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
          <ul id="portfolio-grid" className="mt-7 sm:mt-10 gap-4 [column-count:1] sm:gap-5 sm:[column-count:2] lg:[column-count:3] [column-gap:1rem] sm:[column-gap:1.25rem]">
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
                <Link to={`/${item.slug}`} aria-label={`View ${item.title} story`} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-accent">
                  <SmoothImage
                    asset={item.image}
                    alt={item.title}
                    ratio={RATIOS[item.span] ?? RATIOS.std}
                    className="w-full"
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  >
                  </SmoothImage>
                  <div className="flex items-start justify-between gap-3 pb-4 pt-4">
                    <div className="min-w-0">
                      <h3 className="break-words font-serif text-2xl leading-tight text-site-ink">{item.title}</h3>
                      <p className="mt-2 text-xs uppercase tracking-[0.14em] text-site-muted">{categories.find(category => category.id === item.category)?.label || item.category?.replace(/-/g, ' ')}</p>
                    </div>
                    <ArrowUpRight className="mt-1 h-5 w-5 shrink-0 text-site-accent transition-transform group-hover/tile:-translate-y-0.5 group-focus-within/tile:-translate-y-0.5" aria-hidden="true"/>
                  </div>
                </Link>
              </Reveal>
            ))}
          </ul>
        ) : (
          <p className="mt-16 text-center text-site-body text-site-muted">
            No work in this category yet — please check back soon.
          </p>
        )}

        {(showAll || items.length < total || items.length > PHONE_LIMIT) && (
          <Reveal className={cn("mt-8 flex justify-center sm:mt-12", !showAll && items.length === total && "sm:hidden")}>
            <SiteButton variant="ghost" aria-controls="portfolio-grid" aria-expanded={showAll} onClick={() => setShowAll((current) => !current)}>
              {showAll ? 'Show Featured Work' : portfolio.ctaLabel || 'View All Work'}
            </SiteButton>
          </Reveal>
        )}
      </div>
    </section>
  );
};
