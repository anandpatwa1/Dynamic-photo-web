import { useEffect } from 'react';
import {
  ArrowUpRight, BriefcaseBusiness, ExternalLink, Facebook, Globe2, Instagram,
  Linkedin, Mail, MapPin, MessageCircle, Phone, Share2, Twitter, Youtube,
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

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#eeeae2] text-[#181714]" style={{ '--profile-accent': profile.accentColor || '#b8863b' }}>
      <main className="mx-auto min-h-screen w-full min-w-0 max-w-[1180px] overflow-x-hidden bg-[#fbfaf7] shadow-2xl shadow-stone-900/10 lg:my-8 lg:min-h-[calc(100vh-4rem)] lg:rounded-[2rem]">
        <section className="relative aspect-[16/10] min-h-[220px] max-h-[400px] w-full overflow-hidden bg-[#25231f] sm:aspect-[16/8]">
          {profile.coverPhoto?.url ? <img src={profile.coverPhoto.url} alt="" className="block h-full w-full min-w-full max-w-none object-cover" /> : <div className="h-full w-full bg-[radial-gradient(circle_at_20%_20%,var(--profile-accent),transparent_38%),linear-gradient(135deg,#171613,#39352f)]" />}
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-black/20" />
          <button type="button" onClick={share} aria-label="Share profile" className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full border border-white/25 bg-black/25 text-white backdrop-blur-md transition hover:bg-white hover:text-black sm:right-7 sm:top-7"><Share2 className="h-4.5 w-4.5" /></button>
        </section>

        <div className="relative min-w-0 px-4 pb-36 sm:px-8 md:pb-16 lg:grid lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-14 lg:px-14">
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

        <div className="fixed inset-x-0 bottom-0 z-20 mx-auto flex w-full max-w-[1180px] gap-2 border-t border-stone-200 bg-[#fbfaf7]/95 p-3 pb-[calc(.75rem+env(safe-area-inset-bottom))] backdrop-blur-xl md:hidden">
          {profile.phone && <a href={phoneHref(profile.phone)} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-[#201f1c] text-sm font-semibold text-white"><Phone className="h-4 w-4" /> Call</a>}
          {profile.whatsapp && <a href={whatsappHref(profile.whatsapp)} target="_blank" rel="noreferrer" className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-[#25D366] text-sm font-semibold text-white"><MessageCircle className="h-4 w-4" /> WhatsApp</a>}
        </div>
      </main>
    </div>
  );
};

const Contact = ({ href, icon: Icon, label, value, external }) => {
  const content = <><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-stone-100"><Icon className="h-4 w-4" /></span><span className="min-w-0 flex-1"><span className="block text-xs text-stone-400">{label}</span><span className="block break-words text-sm font-medium">{value}</span></span>{href && <ArrowUpRight className="ml-auto h-4 w-4 shrink-0 text-stone-400" />}</>;
  return href ? <a href={href} target={external ? '_blank' : undefined} rel={external ? 'noreferrer' : undefined} className="flex min-w-0 items-center gap-3 rounded-2xl border border-stone-200 bg-white p-3 transition hover:border-stone-300 hover:shadow-md">{content}</a> : <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-stone-200 bg-white p-3">{content}</div>;
};
const Social = ({ social }) => { const Icon = socialIcons[social.platform?.toLowerCase()] || ExternalLink; return <a href={social.url} target="_blank" rel="noreferrer" className="group flex items-center gap-3 rounded-2xl bg-[#201f1c] p-4 text-white transition hover:-translate-y-0.5"><Icon className="h-5 w-5" /><span className="font-medium capitalize">{social.label || social.platform}</span><ArrowUpRight className="ml-auto h-4 w-4 text-white/50 transition group-hover:text-white" /></a>; };
