import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  Clock,
  ExternalLink,
  Image as ImageIcon,
  Instagram,
  Layers,
  Lock,
  Mail,
  MessageSquare,
  Play,
  Sparkles,
} from 'lucide-react';
import { publicApi } from '../api/publicApi';

// Video embed helper that safely formats YouTube, Vimeo or returns direct video
const getEmbedVideoUrl = (url = '') => {
  if (!url) return null;
  const str = String(url).trim();

  // YouTube standard or short
  const ytMatch =
    str.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/i);
  if (ytMatch) {
    return { type: 'iframe', src: `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?rel=0` };
  }

  // Vimeo
  const vimeoMatch = str.match(/vimeo\.com\/(?:video\/)?([0-9]+)/i);
  if (vimeoMatch) {
    return { type: 'iframe', src: `https://player.vimeo.com/video/${vimeoMatch[1]}` };
  }

  // Direct video
  if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(str)) {
    return { type: 'video', src: str };
  }

  return { type: 'fallback', src: str };
};

// Anonymous, privacy-conscious session generator (no fingerprinting, no PII)
const getAnonymousSessionId = (projectSlug) => {
  try {
    const key = `wq_sid_${projectSlug}`;
    let sid = sessionStorage.getItem(key);
    if (!sid) {
      sid = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : 's_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
      sessionStorage.setItem(key, sid);
    }
    return sid;
  } catch {
    return 's_' + Math.random().toString(36).substring(2, 15);
  }
};

