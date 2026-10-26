import { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Reveal } from '../components/Reveal';
import { SectionHeading } from '../components/SectionHeading';
import { SiteButton } from '../components/SiteButton';
import { VideoEmbed } from '../components/VideoEmbed';

// Spelled out in full so Tailwind can see every class it must generate.
const LAPTOP_COLUMNS = { 2: 'lg:grid-cols-2', 3: 'lg:grid-cols-3', 4: 'lg:grid-cols-4' };

const PHONE_BATCH = 4;
const DESKTOP_BATCH = 6;

/**
 * A section the studio built in the admin: a heading and a grid of videos.
 * Three across on a laptop (or the number chosen in the admin), two on a
 * tablet, one on a phone.
 */
export const CustomSection = ({ section, tint = false }) => {
  const [page, setPage] = useState(1);
  const videos = section?.videos ?? [];
  if (videos.length === 0) return null;

  const phoneVisible = page * PHONE_BATCH;
  const desktopVisible = page * DESKTOP_BATCH;
  const phoneHasMore = videos.length > phoneVisible;
  const desktopHasMore = videos.length > desktopVisible;
  const hasPlaylistLink = section.videoSource === 'youtube_playlist' && Boolean(section.playlistUrl);

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
              className={cn(
                index >= desktopVisible && 'hidden',
                index >= phoneVisible && index < desktopVisible && 'hidden sm:block',
              )}
            >
              <VideoEmbed
                url={video.url}
                posterUrl={video.posterUrl}
                label={video.title ? `Play ${video.title}` : `Play video ${index + 1}`}
                compact
              />
              {(
                <p className="mt-3 break-words text-center font-serif text-lg font-light text-site-ink sm:text-xl">
                  {video.title || `${section.title} — Film ${index + 1}`}
                </p>
              )}
            </Reveal>
          ))}
        </ul>

        <div
          className={cn(
            'mt-10 flex flex-wrap justify-center gap-3 sm:mt-12',
            !phoneHasMore && !hasPlaylistLink && 'hidden',
            !desktopHasMore && !hasPlaylistLink && 'sm:hidden',
          )}
        >
          {phoneHasMore && (
            <div className="sm:hidden">
              <SiteButton variant="ghost" onClick={() => setPage((current) => current + 1)}>
                Load more videos ({videos.length - phoneVisible} more)
              </SiteButton>
            </div>
          )}
          {desktopHasMore && (
            <div className="hidden sm:block">
              <SiteButton variant="ghost" onClick={() => setPage((current) => current + 1)}>
                Load more videos ({videos.length - desktopVisible} more)
              </SiteButton>
            </div>
          )}
          {hasPlaylistLink && (
            <SiteButton
              href={section.playlistUrl}
              target="_blank"
              rel="noopener noreferrer"
              variant="ghost"
              withArrow={false}
            >
              <span className="inline-flex items-center gap-2">
                See more on YouTube <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </span>
            </SiteButton>
          )}
        </div>
      </div>
    </section>
  );
};

export default CustomSection;
