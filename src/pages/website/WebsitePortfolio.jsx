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
  { value: 'galleryPortrait', label: 'Portrait frame (auto-crop to 1200×1800)' },
  { value: 'galleryLandscape', label: 'Landscape frame (auto-crop to 1800×1200)' },
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

const emptyDraft = { title: '', slug: '', category: 'weddings', span: 'std', description: '', videoUrl: '', coverDriveUrl: '' };

export const WebsitePortfolio = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [cover, setCover] = useState(null);
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
      await websiteApi.portfolio.create({
        ...draft,
        file: cover?.file,
        slot: 'portfolioCover',
        coverAlt: cover?.alt ?? draft.title,
      });
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
      const entries = files.map((file) => ({ file, slot: gallerySlot, alt: editing.title, albumId, keepShape }));
      const { item } = await websiteApi.portfolio.addGallery(editing._id, entries, {
        onProgress: (done, total) => setProgress({ key: albumId ?? 'general', done, total, label: 'Uploading' }),
      });
      setEditing(item);
      toast.success(`${files.length} image${files.length > 1 ? 's' : ''} added.`);
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
      <Modal open={creating} onClose={() => setCreating(false)} title="New portfolio entry" size="lg">
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
          <Input
            label="Video link (optional)"
            placeholder="YouTube or Google Drive video link"
            value={draft.videoUrl}
            onChange={(event) => setDraft({ ...draft, videoUrl: event.target.value })}
          />

          <SlotImageUpload
            slot="portfolioCover"
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

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setCreating(false)}>
              Cancel
            </Button>
            <Button onClick={create} loading={saving} disabled={!draft.title || (!cover && !draft.coverDriveUrl.trim())}>
              Create entry
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit */}
      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing?.title ?? ''}
        size="lg"
      >
        {editing && (
          <div className="space-y-5">
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
                  <Select
                    label="Tile shape"
                    options={PORTFOLIO_SPAN_OPTIONS}
                    value={editing.span}
                    onChange={(event) => setEditing({ ...editing, span: event.target.value })}
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
                <Input
                  label="Film link (optional)"
                  placeholder="YouTube or Google Drive video link"
                  value={editing.videoUrl ?? ''}
                  onChange={(event) => setEditing({ ...editing, videoUrl: event.target.value })}
                  hint="Shown on the story page under the cover. YouTube is best for long films."
                />

                <div className="flex items-center justify-between">
                  <span className="text-base text-ink-800">Published on the website</span>
                  <Switch
                    checked={editing.isPublished}
                    onChange={(event) => setEditing({ ...editing, isPublished: event.target.checked })}
                    aria-label="Published on the website"
                  />
                </div>

                <Button
                  onClick={() =>
                    patch(editing, {
                      title: editing.title,
                      slug: editing.slug,
                      category: editing.category,
                      span: editing.span,
                      description: editing.description,
                      location: editing.location ?? '',
                      eventDate: editing.eventDate ? editing.eventDate : null,
                      videoUrl: editing.videoUrl ?? '',
                      isPublished: editing.isPublished,
                    })
                  }
                >
                  Save details
                </Button>
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
                    Keep original shape
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

                    <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-ink-300 bg-ink-50/60 py-6 text-center">
                      <Plus className="h-5 w-5 text-ink-400" aria-hidden="true" />
                      <span className="text-sm font-medium text-ink-700">
                        {saving ? 'Working…' : `Add photos to ${album.title}`}
                      </span>
                      <span className="text-xs text-ink-500">
                        {keepShape
                          ? 'Full-size camera files are fine (up to 40 MB each). Photos keep their own shape.'
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
