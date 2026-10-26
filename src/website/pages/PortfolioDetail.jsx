import { storyMetadata } from '../utils/storyMetadata';
import { useEffect, useState } from 'react';
import { TILE_RATIOS } from '../utils/portfolioView';
import { ArrowLeft, ZoomIn } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { Reveal } from '../components/Reveal';
import { SmoothImage } from '../components/SmoothImage';
import { Lightbox } from '../components/Lightbox';
import { VideoEmbed } from '../components/VideoEmbed';
import { publicApi } from '../api/publicApi';

/**
 * A photo keeps its own shape when the server recorded it. Older photos were
 * cropped into a fixed frame and carry no ratio, so they keep that frame.
 * Extreme panoramas and totems are clamped so one tile cannot take over a column.
 */
const ratioOf = (image) => {
  const ratio = Number(image?.ratio);
  if (!Number.isFinite(ratio) || ratio <= 0) return '4 / 5';
  return `${Math.min(3, Math.max(0.4, ratio))} / 1`;
};

/** A cover-style tile that opens the photo full screen. */
const ZoomTile = ({ image, index, onOpen, ...imageProps }) => (
  <button
    type="button"
    onClick={() => onOpen(index)}
    className="group relative block w-full cursor-zoom-in overflow-hidden text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-accent"
    aria-label={`View photo ${index + 1} larger${image?.alt ? `: ${image.alt}` : ''}`}
  >
    <div className="transition-transform duration-700 ease-smooth group-hover:scale-[1.03]">
      <SmoothImage asset={image} alt={image?.alt || ''} {...imageProps} />
    </div>
    <span
      className="pointer-events-none absolute bottom-3 right-3 grid h-9 w-9 place-items-center rounded-full bg-white/85 text-site-ink opacity-0 shadow transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100"
      aria-hidden="true"
    >
      <ZoomIn className="h-4 w-4" />
    </span>
  </button>
);

/**
 * Masonry, not a fixed-ratio grid: a wedding shoot mixes tall portraits and
 * wide landscapes, and forcing them into one frame crops heads and skylines.
 */
const Gallery = ({ images }) => {
  const [open, setOpen] = useState(null);
  if (!images?.length) return null;

  return (
    <>
      <div className="mt-7 columns-1 gap-3 sm:columns-2 sm:gap-5 lg:columns-3">
        {images.map((image, index) => (
          <div key={`${image?.url}-${index}`} className="mb-3 break-inside-avoid sm:mb-5">
            <Reveal delay={(index % 3) * 80}>
              <ZoomTile
                image={image}
                index={index}
                onOpen={setOpen}
                ratio={ratioOf(image)}
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              />
            </Reveal>
          </div>
        ))}
      </div>

      <Lightbox images={images} index={open} onClose={() => setOpen(null)} onIndexChange={setOpen} />
    </>
  );
};

const VideoPlayer = ({ url, label = 'Watch video', posterUrl }) => (
  <VideoEmbed url={url} label={label} posterUrl={posterUrl} className="w-full" />
);

const Skeleton = () => (
  <main id="main" className="min-h-screen bg-site-paper pb-20 pt-28 sm:pt-32" aria-busy="true" aria-label="Loading portfolio story">
    <div className="mx-auto max-w-8xl animate-pulse px-5 sm:px-8 lg:px-12">
      <div className="h-3 w-32 bg-site-paper-alt" />
      <div className="mt-8 h-3 w-24 bg-site-paper-alt" />
      <div className="mt-4 h-12 w-3/4 max-w-xl bg-site-paper-alt" />
      <div className="mt-10 aspect-video w-full bg-site-paper-alt" />
    </div>
  </main>
);

