import { Check, Sparkles } from 'lucide-react';
import { Reveal } from '../components/Reveal';
import { SectionHeading } from '../components/SectionHeading';
import { SmoothImage } from '../components/SmoothImage';
import { SiteButton } from '../components/SiteButton';
import { useSection } from '../content/SiteContent';
import { useEnquiry } from '../content/EnquiryContext';
import { SITE_ICONS } from './Stats';

/**
 * Packages never show a price — that is a deliberate product decision in the
 * spec, not an oversight. Every card routes to the enquiry form instead, with
 * the package pre-selected so nobody retypes what they already clicked.
 */
export const Packages = () => {
  const packages = useSection('packages');
  const { enquireAbout } = useEnquiry();

  if (!packages) return null;

  return (
    <section id="packages" aria-labelledby="packages-title" className="bg-site-paper-alt">
      <div className="mx-auto max-w-8xl px-5 py-20 sm:px-8 sm:py-24 lg:px-12 lg:py-28">
        <SectionHeading title={packages.title} subtitle={packages.subtitle} align="center" />

        {packages.pillars?.length > 0 && (
          <ul className="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-3">
            {packages.pillars.map((pillar, i) => {
              const Icon = SITE_ICONS[pillar.icon] ?? Sparkles;
              return (
                <Reveal
                  as="li"
                  key={pillar.title}
                  delay={i * 100}
                  className="flex flex-col items-center text-center"
                >
                  <Icon className="h-6 w-6 text-site-accent" strokeWidth={1} aria-hidden="true" />
                  <p className="mt-4 text-site-eyebrow font-medium uppercase text-site-ink">
                    {pillar.title}
                  </p>
                </Reveal>
              );
            })}
          </ul>
        )}

        <ul className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {packages.items?.map((item, i) => (
            <Reveal
              as="li"
              key={item.id}
              delay={i * 120}
              className="flex flex-col bg-site-paper shadow-[0_1px_0_0_rgba(0,0,0,0.05)]"
            >
              <SmoothImage
                asset={item.image}
                alt={`${item.name} package`}
                ratio="4 / 3"
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              />

              <div className="flex flex-1 flex-col p-7 text-center">
                <h3 className="text-site-eyebrow font-semibold uppercase text-site-accent">
                  {item.name}
                </h3>
                <p className="mt-3 font-serif text-xl font-light text-site-ink">
                  {item.description}
                </p>

                {item.features?.length > 0 && (
                  <ul className="mt-6 space-y-2.5 text-left">
                    {item.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5 text-sm leading-relaxed">
                        <Check
                          className="mt-0.5 h-3.5 w-3.5 shrink-0 text-site-accent"
                          strokeWidth={2}
                          aria-hidden="true"
                        />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="mt-8 flex-1" />

                <SiteButton
                  variant="ghost"
                  onClick={() => enquireAbout(item.id)}
                  className="w-full"
                  // Names the package for anyone hearing the button out of
                  // context — three identical "Enquire Now" buttons otherwise.
                  aria-label={`Enquire about the ${item.name} package`}
                >
                  Enquire Now
                </SiteButton>
              </div>
            </Reveal>
          ))}
        </ul>

        {packages.cta && (
          <Reveal className="mt-14 bg-site-sand">
            <div className="flex flex-col items-start justify-between gap-6 p-8 sm:p-10 md:flex-row md:items-center">
              <div>
                <p className="font-serif text-site-h3 font-light text-site-ink">
                  {packages.cta.title}
                </p>
                <p className="mt-2 text-site-body text-site-ink/70">{packages.cta.body}</p>
              </div>

              <SiteButton
                variant="solid"
                onClick={() => enquireAbout('')}
                className="shrink-0"
              >
                {packages.cta.label}
              </SiteButton>
            </div>
          </Reveal>
        )}
      </div>
    </section>
  );
};
