import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Crop, ExternalLink, ImagePlus, Images, Plus, Save, Trash2, Upload, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, Card, Input, PageHeader, PageLoader, Switch, Textarea } from '@/components/ui';
import { ImageCropModal } from '@/components/profile/ImageCropModal';
import { profileApi } from '@/api/profileApi';

const blank = { slug: '', name: '', designation: '', company: '', tagline: '', bio: '', phone: '', whatsapp: '', email: '', website: '', address: '', mapUrl: '', accentColor: '#b8863b', services: [], socials: [], coverPhotos: [], gallery: [], isPublished: true };
const platforms = ['instagram', 'facebook', 'youtube', 'linkedin', 'twitter', 'whatsapp', 'website'];
const PHOTO_TYPES = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp']);
const MAX_PHOTO_BYTES = 40 * 1024 * 1024;
const emptyPending = () => ({ profile: null, covers: [], gallery: [] });
const chunks = (items, size = 6) => Array.from({ length: Math.ceil(items.length / size) }, (_, index) => items.slice(index * size, (index + 1) * size));

const validPhotos = (files) => Array.from(files ?? []).filter((file) => {
  if (!PHOTO_TYPES.has(file.type)) {
    toast.error(`${file.name}: use a JPG, PNG or WEBP photo`);
    return false;
  }
  if (file.size > MAX_PHOTO_BYTES) {
    toast.error(`${file.name}: photo must be under 40 MB`);
    return false;
  }
  return true;
});

