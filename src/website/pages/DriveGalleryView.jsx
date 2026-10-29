import { useCallback, useEffect, useState, useRef, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  Eye,
  Heart,
  Image as ImageIcon,
  Maximize2,
  Minimize2,
  Moon,
  Pause,
  Play,
  Share2,
  Sun,
  X,
  Sparkles,
  Calendar,
  Camera,
  Check,
  ArrowDownAZ,
  ArrowUpAZ,
  Clock,
  SlidersHorizontal,
  RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { driveGalleryApi, PUBLIC_API_BASE } from '@/api/driveGalleryApi';

// Safe chunk size for progressive auto-loading (24 photos per batch)
const CHUNK_SIZE = 36;

export const DriveGalleryView = () => {
  const { slug } = useParams();

  const [gallery, setGallery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sorting state (defaults to natural name order: 0001, 0002...)
  const [sortOrder, setSortOrder] = useState('name_asc');

  // Progressive auto-loading state
  const [visibleCount, setVisibleCount] = useState(CHUNK_SIZE);
  const [loadingMore, setLoadingMore] = useState(false);
  const isLoadingMoreRef = useRef(false);
  const sentinelRef = useRef(null);

  // Track images that failed all sources so we render clean placeholder
  const [failedImages, setFailedImages] = useState(new Set());

  // Lightbox state
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlayingSlideshow, setIsPlayingSlideshow] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Touch swipe support in lightbox
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);

  // Load public gallery
  useEffect(() => {
    const fetchGallery = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await driveGalleryApi.getPublicGallery(slug);
        setGallery(data);
        if (data?.gallerySettings?.sortOrder) {
          setSortOrder(data.gallerySettings.sortOrder);
        }
      } catch (err) {
        setError(
          err?.response?.data?.message ||
            'This photo gallery is currently private, unavailable, or does not exist.',
        );
      } finally {
        setLoading(false);
      }
    };

    if (slug) fetchGallery();
  }, [slug]);

  // 1. Strictly deduplicate photos by fileId
  const uniquePhotos = useMemo(() => {
    const seen = new Set();
    const list = [];
    for (const p of gallery?.photos || []) {
      if (p?.fileId && !seen.has(p.fileId)) {
        seen.add(p.fileId);
        list.push(p);
      }
    }
    return list;
  }, [gallery?.photos]);

  // 2. Naturally sort photos so Drive camera sequence (0001, 0002, 0003...) is strictly respected
  const sortedPhotos = useMemo(() => {
    const list = [...uniquePhotos];
    if (sortOrder === 'name_asc') {
      list.sort((a, b) =>
        (a.name || '').localeCompare(b.name || '', undefined, { numeric: true, sensitivity: 'base' }),
      );
    } else if (sortOrder === 'name_desc') {
      list.sort((a, b) =>
        (b.name || '').localeCompare(a.name || '', undefined, { numeric: true, sensitivity: 'base' }),
      );
    } else if (sortOrder === 'date_asc') {
      list.sort((a, b) => new Date(a.modifiedTime || 0) - new Date(b.modifiedTime || 0));
    } else if (sortOrder === 'date_desc') {
      list.sort((a, b) => new Date(b.modifiedTime || 0) - new Date(a.modifiedTime || 0));
    }
    return list;
  }, [uniquePhotos, sortOrder]);

  // Reset batch count when sort order changes
  const handleSortChange = (newSort) => {
    setSortOrder(newSort);
    setVisibleCount(CHUNK_SIZE);
  };

  // Safe throttled batch loader for automatic scrolling
  const loadNextBatch = useCallback(() => {
    if (isLoadingMoreRef.current) return;
    if (visibleCount >= sortedPhotos.length) return;

    isLoadingMoreRef.current = true;
    setLoadingMore(true);

    setTimeout(() => {
      setVisibleCount((prev) => Math.min(prev + CHUNK_SIZE, sortedPhotos.length));
      setLoadingMore(false);
      isLoadingMoreRef.current = false;
    }, 200);
  }, [visibleCount, sortedPhotos.length]);

  // Infinite scroll observer: automatically loads more as user scrolls down
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          loadNextBatch();
        }
      },
      {
        root: null,
        rootMargin: '450px 0px',
        threshold: 0.05,
      },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadNextBatch]);

  // Handle Share
  const handleShare = async () => {
    const url = window.location.href;
    const title = gallery?.title || 'Wedding Photo Gallery';
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // Fallback to clipboard
      }
    }
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    toast.success('Gallery link copied to clipboard!');
    setTimeout(() => setCopiedLink(false), 3000);
  };

  // Lightbox navigation
  const currentPhoto = lightboxIndex !== null ? sortedPhotos[lightboxIndex] : null;

  const handleOpenLightbox = (index) => {
    if (gallery?.gallerySettings?.enableLightbox === false) return;
    setLightboxIndex(index);
  };

  const handleCloseLightbox = () => {
    setLightboxIndex(null);
    setIsPlayingSlideshow(false);
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handlePrevPhoto = useCallback(() => {
    if (lightboxIndex === null) return;
    setLightboxIndex((prev) => (prev > 0 ? prev - 1 : sortedPhotos.length - 1));
  }, [lightboxIndex, sortedPhotos.length]);

  const handleNextPhoto = useCallback(() => {
    if (lightboxIndex === null) return;
    setLightboxIndex((prev) => (prev < sortedPhotos.length - 1 ? prev + 1 : 0));
  }, [lightboxIndex, sortedPhotos.length]);

  // Keyboard navigation
  useEffect(() => {
    if (lightboxIndex === null) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') handleCloseLightbox();
      else if (e.key === 'ArrowLeft') handlePrevPhoto();
      else if (e.key === 'ArrowRight') handleNextPhoto();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, handleNextPhoto, handlePrevPhoto]);

  // Slideshow timer
  useEffect(() => {
    if (!isPlayingSlideshow || lightboxIndex === null) return;
    const timer = setInterval(() => {
      handleNextPhoto();
    }, 4000);
    return () => clearInterval(timer);
  }, [isPlayingSlideshow, lightboxIndex, handleNextPhoto]);

  // Touch Swipe Handlers for mobile lightbox
  const handleTouchStart = (e) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const diff = touchStartX.current - touchEndX.current;
    if (diff > 50) {
      handleNextPhoto();
    } else if (diff < -50) {
      handlePrevPhoto();
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  // Toggle fullscreen
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Download photo handler
  const handleDownload = (photo) => {
    if (!photo) return;
    driveGalleryApi.trackDownload(slug);
    const downloadUrl = photo.downloadUrl || `https://drive.google.com/uc?export=download&id=${photo.fileId}`;
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.download = photo.name || 'photo.jpg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success('Starting high-res download...');
  };

  // ─── Loading & Error Screens ─────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0C0D0E] text-white flex flex-col items-center justify-center p-6 space-y-4">
        <div className="w-12 h-12 rounded-full border-2 border-[#D4AF37] border-t-transparent animate-spin" />
        <p className="text-xs uppercase tracking-widest text-[#D4AF37]/80 font-mono">
          Loading Gallery Memories...
        </p>
      </div>
    );
  }

  if (error || !gallery) {
    return (
      <div className="min-h-screen bg-[#0C0D0E] text-white flex flex-col items-center justify-center p-6 text-center space-y-5">
        <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#D4AF37]">
          <ImageIcon className="w-8 h-8 opacity-60" />
        </div>
        <div className="space-y-2 max-w-md">
          <h1 className="text-xl font-bold font-serif">Gallery Unavailable</h1>
          <p className="text-xs text-white/60 leading-relaxed">{error}</p>
        </div>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold bg-white/10 hover:bg-white/15 text-white transition border border-white/10"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Return to Homepage
        </Link>
      </div>
    );
  }

  // Visual Theme Tokens
  const theme = gallery.themeSettings?.theme || 'dark';
  const isDark = theme === 'dark' || (theme === 'auto' && window.matchMedia?.('(prefers-color-scheme: dark)').matches);
  const accent = gallery.themeSettings?.accentColor || '#D4AF37';
  const radius =
    gallery.themeSettings?.imageRadius === 'none'
      ? 'rounded-none'
      : gallery.themeSettings?.imageRadius === 'sm'
      ? 'rounded-md'
      : gallery.themeSettings?.imageRadius === 'lg'
      ? 'rounded-2xl'
      : 'rounded-xl';

  const visiblePhotos = sortedPhotos.slice(0, visibleCount);
  const allowDownloads = gallery.gallerySettings?.allowDownloads !== false;
  const coverUrl = gallery.coverImage?.viewUrl || gallery.coverImage?.thumbnailUrl;

  return (
    <div
      className={`min-h-screen transition-colors duration-300 font-sans selection:bg-[#D4AF37] selection:text-black ${
        isDark ? 'bg-[#0A0B0D] text-zinc-100' : 'bg-[#FAFAF9] text-zinc-900'
      }`}
      style={{ '--accent-color': accent }}
    >
      {/* ─── Top Studio Navbar ─── */}
      <header
        className={`sticky top-0 z-30 backdrop-blur-md border-b transition-colors px-6 py-4 flex items-center justify-between ${
          isDark ? 'bg-[#0A0B0D]/80 border-white/10' : 'bg-white/80 border-black/10'
        }`}
      >
        <div className="flex items-center gap-3">
          {gallery.branding?.enabled && (
            <div className="flex items-center gap-2">
              {gallery.branding?.studioLogoUrl ? (
                <img
                  src={gallery.branding.studioLogoUrl}
                  alt={gallery.branding.studioName}
                  className="h-7 w-auto object-contain"
                />
              ) : (
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center font-serif text-sm font-bold text-black"
                  style={{ backgroundColor: accent }}
                >
                  D
                </div>
              )}
              <span className="font-serif text-sm tracking-wider uppercase font-semibold">
                {gallery.branding?.studioName || 'Dynamic Photography'}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {gallery.gallerySettings?.showPhotoCount && (
            <span
              className={`text-2xs font-mono uppercase tracking-wider px-3 py-1 rounded-full border ${
                isDark ? 'bg-white/5 border-white/10 text-zinc-300' : 'bg-black/5 border-black/10 text-zinc-700'
              }`}
            >
              {sortedPhotos.length} Photographs
            </span>
          )}

          <button
            type="button"
            onClick={handleShare}
            className={`p-2 rounded-full border transition flex items-center gap-1.5 text-xs font-medium ${
              isDark
                ? 'bg-white/5 border-white/10 hover:bg-white/10 text-zinc-200'
                : 'bg-black/5 border-black/10 hover:bg-black/10 text-zinc-800'
            }`}
            title="Share Gallery"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copiedLink ? 'Copied' : 'Share'}</span>
          </button>
        </div>
      </header>

      {/* ─── Hero Cover Section ─── */}
      <section className="relative overflow-hidden">
        {coverUrl ? (
          <div className="relative h-[48vh] sm:h-[58vh] md:h-[68vh] w-full bg-black overflow-hidden flex items-end">
            <img
              src={coverUrl}
              alt={gallery.title}
              className="absolute inset-0 w-full h-full object-cover scale-105 filter brightness-[0.7] animate-fade-in"
              onError={(e) => {
                e.currentTarget.onerror = null;
                if (gallery.coverImage?.fileId) {
                  e.currentTarget.src = `${PUBLIC_API_BASE}/public/drive-galleries/image/${gallery.coverImage.fileId}?sz=w1600`;
                }
              }}
            />
            {/* Dark Vignette Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

            <div className="relative z-10 p-6 sm:p-12 md:p-16 max-w-5xl mx-auto w-full space-y-3 text-white">
              {gallery.clientNames && (
                <div
                  className="inline-flex items-center gap-2 text-2xs uppercase tracking-[0.25em] font-semibold px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/20"
                  style={{ color: accent }}
                >
                  <Sparkles className="w-3 h-3" />
                  <span>{gallery.clientNames}</span>
                </div>
              )}

              <h1 className="text-3xl sm:text-5xl md:text-6xl font-serif font-bold tracking-tight text-white drop-shadow-md">
                {gallery.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-xs text-white/80 font-mono">
                {gallery.eventDate && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 opacity-60" />
                    <span>
                      {new Date(gallery.eventDate).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                )}
                {gallery.photographerName && (
                  <div className="flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 opacity-60" />
                    <span>Captured by {gallery.photographerName}</span>
                  </div>
                )}
              </div>

              {gallery.description && (
                <p className="text-xs sm:text-sm text-white/85 max-w-2xl leading-relaxed pt-1">
                  {gallery.description}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="py-16 px-6 text-center max-w-3xl mx-auto space-y-4">
            <h1 className="text-3xl sm:text-4xl font-serif font-bold">{gallery.title}</h1>
            {gallery.clientNames && (
              <p className="text-sm uppercase tracking-widest font-mono" style={{ color: accent }}>
                {gallery.clientNames}
              </p>
            )}
            {gallery.description && (
              <p className="text-xs sm:text-sm opacity-70 leading-relaxed">{gallery.description}</p>
            )}
          </div>
        )}
      </section>

      {/* ─── Gallery Content & Photo Grid ─── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6">
        {/* Sort & Count Toolbar */}
        {sortedPhotos.length > 0 && (
          <div
            className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-xl border text-xs transition-colors ${
              isDark ? 'bg-zinc-900/60 border-white/10 text-zinc-300' : 'bg-white border-black/10 text-zinc-700'
            }`}
          >
            <div className="flex items-center gap-2 text-2xs font-mono uppercase tracking-wider">
              <span>
                Showing <strong>{Math.min(visibleCount, sortedPhotos.length)}</strong> of <strong>{sortedPhotos.length}</strong> photos
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-3xs uppercase font-mono tracking-wider opacity-60">Sort By:</span>
              <select
                value={sortOrder}
                onChange={(e) => handleSortChange(e.target.value)}
                className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium cursor-pointer transition focus:outline-hidden ${
                  isDark
                    ? 'bg-zinc-800 border-white/10 text-zinc-200'
                    : 'bg-zinc-50 border-black/10 text-zinc-800'
                }`}
              >
                <option value="name_asc">Drive Order / File Name (A to Z)</option>
                <option value="date_asc">Timeline (Oldest to Newest)</option>
                <option value="date_desc">Timeline (Newest to Oldest)</option>
                <option value="name_desc">File Name (Z to A)</option>
              </select>
            </div>
          </div>
        )}

        {sortedPhotos.length > 0 ? (
          <>
            {/* Stable Row-by-Row Grid (Photos never jump or reflow across columns) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
              {visiblePhotos.map((photo, index) => {
                const isFailed = failedImages.has(photo.fileId);

                return (
                  <div
                    key={photo.fileId || `photo-${index}`}
                    onClick={() => handleOpenLightbox(index)}
                    className={`group relative aspect-[3/4] overflow-hidden cursor-pointer shadow-xs transition-all duration-300 hover:shadow-xl ${radius} ${
                      isDark ? 'bg-zinc-900 border border-white/5' : 'bg-zinc-100 border border-black/5'
                    }`}
                  >
                    {!isFailed ? (
                      <img
                        src={photo.thumbnailUrl || `https://lh3.googleusercontent.com/d/${photo.fileId}=w800`}
                        alt={photo.name}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500 ease-out"
                        onError={(e) => {
                          // CRITICAL: Stop infinite loop immediately
                          e.currentTarget.onerror = null;

                          // Try our secure server image streaming proxy once
                          const proxyUrl = `${PUBLIC_API_BASE}/public/drive-galleries/image/${photo.fileId}?sz=w800`;
                          if (!e.currentTarget.src.includes('/drive-galleries/image/')) {
                            e.currentTarget.src = proxyUrl;
                          } else {
                            // If proxy also fails, mark failed and render placeholder card
                            setFailedImages((prev) => new Set(prev).add(photo.fileId));
                          }
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center opacity-40 space-y-2">
                        <ImageIcon className="w-8 h-8" />
                        <span className="text-4xs font-mono truncate max-w-full">{photo.name}</span>
                      </div>
                    )}

                    {/* Dark subtle hover overlay */}
                    <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-between p-3 text-white">
                      <div className="flex justify-between items-start">
                        <span className="text-4xs font-mono bg-black/60 px-1.5 py-0.5 rounded text-white/80">
                          #{index + 1}
                        </span>
                        {allowDownloads && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownload(photo);
                            }}
                            className="p-1.5 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-xs transition"
                            title="Download high-resolution image"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="space-y-0.5">
                        {gallery.gallerySettings?.showFilenames && (
                          <p className="text-3xs font-mono truncate text-white/90">{photo.name}</p>
                        )}
                        <div className="flex items-center gap-1 text-4xs uppercase tracking-widest text-white/70 font-mono">
                          <Eye className="w-3 h-3" /> Click to enlarge
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Invisible sentinel for smooth auto-loading on scroll */}
            <div ref={sentinelRef} className="h-6 w-full pointer-events-none" />

            {/* Seamless Auto-Loading / Clickable Indicator */}
            {visibleCount < sortedPhotos.length && (
              <div className="pt-6 pb-8 text-center flex flex-col items-center justify-center space-y-2">
                <button
                  type="button"
                  onClick={loadNextBatch}
                  className="flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-xs text-white font-mono cursor-pointer transition shadow-sm"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingMore ? 'animate-spin' : ''}`} style={{ color: accent }} />
                  <span>
                    {loadingMore ? 'Loading photographs...' : `Load more photographs (${visibleCount} of ${sortedPhotos.length})`}
                  </span>
                </button>
              </div>
            )}

            {/* End of Gallery Indicator */}
            {visibleCount >= sortedPhotos.length && sortedPhotos.length > 0 && (
              <div className="pt-8 pb-4 text-center">
                <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-3xs font-mono uppercase tracking-widest text-zinc-400 bg-white/5 border border-white/10">
                  <Check className="w-3 h-3 text-emerald-400" />
                  All {sortedPhotos.length} photographs loaded
                </span>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20 space-y-3 opacity-60">
            <ImageIcon className="w-12 h-12 mx-auto stroke-1" />
            <p className="text-sm">No photographs found in this gallery yet.</p>
          </div>
        )}
      </main>

      {/* ─── Footer Section ─── */}
      <footer
        className={`border-t py-12 px-6 text-center space-y-4 text-xs transition-colors ${
          isDark ? 'border-white/10 text-zinc-400' : 'border-black/10 text-zinc-600'
        }`}
      >
        {gallery.branding?.introMessage && (
          <p className="max-w-xl mx-auto italic leading-relaxed text-sm">
            "{gallery.branding.introMessage}"
          </p>
        )}
        <div className="pt-2 space-y-1">
          <p className="font-serif tracking-wider uppercase text-2xs font-semibold">
            {gallery.branding?.studioName || 'Dynamic Photography'}
          </p>
          <p className="text-3xs opacity-60">
            {gallery.branding?.footerText || 'All original photographs preserved on Google Drive.'}
          </p>
        </div>
      </footer>

      {/* ─── Lightbox Modal ─── */}
      {lightboxIndex !== null && currentPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between select-none animate-fade-in"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Lightbox Topbar */}
          <div className="flex items-center justify-between p-4 sm:p-6 text-white/90 z-20 bg-gradient-to-b from-black/80 to-transparent">
            <div className="flex items-center gap-3">
              <span className="text-2xs font-mono uppercase tracking-widest text-[#D4AF37]">
                {lightboxIndex + 1} / {sortedPhotos.length}
              </span>
              <span className="text-xs text-white/60 font-mono truncate max-w-[200px] hidden sm:inline">
                {currentPhoto.name}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {gallery.gallerySettings?.enableSlideshow && (
                <button
                  type="button"
                  onClick={() => setIsPlayingSlideshow(!isPlayingSlideshow)}
                  className={`p-2 rounded-full transition ${
                    isPlayingSlideshow ? 'bg-[#D4AF37] text-black' : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                  title={isPlayingSlideshow ? 'Pause Slideshow' : 'Play Slideshow'}
                >
                  {isPlayingSlideshow ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
              )}

              {allowDownloads && (
                <button
                  type="button"
                  onClick={() => handleDownload(currentPhoto)}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
                  title="Download High-Res Original"
                >
                  <Download className="w-4 h-4" />
                </button>
              )}

              <button
                type="button"
                onClick={handleToggleFullscreen}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition hidden sm:inline-flex"
                title="Toggle Fullscreen"
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={handleCloseLightbox}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
                title="Close Lightbox (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Lightbox Center: Image & Navigation */}
          <div className="relative flex-1 flex items-center justify-center p-2 sm:p-6 overflow-hidden">
            {/* Prev Button */}
            <button
              type="button"
              onClick={handlePrevPhoto}
              className="absolute left-3 sm:left-6 z-20 p-3 sm:p-4 rounded-full bg-black/40 hover:bg-black/80 text-white/80 hover:text-white transition backdrop-blur-xs border border-white/10"
              title="Previous Photo (Left Arrow)"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            {/* Main High-Res Image with Fallback */}
            <div className="relative max-h-full max-w-full flex items-center justify-center">
              <img
                key={currentPhoto.fileId}
                src={currentPhoto.viewUrl || `https://lh3.googleusercontent.com/d/${currentPhoto.fileId}=w2048`}
                alt={currentPhoto.name}
                className="max-h-[82vh] max-w-[92vw] w-auto h-auto object-contain select-none shadow-2xl animate-scale-in"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = `${PUBLIC_API_BASE}/public/drive-galleries/image/${currentPhoto.fileId}?sz=w1600`;
                }}
              />
            </div>

            {/* Next Button */}
            <button
              type="button"
              onClick={handleNextPhoto}
              className="absolute right-3 sm:right-6 z-20 p-3 sm:p-4 rounded-full bg-black/40 hover:bg-black/80 text-white/80 hover:text-white transition backdrop-blur-xs border border-white/10"
              title="Next Photo (Right Arrow)"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {/* Lightbox Bottom Strip: Thumbnail Scroller */}
          <div className="p-3 bg-black/80 backdrop-blur-md overflow-x-auto z-20 flex items-center justify-center gap-2">
            {sortedPhotos.slice(Math.max(0, lightboxIndex - 4), lightboxIndex + 5).map((p, idx) => {
              const actualIdx = Math.max(0, lightboxIndex - 4) + idx;
              const isSelected = actualIdx === lightboxIndex;
              return (
                <button
                  key={p.fileId}
                  type="button"
                  onClick={() => setLightboxIndex(actualIdx)}
                  className={`h-12 w-12 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${
                    isSelected ? 'border-[#D4AF37] scale-110 shadow-md' : 'border-transparent opacity-50 hover:opacity-100'
                  }`}
                >
                  <img
                    src={p.thumbnailUrl || `https://lh3.googleusercontent.com/d/${p.fileId}=w200`}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = `${PUBLIC_API_BASE}/public/drive-galleries/image/${p.fileId}?sz=w200`;
                    }}
                  />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default DriveGalleryView;
