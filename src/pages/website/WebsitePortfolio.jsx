import { ImageCropModal } from '@/components/profile/ImageCropModal';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Image as ImageIcon, Plus, Star, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  ConfirmDialog,
  EmptyState,
  Input,
  Modal,
  PageHeader,
  PageLoader,
  Select,
  Switch,
  Textarea,
} from '@/components/ui';
import { SlotImageUpload } from '@/components/website/SlotImageUpload';
import { SortableGrid } from '@/components/website/SortableGrid';
import { websiteApi } from '@/api/websiteApi';
import { PORTFOLIO_CATEGORY_OPTIONS, PORTFOLIO_SPAN_OPTIONS } from './sectionMeta';

/** Shows a stored slug the way it reads on the website: pre-weddings -> Pre Weddings. */
const prettyCategory = (value) => String(value ?? '').replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
import { SectionHeadingCard } from './SectionHeadingCard';

const GALLERY_SLOTS = [
  { value: 'galleryPortrait', label: 'Portrait frame (choose crop for 1200×1800)' },
  { value: 'galleryLandscape', label: 'Landscape frame (choose crop for 1800×1200)' },
];

/** Shows upload / Drive-copy progress under the album it belongs to. */
const ProgressBar = ({ progress, onStop }) => (
  <div className="space-y-1.5" role="status" aria-live="polite">
    <div className="flex items-center justify-between gap-3 text-xs text-ink-600">
      <span>
        {progress.label}
        {progress.total ? ` ${progress.done} / ${progress.total}` : '…'}
      </span>
      {onStop && progress.label === 'Copying from Drive' && (
        <button type="button" onClick={onStop} className="font-medium text-danger-600 underline">
          Stop
        </button>
      )}
    </div>
    <div className="h-1.5 overflow-hidden rounded-full bg-ink-100">
      <div
        className="h-full rounded-full bg-brand-600 transition-all duration-300"
        style={{ width: `${progress.total ? Math.round((progress.done / progress.total) * 100) : 8}%` }}
      />
    </div>
  </div>
);

const coverSlot = span => ({wide:'portfolioCoverWide',tall:'portfolioCoverTall',std:'portfolioCoverStandard'}[span] || 'portfolioCoverStandard');

const emptyDraft = { title: '', slug: '', category: 'weddings', span: 'std', description: '', videoUrl: '', videoLinks: '', coverDriveUrl: '' };

