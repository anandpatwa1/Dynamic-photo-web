import { useState } from 'react';
import { Play } from 'lucide-react';
import { cn } from '@/utils/cn';

/** Extracts the stable video id from watch, short, embed, shorts and live YouTube URLs. */
export const getYouTubeId = (value) => {
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, '').replace(/^m\./, '');
    if (host === 'youtu.be') return url.pathname.slice(1).split('/')[0] || null;
    if (host.endsWith('youtube.com') || host.endsWith('youtube-nocookie.com')) {
      const fromPath = url.pathname.match(/^\/(?:embed|shorts|live|v)\/([\w-]{6,})/)?.[1];
      return url.searchParams.get('v') || fromPath || null;
    }
  } catch {
    // Not a URL: the caller shows a plain link instead.
  }
  return null;
};

/** Extracts the file id from a Google Drive share link. */
export const getDriveId = (value) => {
  try {
    const url = new URL(value);
    if (url.hostname !== 'drive.google.com') return null;
    return url.pathname.match(/\/file\/d\/([A-Za-z0-9_-]+)/)?.[1] ?? url.searchParams.get('id');
  } catch {
    return null;
  }
};

/** Which player a link needs, so the admin can show it and the site can embed it. */
export const describeVideo = (value) => {
  const youTubeId = getYouTubeId(value);
  if (youTubeId) return { kind: 'youtube', id: youTubeId };
  const driveId = getDriveId(value);
  if (driveId) return { kind: 'drive', id: driveId };
  return { kind: 'other', id: null };
};

/*
 * YouTube publishes the thumbnail in several sizes and not every video has the
 * big one. Asking for the biggest first and stepping down keeps the poster
 * sharp; the 480x360 default is what looked blurry when stretched.
 */
const YOUTUBE_POSTERS = ['maxresdefault', 'sddefault', 'hqdefault'];

/**
 * A 16:9 video that plays where it stands. Shows a poster and a play button
 * first, so a page with a dozen films downloads a dozen small pictures instead
 * of a dozen players. YouTube and Google Drive are embedded; any other link
 * opens in a new tab.
 */
export const VideoEmbed = ({ url, label = 'Watch video', className, compact = false }) => {
  const [playing, setPlaying] = useState(false);
  const [posterStep, setPosterStep] = useState(0);
  const [posterFailed, setPosterFailed] = useState(false);

  const { kind, id } = describeVideo(url);

  if (kind === 'other') {
    return (
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className={cn(
          'inline-flex min-h-[44px] items-center gap-2 text-site-eyebrow font-medium uppercase text-site-ink underline',
          className,
        )}
      >
        <Play className="h-4 w-4" /> {label}
      </a>
    );
  }

  const embedSrc =
    kind === 'youtube'
      ? `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1&playsinline=1`
      : `https://drive.google.com/file/d/${id}/preview`;
  const posterSrc =
    kind === 'youtube'
      ? `https://i.ytimg.com/vi/${id}/${YOUTUBE_POSTERS[posterStep]}.jpg`
      : `https://drive.google.com/thumbnail?id=${id}&sz=w1280`;

  const nextPoster = () => {
    if (kind === 'youtube' && posterStep < YOUTUBE_POSTERS.length - 1) setPosterStep(posterStep + 1);
    else setPosterFailed(true);
  };

  if (playing) {
    return (
      <div className={cn('aspect-video overflow-hidden bg-site-ink', className)}>
        <iframe
          className="h-full w-full"
          src={embedSrc}
          title={label}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      className={cn(
        'group relative block aspect-video w-full overflow-hidden bg-site-ink text-left',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-accent',
        className,
      )}
      aria-label={`${label}: play on this page`}
    >
      {!posterFailed && (
        <img
          key={posterSrc}
          src={posterSrc}
          alt=""
          loading="lazy"
          decoding="async"
          // YouTube answers a missing size with a tiny grey placeholder that
          // still counts as a successful load, so its width is checked too.
          onLoad={(event) => {
            if (kind === 'youtube' && event.currentTarget.naturalWidth <= 120) nextPoster();
          }}
          onError={nextPoster}
          className="h-full w-full object-cover opacity-90 transition-transform duration-500 group-hover:scale-105"
        />
      )}
      <span className="absolute inset-0 grid place-items-center bg-site-ink/20">
        <span
          className={cn(
            'grid place-items-center rounded-full bg-white text-site-ink shadow-lg transition-transform duration-300 group-hover:scale-110',
            compact ? 'h-12 w-12' : 'h-14 w-14 sm:h-16 sm:w-16',
          )}
        >
          <Play className="ml-0.5 h-5 w-5 sm:h-6 sm:w-6" fill="currentColor" />
        </span>
      </span>
    </button>
  );
};

export default VideoEmbed;
