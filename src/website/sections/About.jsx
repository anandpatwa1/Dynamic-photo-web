import { Sparkles } from 'lucide-react';
import { Reveal } from '../components/Reveal';
import { SmoothImage } from '../components/SmoothImage';
import { SiteButton } from '../components/SiteButton';
import { useSection } from '../content/SiteContent';
import { SITE_ICONS } from './Stats';

export const About = () => {
  const about = useSection('about');
  if (!about) return null;

  return (
    <section id="about" aria-labelledby="about-title" className="bg-site-paper">
      <div className="mx-auto max-w-8xl px-5 py-20 sm:px-8 sm:py-24 lg:px-12 lg:py-28">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <div>
            <Reveal as="p" className="text-site-eyebrow font-medium uppercase text-site-accent">
              {about.eyebrow}
            </Reveal>

            <Reveal
              as="h2"
              id="about-title"
              delay={80}
              className="mt-5 font-serif text-site-h2 font-light text-site-ink"
            >
              {about.title}
            </Reveal>

            <Reveal as="p" delay={160} className="mt-6 max-w-md text-site-body">
              {about.body}
            </Reveal>

            {about.signature && (
              <Reveal as="p" delay={240} className="mt-7 font-script text-3xl text-site-accent">
                {about.signature}
              </Reveal>
            )}

            <Reveal delay={320} className="mt-9">
              <SiteButton href="#contact" variant="ghost">
                {about.ctaLabel}
              </SiteButton>
            </Reveal>
          </div>

          {/* Order flipped on mobile so the copy leads; the portrait is support. */}
          <Reveal delay={120} className="order-first lg:order-last">
            <SmoothImage
              asset={about.portrait}
              alt={`${about.signature ?? 'Our'} team at work`}
              ratio="4 / 5"
              sizes="(min-width: 1024px) 45vw, 100vw"
            />
          </Reveal>
        </div>
      </div>

      {about.pillars?.length > 0 && (
        <div className="bg-site-ink">
          <div className="mx-auto max-w-8xl px-5 py-14 sm:px-8 sm:py-16 lg:px-12">
            <ul className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4">
              {about.pillars.map((pillar, i) => {
                const Icon = SITE_ICONS[pillar.icon] ?? Sparkles;
                return (
                  <Reveal
                    as="li"
                    key={pillar.title}
                    delay={i * 100}
                    className="flex flex-col items-center text-center"
                  >
                    <Icon
                      className="h-6 w-6 text-site-accent-soft"
                      strokeWidth={1}
                      aria-hidden="true"
                    />
                    <p className="mt-4 text-site-eyebrow font-medium uppercase text-white/75">
                      {pillar.title}
                    </p>
                  </Reveal>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
};