export const WebsitePortfolio = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [draftAlbums, setDraftAlbums] = useState([]);
  const [cover, setCover] = useState(null);
  const [videoFiles,setVideoFiles]=useState([]);
  const [galleryCrop,setGalleryCrop]=useState(null);
  const cropResolver=useRef(null);
  const videoLinks = text => String(text || '').split(/\n/).map(v=>v.trim()).filter(Boolean);
  const uploadVideos = async (id, files) => {
    let item;
    for (const [i,file] of Array.from(files).entries()) {
      setProgress({key:'videos',done:i,total:files.length,label:'Uploading videos'});
      item=(await websiteApi.portfolio.uploadVideo(id,file)).item;
    }
    return item;
  };
  const [saving, setSaving] = useState(false);
  const [gallerySlot, setGallerySlot] = useState('galleryPortrait');
  const [albumTitle, setAlbumTitle] = useState('');
  // One Drive-link box per album (keyed by album id, or 'general').
  const [driveLinks, setDriveLinks] = useState({});
  // Keep each photo's own shape (recommended) instead of cropping to a frame.
  const [keepShape, setKeepShape] = useState(true);
  // Import by link only (photos stay in Drive) instead of copying to Cloudinary.
  const [linkOnly, setLinkOnly] = useState(false);
  // { key, done, total, label } while photos are uploading or being copied.
  const [progress, setProgress] = useState(null);
  const stopRequested = useRef(false);
  const [deletingAlbum, setDeletingAlbum] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { portfolio } = await websiteApi.portfolio.list({ limit: 100 });
      setItems(portfolio);
    } catch (error) {
      toast.error(error?.response?.data?.message ?? 'Could not load the portfolio.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const create = async () => {
    if (!cover && !draft.coverDriveUrl.trim()) {
      toast.error('A cover image is required (upload one or paste a Google Drive link).');
      return;
    }

    setSaving(true);
    try {
      const created = await websiteApi.portfolio.create({
        ...draft,
        videoUrls: videoLinks(draft.videoLinks),
        file: cover?.file,
        slot: 'portfolioCover',
        coverAlt: cover?.alt ?? draft.title,
      });
      setCreating(false);setEditing(created.item);
      try {
        for (const album of draftAlbums) {
          const result = await websiteApi.portfolio.createAlbum(created.item._id, { title: album.title, videoUrl: album.videoUrl });
          setEditing(result.item);
          if (album.files?.length) {
            const savedAlbum = result.item.albums[result.item.albums.length - 1];
            const uploaded = await websiteApi.portfolio.addGallery(created.item._id, album.files.map(file => ({file, slot: 'galleryPortrait', alt: draft.title, albumId: savedAlbum._id, keepShape: true})));
            setEditing(uploaded.item);
          }
        }
      } catch(error) {
        toast.error(`Entry saved. Some albums could not be added: ${error?.response?.data?.message || error.message}. Add the remaining albums in Edit.`);
      }
      setDraftAlbums([]);
      if(videoFiles.length){
        try { setEditing(await uploadVideos(created.item._id,videoFiles)); }
        catch(error){setEditing((await websiteApi.portfolio.get(created.item._id)).item);toast.error(`Entry saved. Video upload failed: ${error?.response?.data?.message || error.message}. Retry remaining files in Edit.`);}
      }
      setVideoFiles([]);setProgress(null);
      toast.success('Portfolio entry created.');
      setCreating(false);
      setDraft(emptyDraft);
      setCover(null);
      await load();
    } catch (error) {
      toast.error(error?.response?.data?.message ?? 'That entry could not be created.');
    } finally {
      setSaving(false);
    }
  };

  const patch = async (item, changes) => {
    try {
      await websiteApi.portfolio.update(item._id, changes);
      await load();
      if (editing?._id === item._id) {
        setEditing((prev) => ({ ...prev, ...changes }));
      }
    } catch (error) {
      toast.error(error?.response?.data?.message ?? 'That change could not be saved.');
    }
  };

  const saveDetails = async () => {
    if (!editing || saving) return;
    setSaving(true);
    try {
      const { item } = await websiteApi.portfolio.update(editing._id, {
        title: editing.title, slug: editing.slug, category: editing.category,
        span: editing.span, description: editing.description,
        location: editing.location || '', eventDate: editing.eventDate || null,
        videoUrl: '', videoUrls: videoLinks(editing.videoLinks ?? [editing.videoUrl, ...(editing.videoUrls || [])].filter(Boolean).join('\n')),
        filmDetails: editing.filmDetails || [],
        isPublished: editing.isPublished,
      });
      let saved = item;
      for (const album of editing.albums || []) {
        saved = (await websiteApi.portfolio.updateAlbum(editing._id, album._id, {title: album.title, videoUrl: album.videoUrl || '',videoTitle:album.videoTitle || '',videoPosterUrl:album.videoPosterUrl || '',description:album.description || ''})).item;
      }
      setEditing(saved);
      toast.success('Details saved.');
      await load();
    } catch(error) { toast.error(error?.response?.data?.message || 'Could not save details.'); }
    finally { setSaving(false); }
  };

  const remove = async () => {
    const item = deleting;
    setDeleting(null);
    try {
      await websiteApi.portfolio.remove(item._id);
      toast.success('Entry deleted.');
      await load();
    } catch (error) {
      toast.error(error?.response?.data?.message ?? 'That entry could not be deleted.');
    }
  };

  const addGalleryImages = async (fileList, albumId) => {
    const files = Array.from(fileList ?? []);
    if (files.length === 0) return;

    setSaving(true);
    setProgress({ key: albumId ?? 'general', done: 0, total: files.length, label: 'Uploading' });
    try {
      const prepared=[];
      for(const file of files){
        const selected=keepShape ? file : await new Promise(resolve=>{cropResolver.current=resolve;setGalleryCrop(file)});
        if(selected)prepared.push(selected);
      }
      if(!prepared.length)return;
      const entries = prepared.map((file) => ({ file, slot: gallerySlot, alt: editing.title, albumId, keepShape: true }));
      const { item } = await websiteApi.portfolio.addGallery(editing._id, entries, {
        onProgress: (done, total) => setProgress({ key: albumId ?? 'general', done, total, label: 'Uploading' }),
      });
      setEditing(item);
      toast.success(`${prepared.length} image${prepared.length > 1 ? 's' : ''} added.`);
      await load();
    } catch (error) {
      toast.error(error?.response?.data?.message ?? 'Those images could not be added.');
      // Photos sent before the failure are already saved; show them.
      try {
        const { item } = await websiteApi.portfolio.get(editing._id);
        setEditing(item);
      } catch {
        // Keep the previous view; the toast above already explains the failure.
      }
    } finally {
      setSaving(false);
      setProgress(null);
    }
  };

  const addFromDrive = async (albumId) => {
    const key = albumId ?? 'general';
    const url = (driveLinks[key] ?? '').trim();
    if (!url || !editing) return;

    setSaving(true);
    stopRequested.current = false;
    try {
      // "Link only": the photos stay in Drive and are shown straight from it.
      if (linkOnly) {
        const { item, added } = await websiteApi.portfolio.addGalleryFromDrive(editing._id, {
          url,
          albumId,
          alt: editing.title,
        });
        setEditing(item);
        setDriveLinks((current) => ({ ...current, [key]: '' }));
        toast.success(`${added} image${added > 1 ? 's' : ''} linked from Google Drive.`);
        await load();
        return;
      }

      // Copy: bring each photo across one request at a time, so a big folder
      // shows real progress and one bad file cannot lose the rest.
      setProgress({ key, done: 0, total: 0, label: 'Reading Drive link' });
      const { files, alreadyImported } = await websiteApi.portfolio.listDriveImages(editing._id, { url, albumId });

      if (files.length === 0) {
        toast.success(`Nothing new: all ${alreadyImported} photo${alreadyImported === 1 ? ' is' : 's are'} already in this album.`);
        return;
      }

      let copied = 0;
      const failed = [];
      for (const file of files) {
        if (stopRequested.current) break;
        setProgress({ key, done: copied + failed.length, total: files.length, label: 'Copying from Drive' });
        try {
          // eslint-disable-next-line no-await-in-loop
          await websiteApi.portfolio.importDriveImage(editing._id, {
            fileId: file.id,
            name: file.name,
            albumId,
            alt: editing.title,
          });
          copied += 1;
        } catch (error) {
          failed.push({ name: file.name, message: error?.response?.data?.message ?? 'Failed' });
          // The same message would repeat for every file, so stop early.
          if (/Cloudinary is not set up/i.test(error?.response?.data?.message ?? '')) break;
        }
      }

      const { item } = await websiteApi.portfolio.get(editing._id);
      setEditing(item);
      if (copied > 0) setDriveLinks((current) => ({ ...current, [key]: '' }));
      await load();

      if (copied > 0) toast.success(`${copied} photo${copied > 1 ? 's' : ''} copied from Google Drive.`);
      if (failed.length > 0) {
        toast.error(`${failed.length} could not be copied. ${failed[0].name}: ${failed[0].message}`, { duration: 8000 });
      }
      if (stopRequested.current) toast('Stopped. Run the same link again to continue where you left off.');
    } catch (error) {
      toast.error(error?.response?.data?.message ?? 'Could not import from Google Drive.');
    } finally {
      setSaving(false);
      setProgress(null);
    }
  };

  const saveAlbum = async (album) => {
    try {
      const { item } = await websiteApi.portfolio.updateAlbum(editing._id, album._id, {
        title: album.title,
        videoUrl: album.videoUrl,
        videoTitle: album.videoTitle || '', videoPosterUrl: album.videoPosterUrl || '', description: album.description || '',
      });
      setEditing(item);
      toast.success('Album saved.');
      await load();
    } catch (error) {
      toast.error(error?.response?.data?.message ?? 'Could not save the album.');
    }
  };

  const removeAlbum = async () => {
    const album = deletingAlbum;
    setDeletingAlbum(null);
    if (!album || !editing) return;
    try {
      const { item } = await websiteApi.portfolio.removeAlbum(editing._id, album._id);
      setEditing(item);
      toast.success('Album deleted.');
      await load();
    } catch (error) {
      toast.error(error?.response?.data?.message ?? 'Could not delete the album.');
    }
  };

  const removeImage = async (asset, albumId) => {
    try {
      const { item } = await websiteApi.portfolio.removeGalleryImage(editing._id, asset.publicId, albumId);
      setEditing(item);
      await load();
    } catch (error) {
      toast.error(error?.response?.data?.message ?? 'Could not remove that image.');
    }
  };

  const createAlbum = async () => {
    const title = albumTitle.trim();
    if (!title || !editing) return;

    // A pasted link here becomes the heading shown to visitors.
    if (/^(https?:\/\/|www\.)/i.test(title)) {
      toast.error('That looks like a link. Give the album a name (e.g. Pre-wedding), then paste the link inside the album.');
      return;
    }

    setSaving(true);
    try {
      const { item } = await websiteApi.portfolio.createAlbum(editing._id, { title });
      setEditing(item);
      setAlbumTitle('');
      toast.success('Shoot album created.');
      await load();
    } catch (error) {
      toast.error(error?.response?.data?.message ?? 'Could not create the album.');
    } finally {
      setSaving(false);
    }
  };

  if (loading && items.length === 0) return <PageLoader label="Loading portfolio" />;

  return (
    <>
      <ImageCropModal file={galleryCrop} kind="gallery" aspect={gallerySlot==='galleryPortrait'?2/3:3/2} outputWidth={gallerySlot==='galleryPortrait'?1200:1800} onClose={()=>{setGalleryCrop(null);cropResolver.current?.(null)}} onConfirm={file=>{setGalleryCrop(null);cropResolver.current?.(file)}}/>
      <PageHeader
        title="Portfolio"
        description="The work shown on the website. Drag to reorder the public grid."
        actions={
          <Button icon={Plus} onClick={() => setCreating(true)}>
            New entry
          </Button>
        }
      />

      <SectionHeadingCard sectionKey="portfolioSection" label="Section heading" withCta />

      {items.length === 0 ? (
        <EmptyState
          icon={ImageIcon}
          title="No portfolio entries yet"
          description="Add your first shoot to populate the website's portfolio grid."
          action={
            <Button icon={Plus} onClick={() => setCreating(true)}>
              New entry
            </Button>
          }
        />
      ) : (
        <SortableGrid
          items={items}
          getKey={(item) => item._id}
          onReorder={(order) => websiteApi.portfolio.reorder(order)}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          itemClassName="bg-white shadow-card overflow-hidden"
          renderItem={(item) => (
            <div>
              <img
                src={item.coverImage?.thumbnail || item.coverImage?.url}
                alt={item.coverImage?.alt || ''}
                className="h-48 w-full object-cover"
              />
              <div className="p-4">
                <div className="mb-2 flex flex-wrap items-center gap-1.5">
                  <Badge tone={item.isPublished ? 'success' : 'neutral'} size="sm">
                    {item.isPublished ? 'Published' : 'Draft'}
                  </Badge>
                  {item.isFeatured && (
                    <Badge tone="brand" size="sm">
                      Featured
                    </Badge>
                  )}
                  <Badge tone="neutral" size="sm">
                    {(item.gallery?.length ?? 0) + (item.albums ?? []).reduce((total, album) => total + (album.gallery?.length ?? 0), 0)} photos
                  </Badge>
                </div>

                <h3 className="truncate text-md font-semibold text-ink-900">{item.title}</h3>
                <p className="mt-0.5 text-sm capitalize text-ink-500">
                  {prettyCategory(item.category)}
                </p>

                <div className="mt-4 flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => setEditing(item)}>
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={Star}
                    aria-label={item.isFeatured ? 'Remove from featured' : 'Mark as featured'}
                    className={item.isFeatured ? 'text-brand-600' : undefined}
                    onClick={() => patch(item, { isFeatured: !item.isFeatured })}
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={Trash2}
                    aria-label={`Delete ${item.title}`}
                    onClick={() => setDeleting(item)}
                    className="text-ink-400 hover:text-danger-600"
                  />
                </div>
              </div>
            </div>
          )}
        />
      )}

      <datalist id="portfolio-categories">
        {[...new Set([...PORTFOLIO_CATEGORY_OPTIONS.map((option) => option.value), ...items.map((entry) => entry.category)])].map((value) => (
          <option key={value} value={prettyCategory(value)} />
        ))}
      </datalist>

      {/* Create */}
      <Modal open={creating} onClose={()=>{if(!saving)setCreating(false)}} closeOnBackdrop={!saving} title="New portfolio entry" size="lg">
        <div className="space-y-4">
          <Input
            label="Title"
            value={draft.title}
            onChange={(event) => setDraft({ ...draft, title: event.target.value })}
          />
          <Input
            label="URL slug (optional)"
            value={draft.slug}
            placeholder="kabir-meera"
            onChange={(event) => setDraft({ ...draft, slug: event.target.value })}
            hint="Leave empty to create it automatically from the title."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Category"
              list="portfolio-categories"
              value={prettyCategory(draft.category)}
              placeholder="Pick one or type your own"
              hint="A new name creates a new tab on the website."
              onChange={(event) => setDraft({ ...draft, category: event.target.value })}
            />
            <Select
              label="Tile shape"
              options={PORTFOLIO_SPAN_OPTIONS}
              value={draft.span}
              onChange={(event) => setDraft({ ...draft, span: event.target.value })}
            />
          </div>
          <Textarea
            label="Description"
            rows={3}
            value={draft.description}
            onChange={(event) => setDraft({ ...draft, description: event.target.value })}
          />
          <Textarea label="Video links (optional, one per line)" rows={3} placeholder="YouTube, Google Drive or video links" value={draft.videoLinks} onChange={e=>setDraft({...draft,videoLinks:e.target.value})}/>
          <label className="block text-sm font-medium">Upload videos (optional, multiple files)<input className="mt-2 block w-full" type="file" accept="video/mp4,video/quicktime,video/webm" multiple disabled={saving} onChange={e=>setVideoFiles(Array.from(e.target.files||[]))}/></label>
          {videoFiles.length>0&&<p className="text-sm">{videoFiles.length} videos selected. Uploaded after the entry is saved.</p>}
          {progress?.key==='videos'&&<ProgressBar progress={progress}/>}


          <SlotImageUpload
            slot={coverSlot(draft.span)}
            label="Cover image"
            value={cover ? { url: cover.preview, alt: cover.alt } : null}
            // Held locally until save: the entry does not exist yet, so there is
            // nothing on the server to attach an upload to.
            onUpload={async ({ file, alt }) =>
              setCover({ file, alt, preview: URL.createObjectURL(file) })
            }
            onRemove={() => setCover(null)}
          />
          {!cover && (
            <Input
              label="…or cover from Google Drive (saves server space)"
              placeholder="https://drive.google.com/file/d/…/view"
              value={draft.coverDriveUrl}
              onChange={(event) => setDraft({ ...draft, coverDriveUrl: event.target.value })}
              hint="The file must be shared as “Anyone with the link can view”."
            />
          )}

          <Card>
            <CardHeader><CardTitle>Shoot albums</CardTitle><Button size="sm" icon={Plus} disabled={saving} onClick={() => setDraftAlbums(current => [...current, {title: '', videoUrl: ''}])}>Add album</Button></CardHeader>
            <CardBody className="space-y-4">
              <p className="text-sm text-ink-500">Set up your albums now. Choose photos and video links for each album.</p>
              {draftAlbums.map((album, index) => <div key={index} className="space-y-2 rounded-xl border p-3">
                <Input label="Album name" value={album.title} onChange={e => setDraftAlbums(current => current.map((a,i) => i === index ? {...a,title:e.target.value} : a))}/>
                <Input label="Video link (optional)" value={album.videoUrl} onChange={e => setDraftAlbums(current => current.map((a,i) => i === index ? {...a,videoUrl:e.target.value} : a))}/>
                <label className="block text-sm">Album photos<input type="file" multiple accept="image/jpeg,image/png,image/webp" disabled={saving} className="mt-2 block w-full" onChange={e => { const files = Array.from(e.target.files || []); setDraftAlbums(current => current.map((a,i) => i === index ? {...a,files} : a)); }}/></label>
                <Button size="sm" variant="ghost" disabled={saving} onClick={() => setDraftAlbums(current => current.filter((_,i) => i !== index))}>Remove album</Button>
              </div>)}
            </CardBody>
          </Card>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" disabled={saving} onClick={() => setCreating(false)}>
              Cancel
            </Button>
            <Button onClick={create} loading={saving} disabled={!draft.title || draftAlbums.some(album => !album.title.trim()) || (!cover && !draft.coverDriveUrl.trim())}>
              Create entry
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit */}
      <Modal
        open={Boolean(editing)}
        onClose={() => { if (!saving) setEditing(null); }}
        closeOnBackdrop={!saving}
        headerActions={<Button size="sm" onClick={saveDetails} loading={saving}>Save</Button>}
        title={editing?.title ?? ''}
        size="lg"
      >
        {editing && (
          <div className="space-y-5">
            <Select
              label="Tile shape"
              hint="Choose how this entry appears in the website portfolio grid, then press Save."
              options={PORTFOLIO_SPAN_OPTIONS}
              value={editing.span || 'std'}
              disabled={saving}
              onChange={(event) => setEditing({ ...editing, span: event.target.value })}
            />
            <SlotImageUpload slot={coverSlot(editing.span)} label="Cover image — replace and crop" value={editing.coverImage} disabled={saving}
              onUpload={async payload => {
                const { item } = await websiteApi.portfolio.updateCover(editing._id, {...payload, span: editing.span || 'std'});
                setEditing(current => ({ ...current, coverImage: item.coverImage }));
                await load();
              }} />
            <Card>
              <CardHeader>
                <CardTitle className="text-md">Details</CardTitle>
              </CardHeader>
              <CardBody className="space-y-4">
                <Input
                  label="Title"
                  value={editing.title}
                  onChange={(event) => setEditing({ ...editing, title: event.target.value })}
                />
                <Input
                  label="URL slug"
                  value={editing.slug ?? ''}
                  placeholder="kabir-meera"
                  hint="This creates the public URL, for example /kabir-meera."
                  onChange={(event) => setEditing({ ...editing, slug: event.target.value })}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Category"
                    list="portfolio-categories"
                    value={prettyCategory(editing.category)}
                    placeholder="Pick one or type your own"
                    hint="A new name creates a new tab on the website."
                    onChange={(event) => setEditing({ ...editing, category: event.target.value })}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Location (optional)"
                    value={editing.location ?? ''}
                    placeholder="Udaipur"
                    onChange={(event) => setEditing({ ...editing, location: event.target.value })}
                  />
                  <Input
                    label="Event date (optional)"
                    type="date"
                    value={editing.eventDate ? String(editing.eventDate).slice(0, 10) : ''}
                    onChange={(event) => setEditing({ ...editing, eventDate: event.target.value })}
                  />
                </div>
                <Textarea
                  label="Description"
                  rows={3}
                  value={editing.description ?? ''}
                  onChange={(event) => setEditing({ ...editing, description: event.target.value })}
                />
                <Textarea label="Video links (optional, one per line)" rows={3} value={editing.videoLinks ?? [...new Set([editing.videoUrl,...(editing.videoUrls||[])].filter(Boolean))].join('\n')} onChange={e=>setEditing({...editing,videoLinks:e.target.value})}/>
                {[...new Set([...videoLinks(editing.videoLinks ?? [editing.videoUrl,...(editing.videoUrls || [])].filter(Boolean).join('\n')), ...(editing.videos || []).map(video => video.url)])].map((url,index) => {
                  const details = editing.filmDetails?.find(film => film.url === url) || {};
                  const change = patch => setEditing(current => ({...current,filmDetails:[...(current.filmDetails || []).filter(film=>film.url!==url),{...details,url,...patch}]}));
                  return <div key={url} className="space-y-2 rounded-xl border border-ink-200 p-3"><p className="truncate text-xs text-ink-500">Film {index+1}: {url}</p><Input label="Film display title" value={details.title || ''} onChange={e=>change({title:e.target.value})}/><Input label="Film thumbnail URL (optional)" value={details.posterUrl || ''} placeholder="https://res.cloudinary.com/…" onChange={e=>change({posterUrl:e.target.value})}/></div>;
                })}
                <label className="block text-sm font-medium">Add video files<input type="file" multiple accept="video/mp4,video/quicktime,video/webm" disabled={saving} className="mt-2 block w-full" onChange={async e=>{const files=Array.from(e.target.files||[]);e.target.value='';if(!files.length)return;setSaving(true);try{setEditing(await uploadVideos(editing._id,files));await load()}catch(error){toast.error(error?.response?.data?.message||'Video upload failed');const result=await websiteApi.portfolio.get(editing._id);setEditing(result.item)}finally{setSaving(false);setProgress(null)}}}/></label>
                {progress?.key==='videos'&&<ProgressBar progress={progress}/>}
                {(editing.videos||[]).map(video=><div key={video._id} className="flex items-center justify-between gap-2 rounded border p-2"><a href={video.url} target="_blank" rel="noreferrer" className="truncate text-sm underline">{video.title||'Video'}</a><Button size="sm" variant="danger-soft" disabled={saving} onClick={async()=>{try{const result=await websiteApi.portfolio.removeVideo(editing._id,video._id);setEditing(result.item);await load()}catch(error){toast.error(error?.response?.data?.message||'Could not remove video')}}}>Remove</Button></div>)}


                <div className="flex items-center justify-between">
                  <span className="text-base text-ink-800">Published on the website</span>
                  <Switch
                    checked={editing.isPublished}
                    onChange={(event) => setEditing({ ...editing, isPublished: event.target.checked })}
                    aria-label="Published on the website"
                  />
                </div>

              </CardBody>
            </Card>

            <Card>
              <CardHeader className="flex-wrap gap-3">
                <CardTitle className="text-md">Shoot albums</CardTitle>
                <div className="flex flex-wrap items-center gap-3">
                  <label className="flex items-center gap-2 text-sm text-ink-700">
                    <Switch
                      checked={keepShape}
                      onChange={(event) => setKeepShape(event.target.checked)}
                      aria-label="Keep each photo's original shape"
                    />
                    Keep original shape (off: choose crop per photo)
                  </label>
                  {!keepShape && (
                    <Select
                      options={GALLERY_SLOTS}
                      value={gallerySlot}
                      onChange={(event) => setGallerySlot(event.target.value)}
                      aria-label="Display frame for the next upload"
                      className="w-full sm:w-52"
                    />
                  )}
                </div>
              </CardHeader>
              <CardBody className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={albumTitle}
                    onChange={(event) => setAlbumTitle(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') createAlbum();
                    }}
                    placeholder="e.g. Pre-wedding photos (a name, not a link)"
                    aria-label="New shoot album title"
                  />
                  <Button icon={Plus} onClick={createAlbum} loading={saving} disabled={!albumTitle.trim()}>
                    Add album
                  </Button>
                </div>
                <p className="text-sm text-ink-500">
                  Create as many albums as needed for one couple: Pre-wedding, Wedding, Maternity, and more.
                </p>

                {(editing.albums ?? []).map((album) => (
                  <div key={album._id} className="space-y-4 rounded-xl border border-ink-200 p-4">
                    <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-end">
                      <Input
                        label="Album name"
                        value={album.title}
                        onChange={(event) =>
                          setEditing((current) => ({
                            ...current,
                            albums: current.albums.map((entry) =>
                              entry._id === album._id ? { ...entry, title: event.target.value } : entry,
                            ),
                          }))
                        }
                      />
                      <Input
                        label="Video link (optional)"
                        value={album.videoUrl ?? ''}
                        placeholder="YouTube or Google Drive video link"
                        onChange={(event) =>
                          setEditing((current) => ({
                            ...current,
                            albums: current.albums.map((entry) =>
                              entry._id === album._id ? { ...entry, videoUrl: event.target.value } : entry,
                            ),
                          }))
                        }
                      />
                      <Button size="sm" onClick={() => saveAlbum(album)}>
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={Trash2}
                        aria-label={`Delete ${album.title}`}
                        className="text-danger-600"
                        onClick={() => setDeletingAlbum(album)}
                      />
                    </div>

                    <Textarea label="Album introduction (optional)" value={album.description || ''} onChange={e => setEditing(current=>({...current,albums:current.albums.map(a=>a._id===album._id?{...a,description:e.target.value}:a)}))}/>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Input label="Album film title (optional)" value={album.videoTitle || ''} onChange={e=>setEditing(current=>({...current,albums:current.albums.map(a=>a._id===album._id?{...a,videoTitle:e.target.value}:a)}))}/>
                      <Input label="Album film thumbnail URL (optional)" value={album.videoPosterUrl || ''} placeholder="https://res.cloudinary.com/…" onChange={e=>setEditing(current=>({...current,albums:current.albums.map(a=>a._id===album._id?{...a,videoPosterUrl:e.target.value}:a)}))}/>
                    </div>

                    <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-ink-300 bg-ink-50/60 py-6 text-center">
                      <Plus className="h-5 w-5 text-ink-400" aria-hidden="true" />
                      <span className="text-sm font-medium text-ink-700">
                        {saving ? 'Working…' : `Add photos to ${album.title}`}
                      </span>
                      <span className="text-xs text-ink-500">
                        {keepShape
                          ? 'Photos keep their own shape. Large camera files are supported.'
                          : `Photos are cropped to a fixed frame. ${GALLERY_SLOTS.find((s) => s.value === gallerySlot)?.label}`}
                      </span>
                      <input
                        type="file"
                        multiple
                        accept="image/jpeg,image/png,image/webp"
                        className="sr-only"
                        disabled={saving}
                        onChange={(event) => {
                          const chosen = event.target.files;
                          addGalleryImages(chosen, album._id);
                          // Lets the same files be chosen again after an error.
                          event.target.value = '';
                        }}
                      />
                    </label>

                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          value={driveLinks[album._id] ?? ''}
                          onChange={(event) => setDriveLinks((c) => ({ ...c, [album._id]: event.target.value }))}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' && !saving) addFromDrive(album._id);
                          }}
                          placeholder="Google Drive photo or folder link"
                          aria-label={`Google Drive link for ${album.title}`}
                        />
                        <Button
                          onClick={() => addFromDrive(album._id)}
                          loading={saving && progress?.key === album._id}
                          disabled={saving || !(driveLinks[album._id] ?? '').trim()}
                        >
                          Import
                        </Button>
                      </div>
                      <label className="flex items-start gap-2 text-xs text-ink-500">
                        <input
                          type="checkbox"
                          className="mt-0.5"
                          checked={linkOnly}
                          onChange={(event) => setLinkOnly(event.target.checked)}
                        />
                        <span>
                          Link only. Keeps photos in Drive instead of copying them to your website storage. Simpler, but
                          Drive can refuse to show many photos at once.
                        </span>
                      </label>
                      {progress?.key === album._id && (
                        <ProgressBar
                          progress={progress}
                          onStop={() => {
                            stopRequested.current = true;
                          }}
                        />
                      )}
                    </div>

                    {album.gallery?.length > 0 && (
                      <SortableGrid
                        items={album.gallery}
                        getKey={(asset) => asset.publicId}
                        onReorder={(order) => websiteApi.portfolio.reorderGallery(editing._id, order, album._id)}
                        className="grid grid-cols-2 gap-3 sm:grid-cols-3"
                        itemClassName="overflow-hidden bg-ink-100"
                        renderItem={(asset) => (
                          <div className="relative">
                            <img
                              src={asset.thumbnail || asset.url}
                              alt={asset.alt || ''}
                              loading="lazy"
                              decoding="async"
                              className="h-28 w-full object-cover"
                            />
                            <Button
                              variant="secondary"
                              size="sm"
                              iconOnly
                              icon={Trash2}
                              aria-label="Remove this image"
                              className="absolute right-1.5 top-1.5"
                              onClick={() => removeImage(asset, album._id)}
                            />
                          </div>
                        )}
                      />
                    )}
                  </div>
                ))}

                {/* Existing entries used one ungrouped gallery. Keep it visible
                    while new uploads move to named albums. */}
                {editing.gallery?.length > 0 && (
                  <div className="space-y-3 rounded-xl border border-ink-200 p-4">
                    <p className="text-sm font-medium text-ink-800">General gallery</p>
                    <SortableGrid
                      items={editing.gallery}
                      getKey={(asset) => asset.publicId}
                      onReorder={(order) => websiteApi.portfolio.reorderGallery(editing._id, order)}
                      className="grid grid-cols-2 gap-3 sm:grid-cols-3"
                      itemClassName="overflow-hidden bg-ink-100"
                      renderItem={(asset) => (
                        <div className="relative">
                          <img
                            src={asset.thumbnail || asset.url}
                            alt={asset.alt || ''}
                            loading="lazy"
                            decoding="async"
                            className="h-28 w-full object-cover"
                          />
                          <Button
                            variant="secondary"
                            size="sm"
                            iconOnly
                            icon={Trash2}
                            aria-label="Remove this image"
                            className="absolute right-1.5 top-1.5"
                            onClick={() => removeImage(asset)}
                          />
                        </div>
                      )}
                    />
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={remove}
        title="Delete this portfolio entry?"
        message={
          deleting
            ? `“${deleting.title}” and all ${
                (deleting.gallery?.length ?? 0) +
                (deleting.albums ?? []).reduce((total, album) => total + (album.gallery?.length ?? 0), 0)
              } of its photos will be permanently removed.`
            : ''
        }
        confirmLabel="Delete"
      />

      <ConfirmDialog
        open={Boolean(deletingAlbum)}
        onClose={() => setDeletingAlbum(null)}
        onConfirm={removeAlbum}
        title="Delete this album?"
        message={
          deletingAlbum
            ? `“${deletingAlbum.title}” and its ${deletingAlbum.gallery?.length ?? 0} photos will be permanently removed from the website.`
            : ''
        }
        confirmLabel="Delete album"
      />
    </>
  );
};

export default WebsitePortfolio;
