import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowUpRight, BriefcaseBusiness, ChevronLeft, ChevronRight, ExternalLink, Facebook,
  Globe2, Images, Instagram, Linkedin, Mail, MapPin, MessageCircle, Phone, Share2,
  Twitter, X, Youtube,
} from 'lucide-react';

const socialIcons = { instagram: Instagram, facebook: Facebook, youtube: Youtube, linkedin: Linkedin, twitter: Twitter, x: Twitter, website: Globe2, whatsapp: MessageCircle };
const phoneHref = (value) => `tel:${String(value ?? '').replace(/[^+\d]/g, '')}`;
const whatsappHref = (value) => `https://wa.me/${String(value ?? '').replace(/\D/g, '')}`;

export const PublicProfilePage = ({ profile }) => {
  useEffect(() => {
    const oldTitle = document.title;
    document.title = `${profile.name}${profile.designation ? ` · ${profile.designation}` : ''}`;
    return () => { document.title = oldTitle; };
  }, [profile]);

  const share = async () => {
    if (navigator.share) await navigator.share({ title: profile.name, text: profile.tagline, url: window.location.href });
    else await navigator.clipboard.writeText(window.location.href);
  };

  const covers = profile.coverPhotos?.length
    ? [...profile.coverPhotos].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    : profile.coverPhoto ? [profile.coverPhoto] : [];
  const gallery = [...(profile.gallery ?? [])].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#eeeae2] text-[#181714]" style={{ '--profile-accent': profile.accentColor || '#b8863b' }}>
      <main className="mx-auto min-h-screen w-full min-w-0 max-w-[1180px] overflow-x-hidden bg-[#fbfaf7] shadow-2xl shadow-stone-900/10 lg:my-8 lg:min-h-[calc(100vh-4rem)] lg:rounded-[2rem]">
        <section className="relative aspect-[2/1] w-full overflow-hidden bg-[#25231f]">
          <CoverCarousel covers={covers} name={profile.name} />
          <button type="button" onClick={share} aria-label="Share profile" className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full border border-white/25 bg-black/25 text-white backdrop-blur-md transition hover:bg-white hover:text-black sm:right-7 sm:top-7"><Share2 className="h-4.5 w-4.5" /></button>
        </section>

        <div className={`relative min-w-0 px-4 sm:px-8 lg:grid lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-14 lg:px-14 ${gallery.length ? 'pb-10 md:pb-12' : 'pb-36 md:pb-16'}`}>
          <aside className="relative min-w-0 -mt-16 sm:-mt-20 lg:-mt-24">
            <div className="h-32 w-32 overflow-hidden rounded-[1.75rem] border-4 border-[#fbfaf7] bg-stone-200 shadow-xl sm:h-40 sm:w-40 lg:h-48 lg:w-48">
              {profile.profilePhoto?.url ? <img src={profile.profilePhoto.url} alt={profile.name} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-5xl font-semibold text-stone-500">{profile.name?.charAt(0)}</div>}
            </div>
            <div className="mt-6">
              <p className="text-xs font-semibold uppercase tracking-[.22em]" style={{ color: 'var(--profile-accent)' }}>{profile.company || 'Professional profile'}</p>
              <h1 className="mt-2 break-words text-[2.1rem] font-semibold leading-[1.05] tracking-tight sm:text-5xl">{profile.name}</h1>
              {profile.designation && <p className="mt-3 text-base text-stone-500">{profile.designation}</p>}
            </div>
            <div className="mt-7 flex flex-wrap gap-2">
              {profile.phone && <a href={phoneHref(profile.phone)} className="grid h-11 w-11 place-items-center rounded-full bg-[#201f1c] text-white transition hover:-translate-y-0.5" aria-label="Call"><Phone className="h-4.5 w-4.5" /></a>}
              {profile.whatsapp && <a href={whatsappHref(profile.whatsapp)} target="_blank" rel="noreferrer" className="grid h-11 w-11 place-items-center rounded-full bg-[#25D366] text-white transition hover:-translate-y-0.5" aria-label="WhatsApp"><MessageCircle className="h-4.5 w-4.5" /></a>}
              {profile.email && <a href={`mailto:${profile.email}`} className="grid h-11 w-11 place-items-center rounded-full border border-stone-200 bg-white transition hover:-translate-y-0.5" aria-label="Email"><Mail className="h-4.5 w-4.5" /></a>}
            </div>
          </aside>

          <div className="min-w-0 mt-10 lg:mt-14">
            {profile.tagline && <p className="max-w-2xl text-balance text-2xl font-medium leading-snug tracking-tight sm:text-3xl">{profile.tagline}</p>}
            {profile.bio && <p className="mt-6 max-w-2xl whitespace-pre-line text-[15px] leading-7 text-stone-600 sm:text-base">{profile.bio}</p>}

            {(profile.phone || profile.email || profile.website || profile.address) && <section className="mt-10 border-t border-stone-200 pt-8">
              <h2 className="text-xs font-bold uppercase tracking-[.2em] text-stone-400">Contact</h2>
              <div className="mt-5 grid min-w-0 gap-3 md:grid-cols-2">
                {profile.phone && <Contact href={phoneHref(profile.phone)} icon={Phone} label="Phone" value={profile.phone} />}
                {profile.email && <Contact href={`mailto:${profile.email}`} icon={Mail} label="Email" value={profile.email} />}
                {profile.website && <Contact href={profile.website} icon={Globe2} label="Website" value={profile.website.replace(/^https?:\/\//, '')} external />}
                {profile.address && <Contact href={profile.mapUrl || undefined} icon={MapPin} label="Address" value={profile.address} external={Boolean(profile.mapUrl)} />}
              </div>
            </section>}

            {profile.services?.length > 0 && <section className="mt-10 border-t border-stone-200 pt-8">
              <h2 className="text-xs font-bold uppercase tracking-[.2em] text-stone-400">What I do</h2>
              <div className="mt-5 flex flex-wrap gap-2">{profile.services.map((service) => <span key={service} className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm text-stone-700 shadow-sm"><BriefcaseBusiness className="mr-2 inline h-3.5 w-3.5" />{service}</span>)}</div>
            </section>}

            {profile.socials?.length > 0 && <section className="mt-10 border-t border-stone-200 pt-8">
              <h2 className="text-xs font-bold uppercase tracking-[.2em] text-stone-400">Connect</h2>
              <div className="mt-5 grid min-w-0 gap-3 md:grid-cols-2">{profile.socials.map((social) => <Social key={social._id || `${social.platform}-${social.url}`} social={social} />)}</div>
            </section>}
          </div>
        </div>

        {gallery.length > 0 && <ProfileGallery images={gallery} name={profile.name} />}

        <div className="fixed inset-x-0 bottom-0 z-20 mx-auto flex w-full max-w-[1180px] gap-2 border-t border-stone-200 bg-[#fbfaf7]/95 p-3 pb-[calc(.75rem+env(safe-area-inset-bottom))] backdrop-blur-xl md:hidden">
          {profile.phone && <a href={phoneHref(profile.phone)} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-[#201f1c] text-sm font-semibold text-white"><Phone className="h-4 w-4" /> Call</a>}
          {profile.whatsapp && <a href={whatsappHref(profile.whatsapp)} target="_blank" rel="noreferrer" className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-[#25D366] text-sm font-semibold text-white"><MessageCircle className="h-4 w-4" /> WhatsApp</a>}
        </div>
      </main>
    </div>
  );
};

const CoverCarousel = ({ covers, name }) => {
  const trackRef = useRef(null);
  const [active, setActive] = useState(0);

  useEffect(() => setActive(0), [covers.length]);

  if (!covers.length) {
    return <div className="h-full w-full bg-[radial-gradient(circle_at_20%_20%,var(--profile-accent),transparent_38%),linear-gradient(135deg,#171613,#39352f)]" />;
  }

  const go = (nextIndex) => {
    const index = (nextIndex + covers.length) % covers.length;
    const track = trackRef.current;
    track?.scrollTo({ left: track.clientWidth * index, behavior: 'smooth' });
    setActive(index);
  };

  return <>
    <div
      ref={trackRef}
      className="flex h-full w-full snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      onScroll={(event) => {
        const width = event.currentTarget.clientWidth;
        if (width) setActive(Math.round(event.currentTarget.scrollLeft / width));
      }}
    >
      {covers.map((cover, index) => <div key={cover.publicId || cover.url} className="h-full min-w-full snap-center">
        <img src={cover.url} alt={cover.alt || `${name} cover ${index + 1}`} className="h-full w-full object-cover" loading={index === 0 ? 'eager' : 'lazy'} fetchPriority={index === 0 ? 'high' : 'auto'} />
      </div>)}
    </div>
    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/65 via-black/5 to-black/20" />
    {covers.length > 1 && <>
      <button type="button" onClick={() => go(active - 1)} aria-label="Previous cover" className="absolute left-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-black/30 text-white backdrop-blur transition hover:bg-white hover:text-black sm:grid"><ChevronLeft className="h-5 w-5" /></button>
      <button type="button" onClick={() => go(active + 1)} aria-label="Next cover" className="absolute right-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-black/30 text-white backdrop-blur transition hover:bg-white hover:text-black sm:grid"><ChevronRight className="h-5 w-5" /></button>
      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-black/25 px-2.5 py-2 backdrop-blur">
        {covers.map((cover, index) => <button key={cover.publicId || cover.url} type="button" onClick={() => go(index)} aria-label={`Show cover ${index + 1}`} aria-current={active === index} className={`h-1.5 rounded-full transition-all ${active === index ? 'w-5 bg-white' : 'w-1.5 bg-white/55'}`} />)}
      </div>
    </>}
  </>;
};

const ProfileGallery = ({ images, name }) => {
  const [openIndex, setOpenIndex] = useState(null);

  return <section className="border-t border-stone-200 px-4 pb-36 pt-10 sm:px-8 md:pb-16 lg:px-14 lg:pt-12">
    <div className="mb-6 flex items-end justify-between gap-4">
      <div><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.2em] text-stone-400"><Images className="h-4 w-4" /> Gallery</p><h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Selected moments</h2></div>
      <p className="shrink-0 text-xs text-stone-400">{images.length} photos</p>
    </div>
    <div className="grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-3">
      {images.map((image, index) => {
        const wide = index % 7 === 0;
        return <button key={image.publicId || image.url} type="button" onClick={() => setOpenIndex(index)} className={`group relative overflow-hidden rounded-2xl bg-stone-100 text-left ${wide ? 'col-span-2 aspect-[16/9]' : 'aspect-[4/5]'}`}>
          <img src={image.url} alt={image.alt || `${name} gallery photo ${index + 1}`} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
          <span className="absolute inset-0 bg-black/0 transition group-hover:bg-black/10" />
        </button>;
      })}
    </div>
    <GalleryViewer images={images} index={openIndex} name={name} onChange={setOpenIndex} onClose={() => setOpenIndex(null)} />
  </section>;
};

const GalleryViewer = ({ images, index, name, onChange, onClose }) => {
  useEffect(() => {
    if (index === null) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const keyDown = (event) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowLeft') onChange((index - 1 + images.length) % images.length);
      if (event.key === 'ArrowRight') onChange((index + 1) % images.length);
    };
    window.addEventListener('keydown', keyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', keyDown);
    };
  }, [index, images.length, onChange, onClose]);

  if (index === null) return null;
  const image = images[index];
  return createPortal(<div role="dialog" aria-modal="true" aria-label="Gallery photo viewer" className="fixed inset-0 z-50 grid bg-black/95 p-3 pb-[max(.75rem,env(safe-area-inset-bottom))] sm:p-6">
    <button type="button" onClick={onClose} aria-label="Close gallery" className="absolute right-3 top-3 z-10 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white backdrop-blur hover:bg-white hover:text-black sm:right-6 sm:top-6"><X className="h-5 w-5" /></button>
    <img src={image.url} alt={image.alt || `${name} gallery photo ${index + 1}`} className="m-auto max-h-[calc(100dvh-5rem)] max-w-full object-contain" />
    {images.length > 1 && <>
      <button type="button" onClick={() => onChange((index - 1 + images.length) % images.length)} aria-label="Previous photo" className="absolute bottom-4 left-4 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white backdrop-blur hover:bg-white hover:text-black sm:bottom-auto sm:left-6 sm:top-1/2 sm:-translate-y-1/2"><ChevronLeft className="h-6 w-6" /></button>
      <button type="button" onClick={() => onChange((index + 1) % images.length)} aria-label="Next photo" className="absolute bottom-4 right-4 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white backdrop-blur hover:bg-white hover:text-black sm:bottom-auto sm:right-6 sm:top-1/2 sm:-translate-y-1/2"><ChevronRight className="h-6 w-6" /></button>
    </>}
    <p className="pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-black/40 px-3 py-1.5 text-xs font-medium text-white/80 backdrop-blur">{index + 1} / {images.length}</p>
  </div>, document.body);
};

const Contact = ({ href, icon: Icon, label, value, external }) => {
  const content = <><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-stone-100"><Icon className="h-4 w-4" /></span><span className="min-w-0 flex-1"><span className="block text-xs text-stone-400">{label}</span><span className="block break-words text-sm font-medium">{value}</span></span>{href && <ArrowUpRight className="ml-auto h-4 w-4 shrink-0 text-stone-400" />}</>;
  return href ? <a href={href} target={external ? '_blank' : undefined} rel={external ? 'noreferrer' : undefined} className="flex min-w-0 items-center gap-3 rounded-2xl border border-stone-200 bg-white p-3 transition hover:border-stone-300 hover:shadow-md">{content}</a> : <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-stone-200 bg-white p-3">{content}</div>;
};
const Social = ({ social }) => { const Icon = socialIcons[social.platform?.toLowerCase()] || ExternalLink; return <a href={social.url} target="_blank" rel="noreferrer" className="group flex items-center gap-3 rounded-2xl bg-[#201f1c] p-4 text-white transition hover:-translate-y-0.5"><Icon className="h-5 w-5" /><span className="font-medium capitalize">{social.label || social.platform}</span><ArrowUpRight className="ml-auto h-4 w-4 text-white/50 transition group-hover:text-white" /></a>; };
