import { useEffect, useState } from 'react';
import { ExternalLink, Plus, Save, Trash2, Upload, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, Card, Input, PageHeader, PageLoader, Switch, Textarea } from '@/components/ui';
import { profileApi } from '@/api/profileApi';

const blank = { slug: '', name: '', designation: '', company: '', tagline: '', bio: '', phone: '', whatsapp: '', email: '', website: '', address: '', mapUrl: '', accentColor: '#b8863b', services: [], socials: [], isPublished: true };
const platforms = ['instagram', 'facebook', 'youtube', 'linkedin', 'twitter', 'whatsapp', 'website'];

export default function PublicProfiles() {
  const [profiles, setProfiles] = useState([]);
  const [draft, setDraft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pendingImages, setPendingImages] = useState({ profile: null, cover: null });

  const load = async () => {
    try { const data = await profileApi.list(); setProfiles(data.profiles); }
    catch (error) { toast.error(error?.response?.data?.message ?? 'Could not load profiles'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const clearPendingImages = () => {
    Object.values(pendingImages).forEach((entry) => entry?.preview && URL.revokeObjectURL(entry.preview));
    setPendingImages({ profile: null, cover: null });
  };
  const choose = (profile) => {
    clearPendingImages();
    setDraft(JSON.parse(JSON.stringify(profile)));
  };
  const set = (key, value) => setDraft((current) => ({ ...current, [key]: value }));
  const save = async () => {
    if (!draft.name.trim() || !draft.slug.trim()) return toast.error('Name and URL are required');
    setSaving(true);
    let profileWasSaved = false;
    try {
      const wasNew = !draft._id;
      const data = draft._id ? await profileApi.update(draft._id, draft) : await profileApi.create(draft);
      profileWasSaved = true;
      let savedProfile = data.profile;
      // Keep the newly assigned id immediately. If a later image upload fails,
      // retrying Save updates this record instead of creating a duplicate.
      if (wasNew) setDraft((current) => ({ ...current, _id: savedProfile._id }));
      for (const kind of ['cover', 'profile']) {
        const queued = pendingImages[kind];
        if (!queued?.file) continue;
        // The record now exists, so photos selected during creation can be uploaded safely.
        // eslint-disable-next-line no-await-in-loop
        const uploaded = await profileApi.uploadImage(savedProfile._id, kind, queued.file);
        savedProfile = uploaded.profile;
      }
      toast.success(wasNew ? 'Profile and photos created' : 'Profile saved');
      await load(); choose(savedProfile);
    } catch (error) {
      toast.error(error?.response?.data?.message ?? (profileWasSaved ? 'Profile was saved, but a photo could not be uploaded' : 'Could not save profile'));
    }
    finally { setSaving(false); }
  };
  const upload = async (kind, file) => {
    if (!file) return;
    if (!draft?._id) {
      setPendingImages((current) => {
        if (current[kind]?.preview) URL.revokeObjectURL(current[kind].preview);
        return { ...current, [kind]: { file, preview: URL.createObjectURL(file) } };
      });
      return;
    }
    try { const { profile } = await profileApi.uploadImage(draft._id, kind, file); choose(profile); await load(); toast.success('Photo updated'); }
    catch (error) { toast.error(error?.response?.data?.message ?? 'Upload failed'); }
  };
  const remove = async () => {
    if (!draft?._id || !window.confirm(`Delete ${draft.name}'s public profile?`)) return;
    try { await profileApi.remove(draft._id); clearPendingImages(); setDraft(null); await load(); toast.success('Profile deleted'); }
    catch (error) { toast.error(error?.response?.data?.message ?? 'Could not delete profile'); }
  };

  if (loading) return <PageLoader label="Loading profiles" />;
  return <div>
    <PageHeader title="Public Profiles" description="Create mobile-first profile pages with a personal URL such as /anand or /kapil."
      actions={<Button icon={Plus} onClick={() => { clearPendingImages(); setDraft({ ...blank }); }}>New profile</Button>} />

    <div className="grid gap-6 xl:grid-cols-[280px_1fr]">
      <Card className="h-fit p-3">
        <p className="px-2 pb-3 text-xs font-semibold uppercase tracking-wider text-ink-400">Profiles</p>
        <div className="space-y-1.5">
          {profiles.map((profile) => <button key={profile._id} type="button" onClick={() => choose(profile)} className={`flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition ${draft?._id === profile._id ? 'bg-ink-900 text-white' : 'hover:bg-ink-50'}`}>
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-ink-100">{profile.profilePhoto?.url ? <img src={profile.profilePhoto.url} alt="" className="h-full w-full object-cover" /> : <span className="grid h-full place-items-center font-semibold text-ink-500">{profile.name.charAt(0)}</span>}</div>
            <div className="min-w-0"><p className="truncate text-sm font-semibold">{profile.name}</p><p className={`truncate text-xs ${draft?._id === profile._id ? 'text-white/60' : 'text-ink-400'}`}>/{profile.slug}</p></div>
            <span className={`ml-auto h-2 w-2 rounded-full ${profile.isPublished ? 'bg-success-500' : 'bg-ink-300'}`} />
          </button>)}
          {!profiles.length && <p className="px-2 py-8 text-center text-sm text-ink-400">No profiles yet.</p>}
        </div>
      </Card>

      {!draft ? <Card className="grid min-h-72 place-items-center p-8 text-center text-ink-400">Select a profile or create a new one.</Card> : <div className="space-y-5">
        <Card className="overflow-hidden">
          <div className="relative h-40 bg-gradient-to-br from-ink-800 to-ink-950 sm:h-52">
            {(pendingImages.cover?.preview || draft.coverPhoto?.url) && <img src={pendingImages.cover?.preview || draft.coverPhoto.url} alt="" className="h-full w-full object-cover opacity-80" />}
            <label className="absolute right-4 top-4 flex cursor-pointer items-center gap-2 rounded-lg bg-black/55 px-3 py-2 text-xs font-semibold text-white backdrop-blur"><Upload className="h-3.5 w-3.5" /> Cover photo<input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => upload('cover', e.target.files?.[0])} /></label>
          </div>
          <div className="relative px-5 pb-5 sm:px-7">
            <div className="-mt-12 h-24 w-24 overflow-hidden rounded-2xl border-4 border-white bg-ink-100 shadow-lg">
              {(pendingImages.profile?.preview || draft.profilePhoto?.url) ? <img src={pendingImages.profile?.preview || draft.profilePhoto.url} alt="" className="h-full w-full object-cover" /> : <span className="grid h-full place-items-center text-3xl font-semibold text-ink-400">{draft.name?.charAt(0) || '?'}</span>}
            </div>
            <label className="mt-3 inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-brand-700"><Upload className="h-3.5 w-3.5" /> Change profile photo<input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => upload('profile', e.target.files?.[0])} /></label>
          </div>
        </Card>

        <Card className="p-5 sm:p-7">
          <div className="grid gap-5 sm:grid-cols-2">
            <Input label="Full name" required value={draft.name} onChange={(e) => set('name', e.target.value)} placeholder="Anand Sharma" />
            <Input label="Public URL" required prefix="/" value={draft.slug} onChange={(e) => set('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))} placeholder="anand" />
            <Input label="Designation" value={draft.designation} onChange={(e) => set('designation', e.target.value)} placeholder="Founder & Photographer" />
            <Input label="Company" value={draft.company} onChange={(e) => set('company', e.target.value)} placeholder="Dynamic Production" />
            <Input label="Tagline" wrapperClassName="sm:col-span-2" value={draft.tagline} onChange={(e) => set('tagline', e.target.value)} placeholder="Stories, framed with intention." />
            <Textarea label="About" wrapperClassName="sm:col-span-2" rows={5} value={draft.bio} onChange={(e) => set('bio', e.target.value)} placeholder="A short professional introduction..." />
          </div>
        </Card>

        <Card className="p-5 sm:p-7">
          <h2 className="mb-5 text-lg font-semibold text-ink-900">Contact details</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <Input label="Phone" value={draft.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+91 98765 43210" />
            <Input label="WhatsApp" value={draft.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} placeholder="919876543210" />
            <Input type="email" label="Email" value={draft.email} onChange={(e) => set('email', e.target.value)} />
            <Input type="url" label="Website" value={draft.website} onChange={(e) => set('website', e.target.value)} placeholder="https://..." />
            <Textarea label="Address" rows={3} value={draft.address} onChange={(e) => set('address', e.target.value)} />
            <Input label="Google Maps link" value={draft.mapUrl} onChange={(e) => set('mapUrl', e.target.value)} placeholder="https://maps.google.com/..." />
          </div>
        </Card>

        <Card className="p-5 sm:p-7">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-semibold text-ink-900">Social links</h2><Button size="sm" variant="secondary" icon={Plus} onClick={() => set('socials', [...draft.socials, { platform: 'instagram', label: '', url: '' }])}>Add link</Button></div>
          <div className="space-y-3">{draft.socials.map((social, index) => <div key={social._id || index} className="grid min-w-0 gap-3 rounded-xl border border-ink-200 p-3 md:grid-cols-[140px_minmax(0,1fr)_minmax(0,1fr)_auto]">
            <select className="h-10 rounded-lg border border-ink-300 bg-white px-3 text-sm" value={social.platform} onChange={(e) => { const next = [...draft.socials]; next[index] = { ...social, platform: e.target.value }; set('socials', next); }}>{platforms.map((item) => <option key={item}>{item}</option>)}</select>
            <Input aria-label="Social label" placeholder="Display label" value={social.label || ''} onChange={(e) => { const next = [...draft.socials]; next[index] = { ...social, label: e.target.value }; set('socials', next); }} />
            <Input aria-label="Social URL" placeholder="https://..." value={social.url} onChange={(e) => { const next = [...draft.socials]; next[index] = { ...social, url: e.target.value }; set('socials', next); }} />
            <Button variant="ghost" iconOnly icon={X} aria-label="Remove link" onClick={() => set('socials', draft.socials.filter((_, i) => i !== index))} />
          </div>)}</div>
        </Card>

        <Card className="p-5 sm:p-7">
          <h2 className="mb-5 text-lg font-semibold text-ink-900">Services & appearance</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <Textarea label="Services" hint="One service per line" rows={5} value={(draft.services || []).join('\n')} onChange={(e) => set('services', e.target.value.split('\n').map((x) => x.trim()).filter(Boolean))} placeholder={'Wedding photography\nCinematic films'} />
            <div className="space-y-5"><Input type="color" label="Accent colour" value={draft.accentColor} onChange={(e) => set('accentColor', e.target.value)} className="p-1" /><Switch label="Published publicly" checked={draft.isPublished} onChange={(e) => set('isPublished', e.target.checked)} /></div>
          </div>
        </Card>

        <div className="sticky bottom-3 z-10 flex flex-col gap-2 rounded-2xl border border-ink-200 bg-white/95 p-3 shadow-xl backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <div className="grid grid-cols-2 gap-2 sm:flex">{draft._id && <Button variant="danger" icon={Trash2} onClick={remove}>Delete</Button>}{draft._id && <Button as="a" href={`/${draft.slug}`} target="_blank" variant="secondary" icon={ExternalLink}>Preview</Button>}</div>
          <Button fullWidth className="sm:w-auto" icon={Save} loading={saving} onClick={save}>{draft._id ? 'Save changes' : 'Create profile'}</Button>
        </div>
      </div>}
    </div>
  </div>;
}
