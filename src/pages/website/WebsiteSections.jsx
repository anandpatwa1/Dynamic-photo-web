import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Clapperboard, ExternalLink, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

import {
  Badge,
  Button,
  Card,
  CardBody,
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
import { websiteApi } from '@/api/websiteApi';
import { describeVideo } from '@/website/components/VideoEmbed';
import { SECTION_LABELS } from './sectionMeta';

const COLUMN_OPTIONS = [
  { value: '2', label: '2 videos per row' },
  { value: '3', label: '3 videos per row (recommended)' },
  { value: '4', label: '4 videos per row' },
];

// Only sections that really appear as a block on the page can anchor a new one.
const PLACEMENT_OPTIONS = Object.entries(SECTION_LABELS).map(([value, label]) => ({
  value,
  label: `After ${label}`,
}));

const KIND_LABEL = { youtube: 'YouTube', drive: 'Google Drive', other: 'Other link' };

const emptySection = { title: '', eyebrow: '', description: '', columns: 3, placeAfter: 'portfolio', showInNav: false, navLabel: '', isPublished: true, videos: [] };

/** Turns a pasted block into videos: one per line, optionally `Title | link`. */
const parsePastedLinks = (text) =>
  text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [first, ...rest] = line.split('|').map((part) => part.trim());
      return rest.length > 0 ? { title: first, url: rest.join('|').trim() } : { title: '', url: first };
    });

