import { useCallback, useEffect, useState } from 'react';
import { MessageSquareQuote, Plus, Star, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

import {
  Badge,
  Button,
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
import { SectionHeadingCard } from './SectionHeadingCard';

const RATINGS = [5, 4, 3, 2, 1].map((value) => ({
  value: String(value),
  label: `${value} star${value > 1 ? 's' : ''}`,
}));

const emptyDraft = { name: '', role: '', quote: '', rating: '5', isPublished: true };

export const WebsiteTestimonials = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [avatar, setAvatar] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { testimonials: rows } = await websiteApi.testimonials.list();
      setTestimonials(rows);
    } catch (error) {
      toast.error(error?.response?.data?.message ?? 'Could not load testimonials.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    setSaving(true);
    try {
      const payload = { ...editing, file: avatar?.file, alt: avatar?.alt };
      if (editing._id) await websiteApi.testimonials.update(editing._id, payload);
      else await websiteApi.testimonials.create(payload);

      toast.success(editing._id ? 'Testimonial updated.' : 'Testimonial added.');
      setEditing(null);
      setAvatar(null);
      await load();
    } catch (error) {
      toast.error(error?.response?.data?.message ?? 'That testimonial could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    const target = deleting;
    setDeleting(null);
    try {
      await websiteApi.testimonials.remove(target._id);
      toast.success('Testimonial deleted.');
      await load();
    } catch (error) {
      toast.error(error?.response?.data?.message ?? 'That testimonial could not be deleted.');
    }
  };

  if (loading && testimonials.length === 0) return <PageLoader label="Loading testimonials" />;

  return (
    <>
      <PageHeader
        title="Testimonials"
        description="What your couples say. Drag to set the order they appear in."
        actions={
          <Button icon={Plus} onClick={() => setEditing({ ...emptyDraft })}>
            Add testimonial
          </Button>
        }
      />

      <SectionHeadingCard sectionKey="testimonialsSection" label="Section heading" />

      {testimonials.length === 0 ? (
        <EmptyState
          icon={MessageSquareQuote}
          title="No testimonials yet"
          description="Add a review to show it on the website."
          action={
            <Button icon={Plus} onClick={() => setEditing({ ...emptyDraft })}>
              Add testimonial
            </Button>
          }
        />
      ) : (
        <SortableGrid
          items={testimonials}
          getKey={(item) => item._id}
          onReorder={(order) => websiteApi.testimonials.reorder(order)}
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
          itemClassName="bg-white shadow-card p-5"
          renderItem={(item) => (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <span className="flex gap-0.5" aria-label={`Rated ${item.rating} out of 5`}>
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star
                      key={i}
                      aria-hidden="true"
                      className={
                        i < item.rating
                          ? 'h-3.5 w-3.5 fill-brand-500 text-brand-500'
                          : 'h-3.5 w-3.5 text-ink-300'
                      }
                    />
                  ))}
                </span>
                <Badge tone={item.isPublished ? 'success' : 'neutral'} size="sm">
                  {item.isPublished ? 'Live' : 'Hidden'}
                </Badge>
              </div>

              <p className="line-clamp-4 text-pretty text-sm leading-relaxed text-ink-700">
                “{item.quote}”
              </p>

              <div className="mt-4 flex items-center gap-3 border-t border-ink-200/70 pt-4">
                {item.avatar?.url && (
                  <img
                    src={item.avatar.thumbnail || item.avatar.url}
                    alt=""
                    className="h-9 w-9 rounded-full object-cover"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink-900">{item.name}</p>
                  {item.role && <p className="truncate text-xs text-ink-500">{item.role}</p>}
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => setEditing(item)}>
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  icon={Trash2}
                  aria-label={`Delete the testimonial from ${item.name}`}
                  onClick={() => setDeleting(item)}
                  className="text-ink-400 hover:text-danger-600"
                />
              </div>
            </div>
          )}
        />
      )}

      <Modal
        open={Boolean(editing)}
        onClose={() => {
          setEditing(null);
          setAvatar(null);
        }}
        title={editing?._id ? 'Edit testimonial' : 'Add testimonial'}
      >
        {editing && (
          <div className="space-y-4">
            <Input
              label="Client name"
              value={editing.name}
              onChange={(event) => setEditing({ ...editing, name: event.target.value })}
            />
            <Input
              label="Occasion & place"
              placeholder="Wedding, Indore"
              value={editing.role ?? ''}
              onChange={(event) => setEditing({ ...editing, role: event.target.value })}
            />
            <Textarea
              label="Review"
              rows={4}
              maxLength={600}
              hint={`${(editing.quote ?? '').length}/600`}
              value={editing.quote}
              onChange={(event) => setEditing({ ...editing, quote: event.target.value })}
            />
            <Select
              label="Rating"
              options={RATINGS}
              value={String(editing.rating ?? 5)}
              onChange={(event) => setEditing({ ...editing, rating: Number(event.target.value) })}
            />

            <SlotImageUpload
              slot="square"
              label="Portrait (optional)"
              value={avatar ? { url: avatar.preview, alt: avatar.alt } : editing.avatar}
              onUpload={async ({ file, alt }) =>
                setAvatar({ file, alt, preview: URL.createObjectURL(file) })
              }
              onRemove={() => setAvatar(null)}
            />

            <div className="flex items-center justify-between">
              <span className="text-base text-ink-800">Show on the website</span>
              <Switch
                checked={editing.isPublished}
                onChange={(event) => setEditing({ ...editing, isPublished: event.target.checked })}
                aria-label="Show on the website"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button onClick={save} loading={saving} disabled={!editing.name || !editing.quote}>
                {editing._id ? 'Save changes' : 'Add testimonial'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={remove}
        title="Delete this testimonial?"
        message={deleting ? `The review from ${deleting.name} will be removed.` : ''}
        confirmLabel="Delete"
      />
    </>
  );
};

export default WebsiteTestimonials;
