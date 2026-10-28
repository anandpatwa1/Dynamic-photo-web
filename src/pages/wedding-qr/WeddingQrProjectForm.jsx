import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Clock,
  ExternalLink,
  Instagram,
  Layers,
  Plus,
  QrCode,
  RotateCcw,
  Trash2,
  Video,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  Badge,
  Button,
  Card,
  Input,
  PageHeader,
  PageLoader,
  Switch,
  Textarea,
} from '@/components/ui';
import { CRM } from '@/routes/paths';
import { weddingQrApi } from '@/api/weddingQrApi';

const slugify = (value) =>
  String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);

export const WeddingQrProjectForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [originalSlug, setOriginalSlug] = useState('');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [galleryStatus, setGalleryStatus] = useState('preparing');
  const [eventCycle, setEventCycle] = useState(1);

  const [instagramProfileUrl, setInstagramProfileUrl] = useState('');
  const [followButtonText, setFollowButtonText] = useState('Follow on Instagram');

  const [guideVideoUrl, setGuideVideoUrl] = useState('');

  const [galleries, setGalleries] = useState([
    { title: 'Wedding Photos', externalUrl: '', description: '', sortOrder: 0 },
  ]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    weddingQrApi
      .get(id)
      .then((res) => {
        const p = res.data?.project || res.project;
        if (p) {
          setName(p.name || '');
          setSlug(p.slug || '');
          setOriginalSlug(p.slug || '');
          setSlugManuallyEdited(true);
          setDescription(p.description || '');
          setIsActive(p.isActive !== false);
          setGalleryStatus(p.galleryStatus || 'preparing');
          setEventCycle(p.eventCycle || 1);
          setInstagramProfileUrl(p.instagramProfileUrl || '');
          setFollowButtonText(p.followButtonText || 'Follow on Instagram');
          setGuideVideoUrl(p.guideVideoUrl || '');
          setGalleries(
            Array.isArray(p.galleries) && p.galleries.length > 0
              ? p.galleries.map((g, idx) => ({
                  _id: g._id,
                  title: g.title || '',
                  externalUrl: g.externalUrl || '',
                  description: g.description || '',
                  sortOrder: g.sortOrder ?? idx,
                }))
              : [{ title: 'Wedding Photos', externalUrl: '', description: '', sortOrder: 0 }]
          );
        }
      })
      .catch((err) => {
        toast.error(err?.response?.data?.message || 'Could not load project');
        navigate(CRM.weddingQr);
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleNameChange = (val) => {
    setName(val);
    if (!isEdit && !slugManuallyEdited) {
      setSlug(slugify(val));
    }
  };

  const handleSlugChange = (val) => {
    setSlug(slugify(val));
    setSlugManuallyEdited(true);
  };

  // Gallery Management
  const addGallery = () => {
    setGalleries((prev) => [
      ...prev,
      {
        title: '',
        externalUrl: '',
        description: '',
        sortOrder: prev.length,
      },
    ]);
  };

  const updateGallery = (index, field, value) => {
    setGalleries((prev) =>
      prev.map((g, i) => (i === index ? { ...g, [field]: value } : g))
    );
  };

  const removeGallery = (index) => {
    if (galleries.length === 1) {
      toast.error('At least one gallery configuration is required');
      return;
    }
    setGalleries((prev) => prev.filter((_, i) => i !== index));
  };

  const moveGallery = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= galleries.length) return;
    setGalleries((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy.map((g, i) => ({ ...g, sortOrder: i }));
    });
  };

  const handleStartNewCycle = async () => {
    const confirmCycle = window.confirm(
      `Start a new event cycle for "${name}"?\n\nThis will increment the event cycle to #${eventCycle + 1} and set the gallery status back to "Preparing". All guest registrations collected during the previous wedding will be safely preserved in history.`
    );
    if (!confirmCycle) return;
    try {
      const res = await weddingQrApi.startNewEventCycle(id);
      toast.success(res?.message || 'Started new event cycle!');
      setEventCycle((prev) => prev + 1);
      setGalleryStatus('preparing');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to start new cycle');
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault?.();

    if (!name.trim()) {
      toast.error('Project name is required');
      return;
    }

    const cleanSlug = slugify(slug || name);
    if (!cleanSlug) {
      toast.error('A valid URL-safe slug is required');
      return;
    }

    if (!instagramProfileUrl.trim()) {
      toast.error('Instagram profile URL is required');
      return;
    }

    if (!/^https?:\/\/\S+/i.test(instagramProfileUrl.trim())) {
      toast.error('Instagram URL must start with http:// or https://');
      return;
    }

    if (galleryStatus === 'ready' && !galleries.length) {
      toast.error('Please configure at least one external gallery before marking photos ready');
      return;
    }

    // Validate galleries
    for (let i = 0; i < galleries.length; i += 1) {
      const g = galleries[i];
      if (!g.title.trim()) {
        toast.error(`Gallery #${i + 1} requires a title (e.g. Wedding Photos, Haldi)`);
        return;
      }
      if (!g.externalUrl.trim()) {
        toast.error(`Gallery #${i + 1} requires an external URL`);
        return;
      }
      if (!/^https?:\/\/\S+/i.test(g.externalUrl.trim())) {
        toast.error(`Gallery #${i + 1} URL must start with http:// or https://`);
        return;
      }
    }

    const payload = {
      name: name.trim(),
      slug: cleanSlug,
      description: description.trim(),
      isActive,
      galleryStatus,
      instagramProfileUrl: instagramProfileUrl.trim(),
      followButtonText: followButtonText.trim() || 'Follow on Instagram',
      guideVideoUrl: guideVideoUrl.trim(),
      galleries: galleries.map((g, idx) => ({
        _id: g._id,
        title: g.title.trim(),
        externalUrl: g.externalUrl.trim(),
        description: (g.description || '').trim(),
        sortOrder: idx,
      })),
    };

    setSaving(true);
    try {
      if (isEdit) {
        await weddingQrApi.update(id, payload);
        toast.success('Wedding QR project updated successfully!');
      } else {
        await weddingQrApi.create(payload);
        toast.success('Wedding QR project created successfully!');
      }
      navigate(CRM.weddingQr);
    } catch (err) {
      console.error('Save failed:', err);
      toast.error(err?.response?.data?.message || 'Could not save project');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <PageLoader label="Loading wedding QR project..." />
      </div>
    );
  }

  const isSlugChanged = isEdit && originalSlug && slug !== originalSlug;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl pb-16">
      <PageHeader
        title={isEdit ? `Edit: ${name || 'Wedding QR'}` : 'New Wedding QR Project'}
        description="Configure your Instagram gate, follow instructions, and external photo gallery links."
        backTo={CRM.weddingQr}
        actions={
          <div className="flex items-center gap-2">
            <Button
              as={Link}
              to={CRM.weddingQr}
              variant="secondary"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="brand"
              loading={saving}
            >
              {isEdit ? 'Save Changes' : 'Create Project'}
            </Button>
          </div>
        }
      />

      {/* 1. Basic Information */}
      <Card className="p-5 space-y-4">
        <h3 className="text-base font-semibold text-ink-900 border-b border-ink-100 pb-2">
          1. Basic Information
        </h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Project / Event Name"
            required
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="e.g. Akash & Sneha Wedding, or Common QR"
          />

          <div>
            <Input
              label="URL Slug (defines the QR destination)"
              required
              value={slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              placeholder="e.g. akash-wedding-photos or wedding-photos"
            />
            <p className="text-2xs text-ink-500 mt-1">
              Public link: <code className="bg-ink-100 px-1 py-0.5 rounded text-ink-800">/photos/{slug || 'your-slug'}</code>
            </p>
          </div>
        </div>

        {isSlugChanged && (
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
            <div>
              <strong>Warning: Changing an existing slug!</strong>
              <p className="mt-0.5 text-amber-800">
                If you have already printed or displayed the QR code for <code>/photos/{originalSlug}</code> at a venue, changing this slug will break existing printed signs unless reprinted.
              </p>
            </div>
          </div>
        )}

        <Textarea
          label="Optional Subtitle / Event Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder="e.g. Congratulations to the couple! Follow us to view memories from the ceremony."
        />

        <div className="flex items-center justify-between pt-2 border-t border-ink-100">
          <div>
            <p className="text-sm font-medium text-ink-900">Project Status</p>
            <p className="text-xs text-ink-500">
              When inactive, guests scanning the QR code will see a clean unavailable message.
            </p>
          </div>
          <Switch
            checked={isActive}
            onChange={setIsActive}
            aria-label="Toggle active status"
          />
        </div>
      </Card>

      {/* 2. Instagram Configuration */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2 border-b border-ink-100 pb-2">
          <Instagram className="w-5 h-5 text-pink-600" />
          <h3 className="text-base font-semibold text-ink-900">
            2. Instagram Follow Configuration
          </h3>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Instagram Profile URL"
            required
            value={instagramProfileUrl}
            onChange={(e) => setInstagramProfileUrl(e.target.value)}
            placeholder="https://instagram.com/dynamic.photography"
          />

          <Input
            label="Follow Button Text"
            value={followButtonText}
            onChange={(e) => setFollowButtonText(e.target.value)}
            placeholder="Follow on Instagram"
          />
        </div>

        <p className="text-2xs text-ink-400">
          Guests scanning the QR code will be prompted to follow this Instagram account before proceeding to view their photos.
        </p>
      </Card>

      {/* 3. Follow-Guide Video (Optional) */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2 border-b border-ink-100 pb-2">
          <Video className="w-5 h-5 text-indigo-600" />
          <h3 className="text-base font-semibold text-ink-900">
            3. Follow-Guide Video (Optional)
          </h3>
        </div>

        <Input
          label="Guide Video URL (YouTube, Vimeo, or MP4 link)"
          value={guideVideoUrl}
          onChange={(e) => setGuideVideoUrl(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=... or https://vimeo.com/..."
        />
        <p className="text-2xs text-ink-400">
          Display a short video showing guests how to follow your account or a reel teaser. Leave empty if no video is needed.
        </p>
      </Card>

      {/* 4. Photos Readiness & Event Cycle */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-ink-100 pb-2">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-600" />
            <h3 className="text-base font-semibold text-ink-900">
              4. Photos Readiness & Event Cycle
            </h3>
          </div>
          {isEdit && (
            <Badge tone="brand" size="xs">
              Event Cycle #{eventCycle}
            </Badge>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setGalleryStatus('preparing')}
            className={`p-4 rounded-xl border text-left transition space-y-1.5 ${
              galleryStatus === 'preparing'
                ? 'border-amber-500 bg-amber-50/70 ring-2 ring-amber-500/20'
                : 'border-ink-200 hover:border-ink-300 bg-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-ink-900">Photos Being Prepared</span>
              {galleryStatus === 'preparing' && <Badge tone="warning" size="xs">Selected</Badge>}
            </div>
            <p className="text-2xs text-ink-500 leading-relaxed">
              Photos are still in editing. The public page shows <em>&quot;Your wedding memories are being prepared&quot;</em> and collects guest contact details for notifications.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setGalleryStatus('ready')}
            className={`p-4 rounded-xl border text-left transition space-y-1.5 ${
              galleryStatus === 'ready'
                ? 'border-emerald-500 bg-emerald-50/70 ring-2 ring-emerald-500/20'
                : 'border-ink-200 hover:border-ink-300 bg-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-ink-900">Photos Are Ready</span>
              {galleryStatus === 'ready' && <Badge tone="success" size="xs">Selected</Badge>}
            </div>
            <p className="text-2xs text-ink-500 leading-relaxed">
              Photos are uploaded and ready. The public page unlocks your configured gallery links and enables sending notifications to registered guests.
            </p>
          </button>
        </div>

        {isEdit && (
          <div className="pt-3 border-t border-ink-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <p className="text-2xs text-ink-500 leading-relaxed max-w-lg">
              Reusing this common QR project for another wedding? Starting a new event cycle isolates historical registrations from previous weddings.
            </p>
            <Button
              type="button"
              size="xs"
              variant="secondary"
              icon={RotateCcw}
              onClick={handleStartNewCycle}
            >
              Start New Event Cycle
            </Button>
          </div>
        )}
      </Card>

      {/* 5. External Gallery Links */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-ink-100 pb-2">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-brand-600" />
            <h3 className="text-base font-semibold text-ink-900">
              5. External Photo Gallery Links
            </h3>
          </div>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            icon={Plus}
            onClick={addGallery}
          >
            Add Another Gallery
          </Button>
        </div>

        <p className="text-xs text-ink-500">
          Enter external gallery links (e.g. from Albm, Google Drive, Pixieset, or your cloud galleries). If you have separate albums for Wedding, Haldi, and Mehndi, add them here.
        </p>

        <div className="space-y-3 pt-1">
          {galleries.map((gallery, index) => (
            <div
              key={index}
              className="p-4 rounded-xl border border-ink-200 bg-ink-50/50 space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-ink-600">
                  Gallery #{index + 1}
                </span>

                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    size="xs"
                    variant="ghost"
                    iconOnly
                    icon={ArrowUp}
                    disabled={index === 0}
                    onClick={() => moveGallery(index, -1)}
                    title="Move Up"
                  />
                  <Button
                    type="button"
                    size="xs"
                    variant="ghost"
                    iconOnly
                    icon={ArrowDown}
                    disabled={index === galleries.length - 1}
                    onClick={() => moveGallery(index, 1)}
                    title="Move Down"
                  />
                  <Button
                    type="button"
                    size="xs"
                    variant="ghost"
                    iconOnly
                    icon={Trash2}
                    className="text-red-600 hover:bg-red-50"
                    disabled={galleries.length === 1}
                    onClick={() => removeGallery(index)}
                    title="Remove Gallery"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  label="Gallery Title"
                  required
                  value={gallery.title}
                  onChange={(e) => updateGallery(index, 'title', e.target.value)}
                  placeholder="e.g. Wedding Photos, Haldi Ceremony, Reception"
                />

                <Input
                  label="External Gallery URL"
                  required
                  value={gallery.externalUrl}
                  onChange={(e) => updateGallery(index, 'externalUrl', e.target.value)}
                  placeholder="https://albm.in/dynamic-photography/akash-wedding"
                />
              </div>

              <Input
                label="Optional Short Note / Subtitle"
                value={gallery.description}
                onChange={(e) => updateGallery(index, 'description', e.target.value)}
                placeholder="e.g. High-res candid moments and couple portraits"
              />
            </div>
          ))}
        </div>
      </Card>

      {/* Form Submission Footer */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-ink-200">
        <Button
          as={Link}
          to={CRM.weddingQr}
          variant="secondary"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="brand"
          loading={saving}
        >
          {isEdit ? 'Save Changes' : 'Create & Generate QR'}
        </Button>
      </div>
    </form>
  );
};

export default WeddingQrProjectForm;

