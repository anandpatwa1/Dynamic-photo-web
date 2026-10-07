import { Facebook, Instagram, Youtube } from 'lucide-react';
import { useSiteContent } from '../content/SiteContent';
import { useLocation } from 'react-router-dom';
import { buildNavLinks } from '../navigation';

const SOCIAL_ICONS = { instagram: Instagram, facebook: Facebook, youtube: Youtube };

export const Footer = () => {
  const content = useSiteContent();
  const { brand, contact } = content;
  const { pathname } = useLocation();
  const navLinks = buildNavLinks(content);
  // On a story page `#portfolio` would stay on that page; go home first.
  const base = pathname === '/' ? '' : '/';
  const year = new Date().getFullYear();

  return (
    <footer className="bg-site-ink text-white/70">
      <div className="mx-auto max-w-8xl px-5 py-16 sm:px-8 lg:px-12">
        <div className="grid gap-12 md:grid-cols-3">
          <div>
            <p className="font-serif text-3xl font-light leading-none text-white">
              {brand?.monogram ?? 'DP'}
            </p>
            <p className="mt-3 text-site-eyebrow font-medium uppercase text-white/60">
              {brand?.name}
            </p>
            <p className="mt-5 max-w-xs text-sm leading-relaxed">{brand?.tagline}</p>
          </div>

          <nav aria-label="Footer">
            <p className="text-site-eyebrow font-medium uppercase text-white/45">Explore</p>
            <ul className="mt-5 space-y-3">
              {navLinks.map((link) => (
                <li key={link.id}>
                  <a href={`${base}#${link.id}`} className="inline-block py-1 text-sm transition-colors hover:text-white">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <p className="text-site-eyebrow font-medium uppercase text-white/45">Get in touch</p>
            <ul className="mt-5 space-y-3 text-sm">
              {contact?.phone && (
                <li>
                  <a href={`tel:${contact.phone.replace(/\s/g, '')}`} className="transition-colors hover:text-white">
                    {contact.phone}
                  </a>
                </li>
              )}
              {contact?.email && (
                <li>
                  <a href={`mailto:${contact.email}`} className="break-all transition-colors hover:text-white">
                    {contact.email}
                  </a>
                </li>
              )}
              {contact?.address && <li>{contact.address}</li>}
            </ul>

            {contact?.socials?.length > 0 && (
              <div className="mt-6 flex gap-3">
                {contact.socials.map((social) => {
                  const Icon = SOCIAL_ICONS[social.platform];
                  if (!Icon) return null;
                  return (
                    <a
                      key={social.platform}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${brand?.name} on ${social.platform}`}
                      className="grid h-10 w-10 place-items-center border border-white/20 transition-colors hover:border-white hover:bg-white hover:text-site-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-accent-soft"
                    >
                      <Icon className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-white/10 pt-7 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {brand?.name}. All rights reserved.
          </p>
          {/*
            The only link from the public site into the CRM. `rel="nofollow"`
            keeps crawlers from following a staff-only surface; the route itself
            is separately marked noindex.
          */}
          <a href="/CRM" rel="nofollow" className="transition-colors hover:text-white">
            Studio Login
          </a>
        </div>
      </div>
    </footer>
  );
};
