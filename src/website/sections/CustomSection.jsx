import { useState } from 'react';
import { cn } from '@/utils/cn';
import { Reveal } from '../components/Reveal';
import { SectionHeading } from '../components/SectionHeading';
import { SiteButton } from '../components/SiteButton';
import { VideoEmbed } from '../components/VideoEmbed';

// Spelled out in full so Tailwind can see every class it must generate.
const LAPTOP_COLUMNS = { 2: 'lg:grid-cols-2', 3: 'lg:grid-cols-3', 4: 'lg:grid-cols-4' };

/** On a phone only this many show up front; the rest wait behind one tap. */
const PHONE_PREVIEW = 6;

/**
 * A section the studio built in the admin: a heading and a grid of videos.
 * Three across on a laptop (or the number chosen in the admin), two on a
 * tablet, one on a phone.
 */
export const CustomSection = ({ section, tint = false }) => {
  const [showAll, setShowAll] = useState(false);
  const videos = section?.videos ?? [];
  if (videos.length === 0) return null;

  const hiddenOnPhone = videos.length > PHONE_PREVIEW && !showAll;

  return (
    <section id={section.slug} aria-label={section.title} className={tint ? 'bg-site-paper-alt' : 'bg-site-paper'}>
      <div className="mx-auto max-w-8xl px-5 py-16 sm:px-8 sm:py-24 lg:px-12 lg:py-28">
        <SectionHeading eyebrow={section.eyebrow} title={section.title} subtitle={section.description} align="center" />

        <ul
          className={cn(
            'mt-10 grid grid-cols-1 gap-x-5 gap-y-8 sm:mt-12 sm:grid-cols-2 sm:gap-y-10',
            LAPTOP_COLUMNS[section.columns] ?? LAPTOP_COLUMNS[3],
          )}
        >
          {videos.map((video, index) => (
            <Reveal
              as="li"
              key={video.id ?? `${video.url}-${index}`}
              delay={(index % 3) * 80}
              className={cn(index >= PHONE_PREVIEW && hiddenOnPhone && 'hidden sm:block')}
            >
              <VideoEmbed
                url={video.url}
                label={video.title ? `Play ${video.title}` : `Play video ${index + 1}`}
                compact
              />
              {video.title && (
                <p className="mt-3 break-words text-center font-serif text-lg font-light text-site-ink sm:text-xl">
                  {video.title}
                </p>
              )}
            </Reveal>
          ))}
        </ul>

        {hiddenOnPhone && (
          <div className="mt-10 flex justify-center sm:hidden">
            <SiteButton variant="ghost" onClick={() => setShowAll(true)}>
              Show all {videos.length} videos
            </SiteButton>
          </div>
        )}
      </div>
    </section>
  );
};

export default CustomSection;
