import { Award, Camera, Clock, Gem, Heart, Sparkles, Users } from 'lucide-react';
import { Reveal } from '../components/Reveal';
import { useSiteContent } from '../content/SiteContent';

/**
 * Icon names are stored as strings in the CMS, so the mapping lives in code
 * rather than the database — a content editor should never be able to save a
 * value that crashes the render.
 */
export const SITE_ICONS = {
  rings: Gem,
  camera: Camera,
  award: Award,
  heart: Heart,
  users: Users,
  clock: Clock,
  aperture: Camera,
  sparkles: Sparkles,
  gem: Gem,
};

export const Stats = () => {
  const { stats } = useSiteContent();
  if (!stats?.length) return null;

  return (
    <section aria-label="By the numbers" className="bg-site-ink">
      <div className="mx-auto max-w-8xl px-5 py-16 sm:px-8 sm:py-20 lg:px-12">
        {/* Two columns on the narrowest devices — four would force the numbers
            down to an unreadable size on a Galaxy Fold. */}
        <dl className="grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-4">
          {stats.map((stat, i) => {
            const Icon = SITE_ICONS[stat.icon] ?? Sparkles;
            return (
              <Reveal key={stat.label} delay={i * 100} className="flex flex-col items-center text-center">
                <Icon className="h-7 w-7 text-site-accent-soft" strokeWidth={1} aria-hidden="true" />
                <dd className="mt-5 font-serif text-site-stat font-light tabular-nums text-white">
                  {stat.value}
                </dd>
                <dt className="mt-3 text-site-eyebrow font-medium uppercase text-white/55">
                  {stat.label}
                </dt>
              </Reveal>
            );
          })}
        </dl>
      </div>
    </section>
  );
};
