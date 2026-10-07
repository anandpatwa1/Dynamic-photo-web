import { useEffect, useRef } from 'react';
import { useLocation, useParams } from 'react-router-dom';

import { SiteContentProvider, useSiteContent } from './content/SiteContent';
import { EnquiryProvider } from './content/EnquiryContext';
import { SiteNav } from './components/SiteNav';
import { MobileActionBar } from './components/MobileActionBar';
import { Hero } from './sections/Hero';
import { FeaturedIn } from './sections/FeaturedIn';
import { FeaturedWork } from './sections/FeaturedWork';
import { Stats } from './sections/Stats';
import { Portfolio } from './sections/Portfolio';
import { Packages } from './sections/Packages';
import { About } from './sections/About';
import { Testimonials } from './sections/Testimonials';
import { Contact } from './sections/Contact';
import { Footer } from './sections/Footer';
import { CustomSection } from './sections/CustomSection';
import { PortfolioDetail } from './pages/PortfolioDetail';
import { composePage } from './navigation';
import './styles/website.css';

/**
 * Section order and visibility are CMS-controlled, so the page is assembled
 * from a registry rather than a fixed JSX sequence. Adding a section means
 * adding one entry here plus one entry in the CMS list — not editing a layout.
 */
const SECTIONS = {
  hero: Hero,
  featured: FeaturedWork,
  portfolio: Portfolio,
  packages: Packages,
  about: About,
  testimonials: Testimonials,
  contact: Contact,
};

const SitePage = () => {
  const content = useSiteContent();
  const entries = composePage(content);
  let customIndex = 0;

  return (
    <div className="site-shell">
      <SiteNav brand={content?.brand} />

      <main id="main">
        {entries.map((entry) => {
          if (entry.type === 'custom') {
            // Neighbouring custom sections alternate their background.
            const tint = customIndex % 2 === 0;
            customIndex += 1;
            return <CustomSection key={`custom-${entry.section.id}`} section={entry.section} tint={tint} />;
          }

          const Section = SECTIONS[entry.key];
          return (
            <div key={entry.key}>
              <Section />
              {/* The two bands that sit *between* sections in the reference
                  rather than inside one, so they follow their anchor section
                  wherever the CMS moves it. */}
              {entry.key === 'hero' && <FeaturedIn />}
              {entry.key === 'featured' && <Stats />}
            </div>
          );
        })}
      </main>

      <Footer />
      {/* Keeps the last lines of the footer clear of the pinned phone bar. */}
      <div className="h-[calc(3.5rem+env(safe-area-inset-bottom))] bg-site-ink md:hidden" aria-hidden="true" />
      <MobileActionBar />
    </div>
  );
};

const SitePortfolioDetailPage = () => {
  const content = useSiteContent();

  return (
    <div className="site-shell">
      <SiteNav brand={content?.brand} forceSolid />
      <PortfolioDetail />
      <Footer />
      <div className="h-[calc(3.5rem+env(safe-area-inset-bottom))] bg-site-ink md:hidden" aria-hidden="true" />
      <MobileActionBar />
    </div>
  );
};

/**
 * Deep links like `/#portfolio` must land on the right section even on a cold
 * load, when the target does not exist yet at the moment the browser tries to
 * scroll. React Router owns the URL here, so the scroll is re-applied once the
 * page has mounted.
 */
const HashScroll = () => {
  const { hash } = useLocation();
  const content = useSiteContent();
  // Sections the studio adds arrive with the data, after the first paint, so
  // their anchors do not exist yet on a cold load of `/#my-section`.
  const sectionCount = content?.sections?.length ?? 0;
  const handled = useRef('');

  useEffect(() => {
    if (!hash) {
      handled.current = '';
      window.scrollTo({ top: 0, behavior: 'auto' });
      return undefined;
    }
    if (handled.current === hash) return undefined;

    const id = hash.slice(1);
    // rAF rather than a timeout: run after paint, not after a guessed delay.
    const frame = requestAnimationFrame(() => {
      const target = document.getElementById(id);
      if (!target) return;
      handled.current = hash;
      target.scrollIntoView({ behavior: 'auto', block: 'start' });
    });

    return () => cancelAnimationFrame(frame);
  }, [hash, sectionCount]);

  return null;
};

const SiteRouter = () => {
  const { slug } = useParams();
  return slug ? <SitePortfolioDetailPage /> : <SitePage />;
};

export const SiteRoot = () => (
  <SiteContentProvider>
    <EnquiryProvider>
      <HashScroll />
      <SiteRouter />
    </EnquiryProvider>
  </SiteContentProvider>
);

export default SiteRoot;