export const PortfolioDetail = () => {
  const { slug } = useParams();
  const [item, setItem] = useState(null);
  const [error, setError] = useState(false);
  const [coverOpen, setCoverOpen] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    setItem(null);
    setError(false);
    setCoverOpen(null);
    window.scrollTo(0, 0);

    publicApi
      .getPortfolioDetail(slug, controller.signal)
      .then((payload) => {
        const story = payload?.data?.item ?? null;
        if (story) setItem(story);
        else setError(true);
      })
      .catch((requestError) => {
        if (requestError.name !== 'AbortError' && requestError.code !== 'ERR_CANCELED') setError(true);
      });

    return () => controller.abort();
  }, [slug]);

  useEffect(() => item?.title ? storyMetadata(item, 'Dynamic Photography') : undefined, [item]);

  if (error) {
    return (
      <main id="main" className="mx-auto min-h-screen max-w-3xl px-5 pb-20 pt-36 text-center sm:px-8">
        <h1 className="font-serif text-site-h2 font-light text-site-ink">Story not found</h1>
        <Link to="/#portfolio" className="mt-8 inline-flex items-center gap-2 text-site-eyebrow uppercase text-site-ink underline">
          <ArrowLeft className="h-4 w-4" /> Back to portfolio
        </Link>
      </main>
    );
  }

  if (!item) return <Skeleton />;

  // An album with no photos and no film would only print a lonely heading.
  const albums = (item.albums ?? []).filter((album) => album.images?.length || album.videoUrl);
  const coverRatio = TILE_RATIOS[item.span] || TILE_RATIOS.std;
  const films = [...new Set([item.videoUrl, ...(item.videoUrls || [])].filter(Boolean))];
  const filmInfo = url => item.filmDetails?.find(film=>film.url===url) || {};
  const hasFilms = films.length > 0 || item.videos?.length > 0;
  const looseGallery = item.gallery ?? [];
  const hasAnyPhotos = albums.some((album) => album.images?.length) || looseGallery.length > 0;

  return (
    <main id="main" className="bg-site-paper pb-20 pt-28 sm:pt-32">
      <article className="mx-auto max-w-8xl px-5 sm:px-8 lg:px-12">
        <Link
          to="/#portfolio"
          className="inline-flex min-h-[44px] items-center gap-2 text-site-eyebrow font-medium uppercase text-site-muted transition-colors hover:text-site-ink"
        >
          <ArrowLeft className="h-4 w-4" /> Back to portfolio
        </Link>

        <Reveal className="mt-4 max-w-3xl sm:mt-6">
          <p className="text-site-eyebrow font-medium uppercase text-site-accent">
            {item.category?.replace(/-/g, ' ')}
          </p>
          <h1 className="mt-4 break-words font-serif text-site-h1 font-light text-site-ink">{item.title}</h1>
          {(item.location || item.eventDate) && (
            <p className="mt-4 text-site-body text-site-muted">
              {[item.location, item.eventDate && new Date(item.eventDate).getFullYear()].filter(Boolean).join(' · ')}
            </p>
          )}
          {item.description && <p className="mt-6 max-w-2xl whitespace-pre-line text-site-body">{item.description}</p>}
        </Reveal>

        <Reveal delay={120} className="mx-auto mt-8 sm:mt-12" style={{maxWidth: `min(768px, calc(65svh * ${coverRatio}))`}}>
          <ZoomTile image={item.coverImage} index={0} onOpen={setCoverOpen} ratio={`${coverRatio} / 1`} imgClassName="object-contain" className="bg-transparent" sizes="(min-width: 768px) 768px, 100vw" priority />
        </Reveal>
        <Lightbox
          images={item.coverImage ? [item.coverImage] : []}
          index={coverOpen}
          onClose={() => setCoverOpen(null)}
          onIndexChange={setCoverOpen}
        />

        {hasFilms && <section aria-label="Films" className="mt-10 grid gap-5 md:grid-cols-2">
          {films.map((url,i)=><figure key={url} className="min-w-0"><VideoPlayer url={url} label={filmInfo(url).title || `Watch film ${i+1}`} posterUrl={filmInfo(url).posterUrl}/><figcaption className="mt-3 break-words font-serif text-xl text-site-ink">{filmInfo(url).title || `${item.title} — Film ${i+1}`}</figcaption></figure>)}
          {(item.videos || []).map((video,i)=><figure key={video.url} className="min-w-0"><video controls playsInline preload="none" poster={filmInfo(video.url).posterUrl} className="aspect-video w-full rounded-xl bg-black object-contain" src={video.url} aria-label={filmInfo(video.url).title || video.title || `Film ${i+1}`}/><figcaption className="mt-3 break-words font-serif text-xl text-site-ink">{filmInfo(video.url).title || video.title || `${item.title} — Film ${i+1}`}</figcaption></figure>)}
        </section>}

        {albums.length > 1 && <nav aria-label="Shoot albums" className="mt-10 flex gap-2 overflow-x-auto pb-2">{albums.map(album=><a key={album.id} href={`#album-${album.id}`} className="inline-flex min-h-11 shrink-0 items-center rounded-full border border-site-line px-4 text-sm text-site-ink">{album.title}{album.images?.length ? ` · ${album.images.length}` : ''}</a>)}</nav>}

        {albums.length > 0 ? (
          <div className="mt-16 grid gap-x-6 gap-y-16 md:grid-cols-2 sm:mt-20">
            {albums.map((album) => (
              <section id={`album-${album.id}`} key={album.id} className={album.images?.length ? "md:col-span-2" : "min-w-0"}>
                <Reveal>
                  <h2 className="break-words font-serif text-site-h2 font-light text-site-ink">{album.title}</h2>
                </Reveal>
                <p className="mt-3 text-sm text-site-muted">{album.images?.length ? `${album.images.length} photographs` : 'Film collection'}</p>
                {album.description && <p className="mt-4 max-w-2xl whitespace-pre-line text-site-body">{album.description}</p>}
                {album.videoUrl && <div className={`mt-7 ${album.images?.length ? "md:w-1/2 md:pr-3" : ""}`}><VideoPlayer url={album.videoUrl} label={album.videoTitle || `Watch ${album.title} video`} posterUrl={album.videoPosterUrl}/>{album.videoTitle && <p className="mt-3 font-serif text-xl text-site-ink">{album.videoTitle}</p>}</div>}
                <Gallery images={album.images} />
              </section>
            ))}
            {looseGallery.length > 0 && (
              <section className="md:col-span-2">
                <Reveal>
                  <h2 className="font-serif text-site-h2 font-light text-site-ink">More moments</h2>
                </Reveal>
                <Gallery images={looseGallery} />
              </section>
            )}
          </div>
        ) : (
          <Gallery images={looseGallery} />
        )}

        {!hasAnyPhotos && !item.videoUrl && !item.videoUrls?.length && !item.videos?.length && (
          <p className="mt-16 text-center text-site-body text-site-muted">More photographs from this story are coming soon.</p>
        )}
        <section className="mt-14 border-t border-site-line pt-10 text-center sm:mt-20">
          <h2 className="font-serif text-site-h2 text-site-ink">Let’s tell your story</h2>
          <p className="mt-3 text-site-body text-site-muted">Tell us about your celebration and the moments that matter to you.</p>
          <Link to="/#contact" className="mt-6 inline-flex min-h-11 items-center justify-center bg-site-ink px-7 py-3 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-accent">Enquire about your date</Link>
        </section>
      </article>
    </main>
  );
};

export default PortfolioDetail;