export const WeddingQrLanding = () => {
  const { slug } = useParams();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isInactive, setIsInactive] = useState(false);

  // Multi-page navigation state: 'gate' (Step 1 & 2) vs 'photos' (Next Page)
  const [currentView, setCurrentView] = useState('gate');

  // Guest interaction states
  const [hasOpenedInstagram, setHasOpenedInstagram] = useState(() => {
    try {
      return sessionStorage.getItem(`wq_ig_opened_${slug}`) === 'true';
    } catch {
      return false;
    }
  });

  // Registration Form States
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [consentEmail, setConsentEmail] = useState(false);
  const [consentWhatsApp, setConsentWhatsApp] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [registrationMessage, setRegistrationMessage] = useState('');
  const [registrationError, setRegistrationError] = useState('');

  // Keep Instagram opened state in sync if slug changes
  useEffect(() => {
    try {
      setHasOpenedInstagram(sessionStorage.getItem(`wq_ig_opened_${slug}`) === 'true');
    } catch {
      setHasOpenedInstagram(false);
    }
  }, [slug]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    publicApi
      .getWeddingQrProject(slug, controller.signal)
      .then((res) => {
        const data = res?.data || res;
        if (data?.isInactive) {
          setIsInactive(true);
          setProject(data);
        } else if (data) {
          setProject(data);
          // Track landing page visit with anonymous session ID
          if (slug && !data.isInactive) {
            const sid = getAnonymousSessionId(slug);
            publicApi
              .trackWeddingQrEvent(slug, 'landing_page_view', {
                sessionId: sid,
                referrer: document.referrer || null,
              })
              .catch(() => {});
          }
        } else {
          setError('Gallery not found');
        }
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          setError(err?.message || 'Could not load event photos');
        }
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [slug]);

  // Track Instagram click (opens external profile in new tab, enables Continue button)
  const handleInstagramClick = () => {
    setHasOpenedInstagram(true);
    try {
      sessionStorage.setItem(`wq_ig_opened_${slug}`, 'true');
    } catch {}
    if (slug) {
      const sid = getAnonymousSessionId(slug);
      publicApi.trackWeddingQrEvent(slug, 'instagram_click', { sessionId: sid }).catch(() => {});
    }
  };

  // Proceed to Next Page (or directly open photo gallery if only 1 gallery is configured)
  const handleProceedToPhotos = () => {
    if (!hasOpenedInstagram) return;
    if (slug) {
      const sid = getAnonymousSessionId(slug);
      publicApi.trackWeddingQrEvent(slug, 'continue_click', { sessionId: sid }).catch(() => {});
    }

    const isReady = project?.galleryStatus === 'ready';
    const galleries = project?.galleries || [];

    // If photos are ready and there is only 1 gallery configured:
    // Directly open external event photos URL and skip the Event Galleries screen
    if (isReady && galleries.length === 1 && galleries[0]?.externalUrl) {
      handleGalleryClick(galleries[0]._id, galleries[0].title);
      window.open(galleries[0].externalUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    setCurrentView('photos');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Track gallery click
  const handleGalleryClick = (galleryId, galleryTitle = '') => {
    if (slug) {
      const sid = getAnonymousSessionId(slug);
      publicApi
        .trackWeddingQrEvent(slug, 'gallery_click', {
          galleryId,
          galleryTitle,
          sessionId: sid,
        })
        .catch(() => {});
    }
  };

  // Submit Contact Registration
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegistrationError('');

    if (!consentEmail && !consentWhatsApp) {
      setRegistrationError('Please select at least one notification channel (Email or WhatsApp).');
      return;
    }

    if (consentEmail && !guestEmail.trim()) {
      setRegistrationError('Please enter your email address for notifications.');
      return;
    }

    if (consentWhatsApp && !guestPhone.trim()) {
      setRegistrationError('Please enter your WhatsApp mobile number.');
      return;
    }

    setRegistering(true);
    try {
      const sid = getAnonymousSessionId(slug);
      const res = await publicApi.registerWeddingQrGuest(slug, {
        name: guestName.trim(),
        email: guestEmail.trim(),
        phone: guestPhone.trim(),
        consentEmail,
        consentWhatsApp,
        sessionId: sid,
      });
      setRegistered(true);
      setRegistrationMessage(
        res?.message || "You're registered! We'll notify you as soon as the wedding photos are ready.",
      );
    } catch (err) {
      setRegistrationError(err?.message || 'Failed to submit registration. Please check your details.');
    } finally {
      setRegistering(false);
    }
  };

  // Loading State
  if (loading) {
    return (
      <main className="min-h-screen bg-[#0d0b0a] text-stone-200 flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 rounded-full border-2 border-amber-500/30 border-t-amber-500 animate-spin mb-4" />
        <p className="text-sm tracking-wider uppercase text-stone-400 font-medium">
          Opening Event Gallery...
        </p>
      </main>
    );
  }

  // Inactive Project State
  if (isInactive) {
    return (
      <main className="min-h-screen bg-[#0d0b0a] text-stone-200 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-stone-900 border border-stone-800 flex items-center justify-center mb-4 text-amber-500">
          <Lock className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight mb-2">Gallery Currently Inactive</h1>
        <p className="text-sm text-stone-400 max-w-md mb-6">
          This wedding photo gallery has not been published yet or is currently set to private by the studio.
        </p>
        <Link
          to="/"
          className="px-6 py-2.5 rounded-full bg-stone-900 border border-stone-700 text-stone-300 hover:text-white text-xs font-semibold uppercase tracking-wider transition"
        >
          Visit Studio Homepage
        </Link>
      </main>
    );
  }

  // Not Found or Error State
  if (error || !project) {
    return (
      <main className="min-h-screen bg-[#0d0b0a] text-stone-200 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-stone-900 border border-stone-800 flex items-center justify-center mb-4 text-stone-500">
          <Camera className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight mb-2">Event Photos Not Found</h1>
        <p className="text-sm text-stone-400 max-w-md mb-6">
          The requested wedding gallery link does not exist. Please check your QR code or contact the photographer.
        </p>
        <Link
          to="/"
          className="px-6 py-2.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 text-xs font-semibold uppercase tracking-wider transition"
        >
          Return to Website
        </Link>
      </main>
    );
  }

  const embedVideo = getEmbedVideoUrl(project.guideVideoUrl);
  const isReady = project.galleryStatus === 'ready';
  const galleries = project.galleries || [];

  return (
    <div className="min-h-screen bg-[#0d0b0a] text-stone-200 font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Decorative Top Accent */}
      <div className="h-1 bg-gradient-to-r from-amber-600 via-rose-500 to-amber-600" />

      {/* ─────────────────────────────────────────────────────────────
          PAGE 1: THE GATE (Follow on Instagram + Self-Confirmation)
          Visitor has NO knowledge whether photos are ready or preparing
          ───────────────────────────────────────────────────────────── */}
      {currentView === 'gate' && (
        <>
          {/* Hero Header */}
          <header className="relative pt-10 pb-8 px-4 sm:px-6 text-center border-b border-stone-900/80">
            <div className="max-w-xl mx-auto space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-900/90 border border-amber-500/20 text-amber-400 text-2xs tracking-widest uppercase font-semibold">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Event Photo Access</span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight leading-tight">
                {project.name}
              </h1>

              <p className="text-sm text-stone-400 font-light max-w-md mx-auto">
                {project.description ||
                  'Your wedding memories await! Follow our Instagram page below to unlock your event photo access.'}
              </p>
            </div>
          </header>

          <main className="max-w-xl mx-auto px-4 sm:px-6 py-8 space-y-6">
            {/* Step 1: Instagram Gate */}
            <section className="bg-stone-900/60 border border-stone-800/80 rounded-3xl p-5 sm:p-7 shadow-2xl relative overflow-hidden">
              <div className="flex items-center gap-3 mb-4">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-tr from-amber-500 to-rose-500 text-stone-950 font-bold text-xs">
                  1
                </span>
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Follow Us on Instagram
                </h2>
              </div>

              <p className="text-xs text-stone-400 leading-relaxed mb-5">
                Tap the button below to visit our Instagram profile. Follow our account to support the photographers and stay updated with wedding highlight reels!
              </p>

              {/* Guide Video (If configured) */}
              {embedVideo && (
                <div className="mb-6 rounded-2xl overflow-hidden border border-stone-800 bg-black/60 shadow-inner">
                  {embedVideo.type === 'iframe' && (
                    <div className="relative aspect-video w-full">
                      <iframe
                        src={embedVideo.src}
                        title="Follow Guide Video"
                        className="absolute inset-0 w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  )}
                  {embedVideo.type === 'video' && (
                    <div className="relative aspect-video w-full bg-black">
                      <video
                        src={embedVideo.src}
                        controls
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  {embedVideo.type === 'fallback' && (
                    <div className="p-4 text-center">
                      <a
                        href={embedVideo.src}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-xs font-semibold text-amber-400 hover:underline"
                      >
                        <Play className="w-4 h-4" /> Watch follow instructions video
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Primary Instagram Action Button */}
              <a
                href={project.instagramProfileUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleInstagramClick}
                className="group relative flex items-center justify-center gap-3 w-full py-4 px-6 rounded-2xl text-white font-semibold text-sm shadow-xl transition-all duration-300 transform active:scale-[0.98] bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:from-purple-500 hover:via-pink-500 hover:to-amber-400 hover:shadow-pink-500/20"
              >
                <Instagram className="w-5 h-5 transition-transform group-hover:scale-110" />
                <span>{project.followButtonText || 'Follow on Instagram'}</span>
                <ExternalLink className="w-4 h-4 opacity-75" />
              </a>

              {hasOpenedInstagram && (
                <div className="mt-3.5 p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-center animate-fadeIn">
                  <p className="text-xs text-emerald-300 font-medium">
                    Thanks! You can now continue to your event photos.
                  </p>
                </div>
              )}
            </section>

            {/* Step 2: Access Event Photos */}
            <section className="bg-stone-900/60 border border-stone-800/80 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-4">
              <div className="flex items-center gap-3">
                <span
                  className={`flex items-center justify-center w-7 h-7 rounded-full font-bold text-xs border transition-colors ${
                    hasOpenedInstagram
                      ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-sm shadow-amber-500/50'
                      : 'bg-stone-800 text-stone-400 border-stone-700'
                  }`}
                >
                  2
                </span>
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Access Event Photos
                </h2>
              </div>

              {!hasOpenedInstagram && (
                <p className="text-xs text-stone-400 leading-relaxed">
                  Please tap the Instagram button above first to unlock your event photo access.
                </p>
              )}

              <button
                type="button"
                disabled={!hasOpenedInstagram}
                onClick={handleProceedToPhotos}
                aria-disabled={!hasOpenedInstagram}
                className={`w-full py-4 px-6 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-300 ${
                  hasOpenedInstagram
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 shadow-lg shadow-amber-500/25 hover:brightness-110 active:scale-[0.98] cursor-pointer ring-2 ring-amber-500/20'
                    : 'bg-stone-800/50 text-stone-500 cursor-not-allowed border border-stone-800/80 select-none'
                }`}
              >
                <span>Continue to Wedding Photos</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </section>
          </main>
        </>
      )}

      {/* ─────────────────────────────────────────────────────────────
          PAGE 2: THE NEXT PAGE (Revealed ONLY After Self-Confirmation)
          Shows either "Your memories are being prepared" OR "Event Galleries"
          ───────────────────────────────────────────────────────────── */}
      {currentView === 'photos' && (
        <div className="max-w-xl mx-auto px-4 sm:px-6 py-6 space-y-6">
          {/* Top Return Navigation Bar */}
          <div className="flex items-center justify-between border-b border-stone-900/80 pb-4">
            <button
              type="button"
              onClick={() => {
                setCurrentView('gate');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-amber-400 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Follow</span>
            </button>

            <span className="text-xs font-semibold text-stone-300 truncate max-w-[200px]">
              {project.name}
            </span>
          </div>

          {/* STATE A: PHOTOS ARE BEING PREPARED */}
          {!isReady && (
            <div className="bg-stone-900/80 border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden animate-fadeIn">
              <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="text-center space-y-3">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mx-auto">
                  <Clock className="w-6 h-6 animate-pulse" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Your wedding memories are being prepared.
                </h2>
                <p className="text-sm text-stone-400 max-w-md mx-auto">
                  Leave your contact details below and we&apos;ll notify you directly as soon as your event photos are ready to view.
                </p>
              </div>

              {/* Registration Form */}
              {registered ? (
                <div className="p-6 rounded-2xl bg-emerald-950/40 border border-emerald-800/50 text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-3">
                    <Check className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-semibold text-white">You&apos;re On The List!</h3>
                  <p className="text-xs text-stone-300 max-w-sm mx-auto leading-relaxed">
                    {registrationMessage}
                  </p>
                  <p className="text-2xs text-stone-500 pt-2 border-t border-emerald-900/40">
                    We will notify you via {consentWhatsApp && consentEmail ? 'WhatsApp and Email' : consentWhatsApp ? 'WhatsApp' : 'Email'} as soon as photographs are published.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleRegisterSubmit} className="space-y-4 pt-2">
                  {registrationError && (
                    <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs">
                      {registrationError}
                    </div>
                  )}

                  <div>
                    <label className="block text-2xs uppercase tracking-wider text-stone-400 font-semibold mb-1.5">
                      Your Name <span className="text-stone-500 lowercase">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full px-4 py-3 rounded-xl bg-black/50 border border-stone-800 text-white placeholder-stone-600 text-sm focus:outline-none focus:border-amber-500 transition"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-2xs uppercase tracking-wider text-stone-400 font-semibold">
                      Notification Channels <span className="text-amber-500">*</span>
                    </label>

                    {/* WhatsApp Channel */}
                    <div className="p-3.5 rounded-2xl bg-black/40 border border-stone-800 space-y-3">
                      <label className="flex items-center gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={consentWhatsApp}
                          onChange={(e) => setConsentWhatsApp(e.target.checked)}
                          className="w-4 h-4 rounded border-stone-700 text-emerald-500 focus:ring-emerald-500/30 bg-stone-900"
                        />
                        <span className="text-xs font-semibold text-stone-200 flex items-center gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                          Notify me via WhatsApp
                        </span>
                      </label>
                      {consentWhatsApp && (
                        <input
                          type="tel"
                          value={guestPhone}
                          onChange={(e) => setGuestPhone(e.target.value)}
                          placeholder="Mobile Number (e.g. +91 98765 43210)"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-stone-900/90 border border-stone-700 text-white placeholder-stone-500 text-xs focus:outline-none focus:border-emerald-500 transition"
                        />
                      )}
                    </div>

                    {/* Email Channel */}
                    <div className="p-3.5 rounded-2xl bg-black/40 border border-stone-800 space-y-3">
                      <label className="flex items-center gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={consentEmail}
                          onChange={(e) => setConsentEmail(e.target.checked)}
                          className="w-4 h-4 rounded border-stone-700 text-amber-500 focus:ring-amber-500/30 bg-stone-900"
                        />
                        <span className="text-xs font-semibold text-stone-200 flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-amber-400" />
                          Notify me via Email
                        </span>
                      </label>
                      {consentEmail && (
                        <input
                          type="email"
                          value={guestEmail}
                          onChange={(e) => setGuestEmail(e.target.value)}
                          placeholder="Email Address (e.g. guest@example.com)"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-stone-900/90 border border-stone-700 text-white placeholder-stone-500 text-xs focus:outline-none focus:border-amber-500 transition"
                        />
                      )}
                    </div>
                  </div>

                  <p className="text-2xs text-stone-500 leading-relaxed pt-1">
                    🔒 <strong className="text-stone-400">Privacy Notice:</strong> Your details will be strictly used to notify you about photo galleries for <em>{project.name}</em>. We never spam or share your contact info.
                  </p>

                  <button
                    type="submit"
                    disabled={registering}
                    className="w-full py-3.5 px-6 rounded-2xl bg-amber-500 text-stone-950 font-bold text-sm hover:bg-amber-400 active:scale-[0.98] transition shadow-lg shadow-amber-500/20 disabled:opacity-50"
                  >
                    {registering ? 'Registering...' : 'Notify Me When Photos Are Ready'}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* STATE B: PHOTOS ARE READY */}
          {isReady && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-amber-400" />
                  <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">Event Galleries</h2>
                </div>
                <span className="inline-flex items-center gap-1 text-2xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2.5 py-1 rounded-full uppercase tracking-wider">
                  <Check className="w-3 h-3" /> Ready to View
                </span>
              </div>

              {galleries.length === 0 ? (
                <div className="p-8 text-center rounded-3xl bg-stone-900/40 border border-stone-800">
                  <ImageIcon className="w-8 h-8 text-stone-600 mx-auto mb-2" />
                  <p className="text-sm text-stone-400">
                    Galleries for this event are currently being configured. Please check back soon!
                  </p>
                </div>
              ) : galleries.length === 1 ? (
                /* Single Gallery Card */
                <div className="p-6 rounded-3xl bg-gradient-to-b from-stone-900/90 to-stone-950 border border-amber-500/30 shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition duration-500" />
                  <div className="relative space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-white tracking-tight group-hover:text-amber-300 transition">
                        {galleries[0].title}
                      </h3>
                      <span className="text-2xs font-semibold text-amber-400/90 uppercase tracking-widest">
                        Full Gallery
                      </span>
                    </div>

                    {galleries[0].description && (
                      <p className="text-xs text-stone-400">{galleries[0].description}</p>
                    )}

                    <a
                      href={galleries[0].externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => handleGalleryClick(galleries[0]._id, galleries[0].title)}
                      className="mt-2 inline-flex items-center justify-center gap-2 w-full py-3.5 px-5 rounded-2xl bg-amber-500 text-stone-950 font-bold text-sm hover:bg-amber-400 shadow-lg shadow-amber-500/20 transition active:scale-[0.98]"
                    >
                      <span>View Photos ({galleries[0].title})</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              ) : (
                /* Multiple Galleries Grid */
                <div className="grid gap-3.5 sm:grid-cols-2">
                  {galleries.map((gallery, index) => (
                    <div
                      key={gallery._id || index}
                      className="p-5 rounded-2xl bg-stone-900/80 border border-stone-800 hover:border-amber-500/40 transition shadow-lg flex flex-col justify-between space-y-4 group"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-sm sm:text-base font-bold text-white tracking-tight group-hover:text-amber-300 transition">
                            {gallery.title}
                          </h3>
                          <span className="text-2xs font-mono text-stone-500">#{index + 1}</span>
                        </div>
                        {gallery.description && (
                          <p className="text-xs text-stone-400 line-clamp-2">
                            {gallery.description}
                          </p>
                        )}
                      </div>

                      <a
                        href={gallery.externalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => handleGalleryClick(gallery._id, gallery.title)}
                        className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-stone-800 text-stone-200 group-hover:bg-amber-500 group-hover:text-stone-950 font-semibold text-xs transition duration-200 active:scale-[0.98]"
                      >
                        <span>View {gallery.title}</span>
                        <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <footer className="mt-16 border-t border-stone-900 py-8 px-4 text-center space-y-2">
        <p className="text-xs text-stone-400">
          Photographed with love by <strong className="text-stone-300">Dynamic Photography</strong>
        </p>
        <p className="text-2xs text-stone-600">
          All external photographs are hosted securely on client cloud galleries.
        </p>
      </footer>
    </div>
  );
};

export default WeddingQrLanding;