const VideoRow = ({ video, index, count, onChange, onMove, onRemove }) => {
  const info = describeVideo(video.url);
  const looksValid = !video.url || /^https?:\/\/\S+$/i.test(video.url);

  return (
    <div className="flex gap-3 rounded-xl border border-ink-200 bg-white p-3">
      <div className="hidden h-16 w-28 shrink-0 overflow-hidden rounded-lg bg-ink-100 sm:block">
        {info.kind === 'youtube' ? (
          <img
            src={`https://i.ytimg.com/vi/${info.id}/mqdefault.jpg`}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-ink-400">
            <Clapperboard className="h-5 w-5" aria-hidden="true" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1 space-y-2">
        <Input
          value={video.url}
          placeholder="Paste a YouTube or Google Drive video link"
          aria-label={`Video ${index + 1} link`}
          error={looksValid ? undefined : 'Paste the full link starting with https://'}
          onChange={(event) => onChange(index, { url: event.target.value })}
        />
        <div className="flex items-center gap-2">
          <Input
            value={video.title ?? ''}
            placeholder="Title shown under the video (optional)"
            aria-label={`Video ${index + 1} title`}
            wrapperClassName="flex-1"
            onChange={(event) => onChange(index, { title: event.target.value })}
          />
          {video.url && looksValid && (
            <Badge tone={info.kind === 'other' ? 'warning' : 'neutral'} size="sm">
              {KIND_LABEL[info.kind]}
            </Badge>
          )}
        </div>
      </div>

      <div className="flex shrink-0 flex-col justify-between">
        <div className="flex">
          <Button size="sm" variant="ghost" iconOnly icon={ArrowUp} aria-label="Move video up" disabled={index === 0} onClick={() => onMove(index, -1)} />
          <Button size="sm" variant="ghost" iconOnly icon={ArrowDown} aria-label="Move video down" disabled={index === count - 1} onClick={() => onMove(index, 1)} />
        </div>
        <Button size="sm" variant="ghost" iconOnly icon={Trash2} aria-label="Remove video" className="self-end text-danger-600" onClick={() => onRemove(index)} />
      </div>
    </div>
  );
};

export const WebsiteSections = () => {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const [editing, setEditing] = useState(null); // working copy
  const [original, setOriginal] = useState(null); // for "unsaved changes"
  const [pasted, setPasted] = useState('');
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const load = useCallback(async () => {
    try {
      const data = await websiteApi.sections.list();
      setSections(data.sections ?? []);
    } catch (error) {
      toast.error(error?.response?.data?.message ?? 'Could not load the sections.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const open = (section) => {
    const copy = { ...emptySection, ...section, videos: (section.videos ?? []).map((video) => ({ ...video })) };
    setEditing(copy);
    setOriginal(JSON.stringify(copy));
    setPasted('');
  };

  const dirty = useMemo(() => Boolean(editing) && JSON.stringify(editing) !== original, [editing, original]);

  const requestClose = () => {
    if (dirty) setConfirmDiscard(true);
    else setEditing(null);
  };

  const create = async () => {
    const title = newTitle.trim();
    if (!title) return;
    setSaving(true);
    try {
      const { section } = await websiteApi.sections.create({ title });
      setCreating(false);
      setNewTitle('');
      await load();
      open(section);
    } catch (error) {
      toast.error(error?.response?.data?.message ?? 'Could not create the section.');
    } finally {
      setSaving(false);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      const { section } = await websiteApi.sections.update(editing._id, {
        title: editing.title,
        eyebrow: editing.eyebrow ?? '',
        description: editing.description ?? '',
        columns: Number(editing.columns),
        placeAfter: editing.placeAfter,
        showInNav: editing.showInNav,
        navLabel: editing.navLabel ?? '',
        isPublished: editing.isPublished,
        videos: editing.videos.map(({ _id, title, url }) => ({ _id, title, url })),
      });
      toast.success('Section saved. It is live on the website.');
      setEditing(null);
      setOriginal(null);
      setSections((current) => current.map((entry) => (entry._id === section._id ? section : entry)));
    } catch (error) {
      toast.error(error?.response?.data?.message ?? 'Could not save the section.');
    } finally {
      setSaving(false);
    }
  };

  const togglePublished = async (section) => {
    try {
      const { section: next } = await websiteApi.sections.update(section._id, { isPublished: !section.isPublished });
      setSections((current) => current.map((entry) => (entry._id === next._id ? next : entry)));
    } catch (error) {
      toast.error(error?.response?.data?.message ?? 'Could not change that.');
    }
  };

  const moveSection = async (index, step) => {
    const next = [...sections];
    const target = index + step;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setSections(next);
    try {
      await websiteApi.sections.reorder(next.map((entry) => entry._id));
    } catch (error) {
      toast.error(error?.response?.data?.message ?? 'Could not save the new order.');
      load();
    }
  };

  const remove = async () => {
    const section = deleting;
    setDeleting(null);
    try {
      await websiteApi.sections.remove(section._id);
      toast.success('Section deleted.');
      await load();
    } catch (error) {
      toast.error(error?.response?.data?.message ?? 'Could not delete the section.');
    }
  };

  // ---- video list editing (all local until Save) ----
  const setField = (patch) => setEditing((current) => ({ ...current, ...patch }));
  const changeVideo = (index, patch) =>
    setField({ videos: editing.videos.map((video, i) => (i === index ? { ...video, ...patch } : video)) });
  const moveVideo = (index, step) => {
    const videos = [...editing.videos];
    const target = index + step;
    if (target < 0 || target >= videos.length) return;
    [videos[index], videos[target]] = [videos[target], videos[index]];
    setField({ videos });
  };
  const removeVideo = (index) => setField({ videos: editing.videos.filter((_, i) => i !== index) });
  const addBlank = () => setField({ videos: [...editing.videos, { title: '', url: '' }] });
  const addPasted = () => {
    const added = parsePastedLinks(pasted);
    if (added.length === 0) return;
    setField({ videos: [...editing.videos, ...added] });
    setPasted('');
    toast.success(`${added.length} video${added.length > 1 ? 's' : ''} added. Press Save to publish them.`);
  };

  if (loading) return <PageLoader label="Loading sections" />;

  return (
    <>
      <PageHeader
        title="Sections & Videos"
        description="Add your own blocks to the home page, such as Pre-wedding films, and attach as many videos as you like."
        actions={
          <Button icon={Plus} onClick={() => setCreating(true)}>
            New section
          </Button>
        }
      />

      {sections.length === 0 ? (
        <EmptyState
          icon={Clapperboard}
          title="No custom sections yet"
          description="Create one, name it (for example Pre-wedding films) and paste your video links. It appears on the home page straight away."
          action={
            <Button icon={Plus} onClick={() => setCreating(true)}>
              New section
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {sections.map((section, index) => (
            <Card key={section._id}>
              <CardBody className="flex flex-wrap items-center gap-4">
                <div className="min-w-0 flex-1 basis-56">
                  <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                    <Badge tone={section.isPublished ? 'success' : 'neutral'} size="sm">
                      {section.isPublished ? 'Live' : 'Hidden'}
                    </Badge>
                    <Badge tone="neutral" size="sm">
                      {section.videos?.length ?? 0} video{section.videos?.length === 1 ? '' : 's'}
                    </Badge>
                    {section.showInNav && (
                      <Badge tone="brand" size="sm">
                        In menu
                      </Badge>
                    )}
                  </div>
                  <h3 className="break-words text-md font-semibold text-ink-900">{section.title}</h3>
                  <p className="mt-0.5 text-sm text-ink-500">
                    {PLACEMENT_OPTIONS.find((option) => option.value === section.placeAfter)?.label ?? 'After Portfolio'} · {section.columns} per row on a laptop
                  </p>
                  {section.isPublished && (section.videos?.length ?? 0) === 0 && (
                    <p className="mt-1 text-sm text-warning-700">Add at least one video, or the section stays off the website.</p>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <Button size="sm" variant="ghost" iconOnly icon={ArrowUp} aria-label="Move section up" disabled={index === 0} onClick={() => moveSection(index, -1)} />
                  <Button size="sm" variant="ghost" iconOnly icon={ArrowDown} aria-label="Move section down" disabled={index === sections.length - 1} onClick={() => moveSection(index, 1)} />
                  <Switch checked={section.isPublished} onChange={() => togglePublished(section)} aria-label={`Show ${section.title} on the website`} />
                  <Button size="sm" variant="secondary" onClick={() => open(section)}>
                    Edit
                  </Button>
                  <Button size="sm" variant="ghost" iconOnly icon={Trash2} aria-label={`Delete ${section.title}`} className="text-danger-600" onClick={() => setDeleting(section)} />
                </div>
              </CardBody>
            </Card>
          ))}
          <p className="pt-1 text-sm text-ink-500">
            Sections that share the same spot appear in the order shown here.{' '}
            <a href="/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-brand-700 underline">
              View website <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </p>
        </div>
      )}

      {/* Create: just a name; everything else is in the editor. */}
      <Modal open={creating} onClose={() => setCreating(false)} title="New section" size="md">
        <div className="space-y-4">
          <Input
            label="Section name"
            value={newTitle}
            autoFocus
            placeholder="e.g. Pre-wedding films"
            hint="This is the heading visitors see on the home page. You can add the videos next."
            onChange={(event) => setNewTitle(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') create();
            }}
          />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setCreating(false)}>
              Cancel
            </Button>
            <Button onClick={create} loading={saving} disabled={!newTitle.trim()}>
              Create and add videos
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit */}
      <Modal
        open={Boolean(editing)}
        onClose={requestClose}
        title={editing?.title || 'Section'}
        size="xl"
        footer={
          editing && (
            <div className="flex w-full items-center justify-between gap-3">
              <span className="text-sm text-ink-500">{dirty ? 'Unsaved changes' : 'All changes saved'}</span>
              <div className="flex gap-3">
                <Button variant="secondary" onClick={requestClose}>
                  Close
                </Button>
                <Button onClick={save} loading={saving} disabled={!dirty || !editing.title.trim()}>
                  Save and publish
                </Button>
              </div>
            </div>
          )
        }
      >
        {editing && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Section name" value={editing.title} onChange={(event) => setField({ title: event.target.value })} hint="The heading on the home page." />
              <Input label="Small text above the name (optional)" value={editing.eyebrow ?? ''} placeholder="e.g. Cinematic" onChange={(event) => setField({ eyebrow: event.target.value })} />
            </div>
            <Textarea label="Short description (optional)" rows={2} value={editing.description ?? ''} onChange={(event) => setField({ description: event.target.value })} />

            <div className="grid gap-4 sm:grid-cols-2">
              <Select label="Where on the home page" options={PLACEMENT_OPTIONS} value={editing.placeAfter} onChange={(event) => setField({ placeAfter: event.target.value })} />
              <Select label="Layout on a laptop" options={COLUMN_OPTIONS} value={String(editing.columns)} onChange={(event) => setField({ columns: Number(event.target.value) })} hint="Phones always show one video per row, tablets two." />
            </div>

            <div className="grid gap-4 rounded-xl border border-ink-200 p-4 sm:grid-cols-2">
              <div className="flex items-center justify-between gap-4">
                <span className="text-base text-ink-800">Show on the website</span>
                <Switch checked={editing.isPublished} onChange={(event) => setField({ isPublished: event.target.checked })} aria-label="Show this section on the website" />
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-base text-ink-800">Add a link in the menu</span>
                <Switch checked={editing.showInNav} onChange={(event) => setField({ showInNav: event.target.checked })} aria-label="Add this section to the menu" />
              </div>
              {editing.showInNav && (
                <Input wrapperClassName="sm:col-span-2" label="Menu wording" value={editing.navLabel ?? ''} placeholder={editing.title || 'Pre-wedding'} hint="Keep it short; it sits in the header." onChange={(event) => setField({ navLabel: event.target.value })} />
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h4 className="text-md font-semibold text-ink-900">Videos ({editing.videos.length})</h4>
                <Button size="sm" icon={Plus} variant="secondary" onClick={addBlank}>
                  Add one video
                </Button>
              </div>

              <div className="space-y-2 rounded-xl bg-ink-50 p-3">
                <Textarea
                  label="Have many links? Paste them all here"
                  rows={3}
                  value={pasted}
                  placeholder={'One link per line. To add a title, write it first:\nRiya & Arjun | https://youtu.be/xxxxxxxxxxx\nhttps://drive.google.com/file/d/…/view'}
                  onChange={(event) => setPasted(event.target.value)}
                />
                <Button size="sm" onClick={addPasted} disabled={!pasted.trim()}>
                  Add these links
                </Button>
              </div>

              {editing.videos.length === 0 ? (
                <p className="rounded-xl border border-dashed border-ink-300 p-6 text-center text-sm text-ink-500">
                  No videos yet. Paste links above or add one.
                </p>
              ) : (
                <div className="space-y-2">
                  {editing.videos.map((video, index) => (
                    <VideoRow key={video._id ?? `new-${index}`} video={video} index={index} count={editing.videos.length} onChange={changeVideo} onMove={moveVideo} onRemove={removeVideo} />
                  ))}
                </div>
              )}
              <p className="text-sm text-ink-500">
                YouTube is best for long films. Google Drive videos also work, but Drive can limit playback when many people watch.
              </p>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={confirmDiscard}
        onClose={() => setConfirmDiscard(false)}
        onConfirm={() => {
          setConfirmDiscard(false);
          setEditing(null);
        }}
        title="Discard your changes?"
        message="You have changes that are not saved yet. Closing now will lose them."
        confirmLabel="Discard"
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={remove}
        title="Delete this section?"
        message={deleting ? `“${deleting.title}” and its ${deleting.videos?.length ?? 0} video links will be removed from the website. The videos themselves stay on YouTube or Drive.` : ''}
        confirmLabel="Delete section"
      />
    </>
  );
};

export default WebsiteSections;