export default function PublicProfiles() {
  const [profiles, setProfiles] = useState([]);
  const [draft, setDraft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pendingImages, setPendingImages] = useState(emptyPending);
  const [cropQueue, setCropQueue] = useState([]);

  const load = async () => {
    try { const data = await profileApi.list(); setProfiles(data.profiles); }
    catch (error) { toast.error(error?.response?.data?.message ?? 'Could not load profiles'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const release = (entry) => entry?.preview && URL.revokeObjectURL(entry.preview);
  const clearPendingImages = () => {
    release(pendingImages.profile);
    pendingImages.covers.forEach(release);
    pendingImages.gallery.forEach(release);
    setPendingImages(emptyPending());
    setCropQueue([]);
  };
  const choose = (profile) => {
    clearPendingImages();
    setDraft(JSON.parse(JSON.stringify(profile)));
  };
  const set = (key, value) => setDraft((current) => ({ ...current, [key]: value }));

  const storedCovers = useMemo(() => {
    if (!draft) return [];
    if (draft.coverPhotos?.length) return draft.coverPhotos;
    return draft.coverPhoto ? [draft.coverPhoto] : [];
  }, [draft]);

  const chooseForCrop = (kind, files) => {
    const selected = validPhotos(files);
    if (!selected.length) return;
    if (kind === 'profile') {
      setCropQueue([{ kind, file: selected[0] }]);
      return;
    }
    const available = Math.max(0, 12 - storedCovers.length - pendingImages.covers.length);
    if (!available) return toast.error('A profile can have up to 12 cover photos');
    if (selected.length > available) toast.error(`Only ${available} more cover photo${available === 1 ? '' : 's'} can be added`);
    setCropQueue(selected.slice(0, available).map((file) => ({ kind, file })));
  };

  const acceptCrop = async (file) => {
    const target = cropQueue[0];
    const entry = { file, preview: URL.createObjectURL(file) };
    setPendingImages((current) => {
      if (target.kind === 'profile') {
        release(current.profile);
        return { ...current, profile: entry };
      }
      return { ...current, covers: [...current.covers, entry] };
    });
    setCropQueue((current) => current.slice(1));
  };

  const queueGallery = (files) => {
    const selected = validPhotos(files);
    const available = Math.max(0, 60 - (draft.gallery?.length ?? 0) - pendingImages.gallery.length);
    if (!available) return toast.error('A profile gallery can have up to 60 photos');
    if (selected.length > available) toast.error(`Only ${available} more gallery photo${available === 1 ? '' : 's'} can be added`);
    const entries = selected.slice(0, available).map((file) => ({ file, preview: URL.createObjectURL(file) }));
    setPendingImages((current) => ({ ...current, gallery: [...current.gallery, ...entries] }));
  };

  const removePending = (field, index) => {
    setPendingImages((current) => {
      if (field === 'profile') {
        release(current.profile);
        return { ...current, profile: null };
      }
      release(current[field][index]);
      return { ...current, [field]: current[field].filter((_, itemIndex) => itemIndex !== index) };
    });
  };

  const save = async () => {
    if (!draft.name.trim() || !draft.slug.trim()) return toast.error('Name and URL are required');
    setSaving(true);
    let profileWasSaved = false;
    try {
      const wasNew = !draft._id;
      const data = draft._id ? await profileApi.update(draft._id, draft) : await profileApi.create(draft);
      profileWasSaved = true;
      let savedProfile = data.profile;
      if (wasNew) setDraft((current) => ({ ...current, _id: savedProfile._id }));

      if (pendingImages.profile?.file) {
        const uploaded = await profileApi.uploadImage(savedProfile._id, 'profile', pendingImages.profile.file);
        savedProfile = uploaded.profile;
        removePending('profile');
      }
      for (const group of chunks(pendingImages.covers)) {
        // eslint-disable-next-line no-await-in-loop
        const uploaded = await profileApi.addCovers(savedProfile._id, group.map((entry) => entry.file));
        savedProfile = uploaded.profile;
        group.forEach(release);
        setPendingImages((current) => ({ ...current, covers: current.covers.filter((entry) => !group.includes(entry)) }));
      }
      for (const group of chunks(pendingImages.gallery)) {
        // eslint-disable-next-line no-await-in-loop
        const uploaded = await profileApi.addGallery(savedProfile._id, group.map((entry) => entry.file));
        savedProfile = uploaded.profile;
        group.forEach(release);
        setPendingImages((current) => ({ ...current, gallery: current.gallery.filter((entry) => !group.includes(entry)) }));
      }

      toast.success(wasNew ? 'Profile and photos created' : 'Profile saved');
      await load();
      choose(savedProfile);
    } catch (error) {
      toast.error(error?.response?.data?.message ?? (profileWasSaved ? 'Profile was saved, but a photo could not be uploaded' : 'Could not save profile'));
    } finally { setSaving(false); }
  };

  const removeStored = async (collection, publicId) => {
    if (!draft?._id) return;
    try {
      const result = collection === 'covers'
        ? await profileApi.removeCover(draft._id, publicId)
        : await profileApi.removeGallery(draft._id, publicId);
      setDraft(result.profile);
      setProfiles((current) => current.map((profile) => profile._id === result.profile._id ? result.profile : profile));
      toast.success(collection === 'covers' ? 'Cover removed' : 'Gallery photo removed');
    } catch (error) { toast.error(error?.response?.data?.message ?? 'Could not remove photo'); }
  };

  const moveStored = async (collection, index, direction) => {
    const field = collection === 'covers' ? 'coverPhotos' : 'gallery';
    const currentItems = draft[field] ?? [];
    const targetIndex = index + direction;
    if (!draft?._id || targetIndex < 0 || targetIndex >= currentItems.length) return;
    const nextItems = [...currentItems];
    [nextItems[index], nextItems[targetIndex]] = [nextItems[targetIndex], nextItems[index]];
    setDraft((current) => ({ ...current, [field]: nextItems }));
    try {
      const order = nextItems.map((item) => item.publicId);
      const result = collection === 'covers'
        ? await profileApi.reorderCovers(draft._id, order)
        : await profileApi.reorderGallery(draft._id, order);
      setDraft(result.profile);
      setProfiles((current) => current.map((profile) => profile._id === result.profile._id ? result.profile : profile));
    } catch (error) {
      setDraft((current) => ({ ...current, [field]: currentItems }));
      toast.error(error?.response?.data?.message ?? 'Could not change photo order');
    }
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
        <Card className="p-5 sm:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-[1.75rem] border-4 border-white bg-ink-100 shadow-lg">
              {(pendingImages.profile?.preview || draft.profilePhoto?.url) ? <img src={pendingImages.profile?.preview || draft.profilePhoto.url} alt="" className="h-full w-full object-cover" /> : <span className="grid h-full place-items-center text-3xl font-semibold text-ink-400">{draft.name?.charAt(0) || '?'}</span>}
              {pendingImages.profile && <><span className="absolute bottom-1.5 left-1.5 rounded-full bg-black/65 px-2 py-1 text-[10px] font-medium text-white">Ready to save</span><button type="button" onClick={() => removePending('profile')} aria-label="Discard new profile photo" className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-black/65 text-white"><X className="h-3.5 w-3.5" /></button></>}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold text-ink-900">Profile photo</h2>
              <p className="mt-1 text-sm leading-6 text-ink-500">Choose a photo, then crop and position it before saving.</p>
              <label className="mt-4 inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl bg-brand-500 px-4 text-sm font-medium text-white transition hover:bg-brand-600"><Crop className="h-4 w-4" /> Choose & crop<input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(event) => { chooseForCrop('profile', event.target.files); event.target.value = ''; }} /></label>
            </div>
          </div>
        </Card>

        <MediaCard
          title="Cover photos"
          description="Add up to 12 wide covers. Visitors can swipe through them on the public profile. Every selected cover opens in the crop tool."
          icon={ImagePlus}
          items={storedCovers}
          pending={pendingImages.covers}
          inputLabel="Add cover photos"
          onSelect={(files) => chooseForCrop('cover', files)}
          onRemoveStored={(publicId) => removeStored('covers', publicId)}
          onRemovePending={(index) => removePending('covers', index)}
          onMove={(index, direction) => moveStored('covers', index, direction)}
          legacyCover={!draft.coverPhotos?.length && Boolean(draft.coverPhoto)}
          aspect="wide"
        />

        <MediaCard
          title="Gallery"
          description="Add up to 60 photos at once. They appear in a fast, mobile-first gallery with a full-screen viewer."
          icon={Images}
          items={draft.gallery ?? []}
          pending={pendingImages.gallery}
          inputLabel="Add gallery photos"
          onSelect={queueGallery}
          onRemoveStored={(publicId) => removeStored('gallery', publicId)}
          onRemovePending={(index) => removePending('gallery', index)}
          onMove={(index, direction) => moveStored('gallery', index, direction)}
          aspect="portrait"
        />

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
            <Button variant="ghost" iconOnly icon={X} aria-label="Remove link" onClick={() => set('socials', draft.socials.filter((_, itemIndex) => itemIndex !== index))} />
          </div>)}</div>
        </Card>

        <Card className="p-5 sm:p-7">
          <h2 className="mb-5 text-lg font-semibold text-ink-900">Services & appearance</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <Textarea label="Services" hint="One service per line" rows={5} value={(draft.services || []).join('\n')} onChange={(e) => set('services', e.target.value.split('\n').map((item) => item.trim()).filter(Boolean))} placeholder={'Wedding photography\nCinematic films'} />
            <div className="space-y-5"><Input type="color" label="Accent colour" value={draft.accentColor} onChange={(e) => set('accentColor', e.target.value)} className="p-1" /><Switch label="Published publicly" checked={draft.isPublished} onChange={(e) => set('isPublished', e.target.checked)} /></div>
          </div>
        </Card>

        <div className="sticky bottom-3 z-10 flex flex-col gap-2 rounded-2xl border border-ink-200 bg-white/95 p-3 shadow-xl backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <div className="grid grid-cols-2 gap-2 sm:flex">{draft._id && <Button variant="danger" icon={Trash2} onClick={remove}>Delete</Button>}{draft._id && <Button as="a" href={`/${draft.slug}`} target="_blank" variant="secondary" icon={ExternalLink}>Preview</Button>}</div>
          <Button fullWidth className="sm:w-auto" icon={Save} loading={saving} onClick={save}>{draft._id ? 'Save changes' : 'Create profile'}</Button>
        </div>
      </div>}
    </div>

    <ImageCropModal file={cropQueue[0]?.file} kind={cropQueue[0]?.kind} onClose={() => setCropQueue((current) => current.slice(1))} onConfirm={acceptCrop} />
  </div>;
}

const MediaCard = ({ title, description, icon: Icon, items, pending, inputLabel, onSelect, onRemoveStored, onRemovePending, onMove, legacyCover = false, aspect }) => (
  <Card className="p-5 sm:p-7">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700"><Icon className="h-5 w-5" /></span>
        <div><h2 className="text-lg font-semibold text-ink-900">{title}</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-ink-500">{description}</p></div>
      </div>
      <label className="inline-flex h-10 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl border border-ink-200 bg-white px-4 text-sm font-medium text-ink-700 shadow-xs transition hover:bg-ink-50"><Upload className="h-4 w-4" /> {inputLabel}<input type="file" multiple accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(event) => { onSelect(event.target.files); event.target.value = ''; }} /></label>
    </div>

    {(items.length > 0 || pending.length > 0) ? (
      <div className={`mt-5 grid gap-3 ${aspect === 'wide' ? 'sm:grid-cols-2' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'}`}>
        {items.map((asset, index) => <PhotoTile key={asset.publicId || asset.url} source={asset.url} alt={asset.alt || ''} wide={aspect === 'wide'} label={legacyCover && index === 0 ? 'Current cover' : undefined} onRemove={legacyCover && index === 0 ? undefined : () => onRemoveStored(asset.publicId)} onPrevious={!legacyCover && index > 0 ? () => onMove(index, -1) : undefined} onNext={!legacyCover && index < items.length - 1 ? () => onMove(index, 1) : undefined} />)}
        {pending.map((entry, index) => <PhotoTile key={entry.preview} source={entry.preview} alt="New upload preview" wide={aspect === 'wide'} label="Ready to save" pending onRemove={() => onRemovePending(index)} />)}
      </div>
    ) : <div className="mt-5 grid min-h-32 place-items-center rounded-2xl border border-dashed border-ink-200 bg-ink-50/60 px-5 text-center text-sm text-ink-400">No photos added yet.</div>}
  </Card>
);

const PhotoTile = ({ source, alt, wide, label, pending, onRemove, onPrevious, onNext }) => (
  <figure className={`group relative overflow-hidden rounded-2xl bg-ink-100 ${wide ? 'aspect-[2/1]' : 'aspect-[4/5]'}`}>
    <img src={source} alt={alt} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]" />
    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
    {(label || pending) && <figcaption className="absolute bottom-2 left-2 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur">{label || 'Ready to save'}</figcaption>}
    {onRemove && <button type="button" aria-label="Remove photo" onClick={onRemove} className="absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-full bg-black/60 text-white backdrop-blur transition hover:bg-danger-600"><Trash2 className="h-4 w-4" /></button>}
    {(onPrevious || onNext) && <div className="absolute bottom-2 right-2 flex gap-1">
      {onPrevious && <button type="button" aria-label="Move photo earlier" onClick={onPrevious} className="grid h-8 w-8 place-items-center rounded-full bg-black/60 text-white backdrop-blur hover:bg-black/80"><ChevronLeft className="h-4 w-4" /></button>}
      {onNext && <button type="button" aria-label="Move photo later" onClick={onNext} className="grid h-8 w-8 place-items-center rounded-full bg-black/60 text-white backdrop-blur hover:bg-black/80"><ChevronRight className="h-4 w-4" /></button>}
    </div>}
  </figure>
);
