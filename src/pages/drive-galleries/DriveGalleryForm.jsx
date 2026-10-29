import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  HardDrive,
  HelpCircle,
  Image as ImageIcon,
  Palette,
  RefreshCw,
  Save,
  Search,
  ShieldAlert,
  Sparkles,
  Sliders,
  SlidersHorizontal,
  FolderCheck,
  AlertCircle,
  Copy,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  Badge,
  Button,
  Card,
  Input,
  PageHeader,
  Select,
  Switch,
  Textarea,
} from '@/components/ui';
import { CRM } from '@/routes/paths';
import { driveGalleryApi, PUBLIC_API_BASE } from '@/api/driveGalleryApi';

const ACCENT_PRESETS = [
  { name: 'Champagne Gold', value: '#D4AF37' },
  { name: 'Royal Gold', value: '#F59E0B' },
  { name: 'Instagram Rose', value: '#E1306C' },
  { name: 'Emerald Velvet', value: '#10B981' },
  { name: 'Sapphire Blue', value: '#3B82F6' },
  { name: 'Amethyst Purple', value: '#8B5CF6' },
  { name: 'Pure Platinum', value: '#E2E8F0' },
];

/**
 * Isolated thumbnail card for admin cover selection.
 * Handles fallbacks cleanly without causing re-render loops.
 */
const AdminThumbnailCard = ({ photo, idx, isCover, onSelectCover }) => {
  const [retryStage, setRetryStage] = useState(0);

  const thumbSrc = useMemo(() => {
    if (!photo?.fileId) return '';
    if (retryStage === 0) return `https://lh3.googleusercontent.com/d/${photo.fileId}=w300`;
    if (retryStage === 1) return `https://drive.google.com/thumbnail?id=${photo.fileId}&sz=w300`;
    if (retryStage === 2) return `${PUBLIC_API_BASE}/public/drive-galleries/image/${photo.fileId}?sz=w300`;
    return '';
  }, [photo?.fileId, retryStage]);

  return (
    <div
      onClick={() => onSelectCover(photo)}
      title={`${photo.name || 'Photo'} • Click to set as cover`}
      className={`group relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all bg-white shadow-2xs hover:shadow-md ${
        isCover ? 'border-brand-600 ring-2 ring-brand-400 scale-[1.03] z-10' : 'border-ink-200 hover:border-brand-400'
      }`}
    >
      {retryStage < 3 ? (
        <img
          src={thumbSrc}
          alt={photo.name || 'Photo'}
          loading="lazy"
          decoding="async"
          onError={() => setRetryStage((prev) => prev + 1)}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center p-1 bg-ink-100 text-ink-400">
          <ImageIcon className="w-4 h-4 opacity-50" />
          <span className="text-4xs truncate max-w-full px-1">{photo.name || 'Photo'}</span>
        </div>
      )}

      {/* Photo Index Tag */}
      <span className="absolute bottom-0.5 right-0.5 text-4xs font-mono bg-black/70 text-white px-1 py-0.2 rounded-xs pointer-events-none">
        #{idx + 1}
      </span>

      {/* Active Cover Overlay */}
      {isCover && (
        <div className="absolute inset-0 bg-brand-600/35 flex flex-col items-center justify-center p-1">
          <span className="bg-brand-600 text-white text-4xs font-bold uppercase px-1.5 py-0.5 rounded shadow">
            Cover
          </span>
        </div>
      )}

      {/* Hover Name Overlay */}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-1 text-center pointer-events-none">
        <span className="text-4xs text-white line-clamp-2 font-mono leading-tight">
          {photo.name}
        </span>
      </div>
    </div>
  );
};

export const DriveGalleryForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [validatingFolder, setValidatingFolder] = useState(false);
  const [activeTab, setActiveTab] = useState('basic'); // basic, drive, branding, appearance, behavior

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    clientNames: '',
    eventDate: '',
    photographerName: 'Dynamic Photography',
    driveFolderUrl: '',
    publicationStatus: 'draft',
    coverImage: { fileId: '', thumbnailUrl: '', viewUrl: '' },
    branding: {
      enabled: true,
      studioName: 'Dynamic Photography',
      studioLogoUrl: '',
      introMessage: '',
      footerText: 'Crafted with passion by Dynamic Photography',
    },
    themeSettings: {
      theme: 'dark',
      accentColor: '#D4AF37',
      layout: 'masonry',
      gridDensity: 'normal',
      imageRadius: 'md',
      headerStyle: 'hero',
      showTitleOverlay: true,
    },
    gallerySettings: {
      showPhotoCount: true,
      showFilenames: false,
      allowDownloads: true,
      enableLightbox: true,
      enableSlideshow: true,
      sortOrder: 'name_asc',
    },
  });

  // Cached / validated photos preview
  const [previewPhotos, setPreviewPhotos] = useState([]);
  const [previewSearch, setPreviewSearch] = useState('');
  const [totalPhotosCount, setTotalPhotosCount] = useState(0);
  const [folderValidation, setFolderValidation] = useState(null);
  const [slugStatus, setSlugStatus] = useState({ checking: false, available: true, message: '' });

  // Filter preview photos by search query
  const filteredPreviewPhotos = useMemo(() => {
    if (!previewSearch.trim()) return previewPhotos;
    const q = previewSearch.toLowerCase();
    return previewPhotos.filter((p) => (p.name || '').toLowerCase().includes(q));
  }, [previewPhotos, previewSearch]);

  // Auto-slugify title if creating new
  const handleTitleChange = (val) => {
    setFormData((prev) => {
      const update = { ...prev, title: val };
      if (!isEditing && (!prev.slug || prev.slug === slugify(prev.title))) {
        update.slug = slugify(val);
      }
      return update;
    });
  };

  const slugify = (text = '') =>
    String(text || '')
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

  // Check slug availability on blur
  const handleSlugBlur = async () => {
    const raw = formData.slug || formData.title;
    if (!raw) return;
    try {
      setSlugStatus({ checking: true, available: true, message: '' });
      const res = await driveGalleryApi.checkSlug(raw, id || null);
      setSlugStatus({
        checking: false,
        available: res.data?.available ?? true,
        message: res.data?.reason || '',
      });
      if (res.data?.normalized) {
        setFormData((prev) => ({ ...prev, slug: res.data.normalized }));
      }
    } catch {
      setSlugStatus({ checking: false, available: true, message: '' });
    }
  };

  // Load existing gallery if editing
  useEffect(() => {
    if (!isEditing) return;
    const fetchGallery = async () => {
      try {
        setLoading(true);
        const data = await driveGalleryApi.getGallery(id);
        setFormData({
          title: data.title || '',
          slug: data.slug || '',
          description: data.description || '',
          clientNames: data.clientNames || '',
          eventDate: data.eventDate ? data.eventDate.slice(0, 10) : '',
          photographerName: data.photographerName || 'Dynamic Photography',
          driveFolderUrl: data.driveFolderUrl || '',
          publicationStatus: data.publicationStatus || 'draft',
          coverImage: data.coverImage || {},
          branding: { ...formData.branding, ...(data.branding || {}) },
          themeSettings: { ...formData.themeSettings, ...(data.themeSettings || {}) },
          gallerySettings: { ...formData.gallerySettings, ...(data.gallerySettings || {}) },
        });
        const loadedPhotos = data.cachedPhotos || [];
        setPreviewPhotos(loadedPhotos);
        setTotalPhotosCount(data.totalPhotos || loadedPhotos.length || 0);
        setFolderValidation({
          valid: true,
          photoCount: data.totalPhotos || loadedPhotos.length || 0,
          samplePhotos: loadedPhotos,
          message: `Connected: ${data.totalPhotos || loadedPhotos.length} photos in gallery cache.`,
        });
      } catch (err) {
        toast.error('Failed to load gallery data');
        navigate(CRM.driveGalleries);
      } finally {
        setLoading(false);
      }
    };
    fetchGallery();
  }, [id, isEditing, navigate]);

  // Validate Google Drive folder
  const handleValidateFolder = async () => {
    if (!formData.driveFolderUrl) {
      toast.error('Please enter a Google Drive folder URL');
      return;
    }
    try {
      setValidatingFolder(true);
      const res = await driveGalleryApi.validateFolder(formData.driveFolderUrl);
      setFolderValidation(res.data);
      if (res.data?.samplePhotos?.length > 0) {
        setPreviewPhotos(res.data.samplePhotos);
        setTotalPhotosCount(res.data.photoCount || res.data.samplePhotos.length);
        if (!formData.coverImage?.thumbnailUrl && res.data.firstPhoto) {
          setFormData((prev) => ({
            ...prev,
            coverImage: {
              fileId: res.data.firstPhoto.fileId,
              thumbnailUrl:
                res.data.firstPhoto.thumbnailUrl ||
                `https://lh3.googleusercontent.com/d/${res.data.firstPhoto.fileId}=w1000`,
              viewUrl:
                res.data.firstPhoto.viewUrl ||
                `https://lh3.googleusercontent.com/d/${res.data.firstPhoto.fileId}=w2500`,
            },
          }));
        }
      }
      toast.success(res.message || 'Google Drive folder connected!');
    } catch (err) {
      setFolderValidation({
        valid: false,
        error: err?.response?.data?.message || 'Could not connect to Google Drive folder',
      });
      toast.error(err?.response?.data?.message || 'Failed to validate folder');
    } finally {
      setValidatingFolder(false);
    }
  };

  // Sync latest photos directly from Google Drive
  const handleSyncFromDrive = async () => {
    if (!id) {
      return handleValidateFolder();
    }
    try {
      setValidatingFolder(true);
      const res = await driveGalleryApi.syncGallery(id);
      const full = await driveGalleryApi.getGallery(id);
      const loaded = full.cachedPhotos || [];
      setPreviewPhotos(loaded);
      setTotalPhotosCount(loaded.length);
      setFolderValidation({
        valid: true,
        photoCount: loaded.length,
        samplePhotos: loaded,
        message: `Synced successfully! Found ${loaded.length} photos.`,
      });
      toast.success(res.message || `Successfully synced ${loaded.length} photos from Google Drive!`);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to sync folder from Google Drive');
    } finally {
      setValidatingFolder(false);
    }
  };

  const handleSelectCover = (photo) => {
    setFormData((prev) => ({
      ...prev,
      coverImage: {
        fileId: photo.fileId,
        thumbnailUrl:
          photo.thumbnailUrl || (photo.fileId ? `https://lh3.googleusercontent.com/d/${photo.fileId}=w1000` : ''),
        viewUrl: photo.viewUrl || (photo.fileId ? `https://lh3.googleusercontent.com/d/${photo.fileId}=w2500` : ''),
      },
    }));
    toast.success(`Selected "${photo.name || 'Photo'}" as gallery cover image`);
  };

  // Submit Handler
  const handleSubmit = async (targetStatus = null) => {
    if (!formData.title.trim()) {
      toast.error('Gallery title is required');
      setActiveTab('basic');
      return;
    }
    if (!formData.driveFolderUrl.trim()) {
      toast.error('Google Drive folder URL is required');
      setActiveTab('drive');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        ...formData,
        slug: slugify(formData.slug || formData.title),
        publicationStatus: targetStatus || formData.publicationStatus,
      };

      if (isEditing) {
        await driveGalleryApi.updateGallery(id, payload);
        toast.success('Gallery updated successfully');
      } else {
        const created = await driveGalleryApi.createGallery(payload);
        toast.success('Gallery created successfully');
        navigate(CRM.driveGalleries);
        return;
      }
      navigate(CRM.driveGalleries);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save gallery');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-brand-600 animate-spin" />
      </div>
    );
  }

  const publicUrl = `${window.location.origin}/gallery/${formData.slug || slugify(formData.title) || 'your-slug'}`;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Page Header */}
      <PageHeader
        title={isEditing ? `Edit: ${formData.title}` : 'Create Google Drive Gallery'}
        description="Configure your client wedding gallery. All photos remain hosted on Google Drive."
        actions={
          <div className="flex items-center gap-2">
            <Button
              as={Link}
              to={CRM.driveGalleries}
              variant="outline"
              size="sm"
              icon={ArrowLeft}
            >
              Back to List
            </Button>
            {isEditing && formData.publicationStatus === 'published' && (
              <Button
                as="a"
                href={`/gallery/${formData.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                variant="secondary"
                size="sm"
                icon={ExternalLink}
              >
                Open Public Gallery
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSubmit('draft')}
              disabled={saving}
            >
              Save as Draft
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={Save}
              onClick={() => handleSubmit('published')}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save & Publish'}
            </Button>
          </div>
        }
      />

      {/* Public URL Live Indicator */}
      <div className="p-3.5 rounded-xl bg-ink-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-sm">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="text-3xs uppercase font-bold text-brand-300">Public Gallery URL:</span>
            {formData.publicationStatus === 'published' ? (
              <span className="inline-flex items-center gap-1 text-3xs text-emerald-400 font-semibold">
                <CheckCircle2 className="w-3 h-3" /> Live & Accessible
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-3xs text-amber-400 font-semibold">
                <Clock className="w-3 h-3" /> Draft (Hidden from Public)
              </span>
            )}
          </div>
          <span className="font-mono text-ink-300 text-2xs truncate block">{publicUrl}</span>
        </div>
        <Button
          variant="secondary"
          size="xs"
          icon={Copy}
          onClick={() => {
            navigator.clipboard.writeText(publicUrl);
            toast.success('Public URL copied!');
          }}
        >
          Copy Link
        </Button>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-ink-200 overflow-x-auto gap-2">
        {[
          { id: 'basic', label: '1. Basic Info' },
          { id: 'drive', label: '2. Google Drive Folder' },
          { id: 'branding', label: '3. Client Branding' },
          { id: 'appearance', label: '4. Theme & Layout' },
          { id: 'behavior', label: '5. Gallery Behavior' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`py-2.5 px-4 text-xs font-semibold whitespace-nowrap border-b-2 transition-all ${
              activeTab === tab.id
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-ink-500 hover:text-ink-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Basic Information */}
      {activeTab === 'basic' && (
        <Card className="p-6 border border-ink-100 shadow-sm space-y-5">
          <div className="border-b border-ink-100 pb-3">
            <h3 className="text-sm font-bold text-ink-900">Basic Gallery Information</h3>
            <p className="text-2xs text-ink-500">Provide the client name, event title, and customized web URL slug.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold text-ink-800">
                Gallery Title <span className="text-rose-500">*</span>
              </label>
              <Input
                type="text"
                placeholder="e.g. Akash & Priya Wedding"
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ink-800">
                Custom URL Slug <span className="text-rose-500">*</span>
              </label>
              <Input
                type="text"
                placeholder="e.g. akash-priya-wedding"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: slugify(e.target.value) })}
                onBlur={handleSlugBlur}
                className="text-xs font-mono"
              />
              {slugStatus.message && (
                <p className={`text-3xs ${slugStatus.available ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {slugStatus.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ink-800">Client Names</label>
              <Input
                type="text"
                placeholder="e.g. Akash Verma & Priya Sharma"
                value={formData.clientNames}
                onChange={(e) => setFormData({ ...formData, clientNames: e.target.value })}
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ink-800">Event Date</label>
              <Input
                type="date"
                value={formData.eventDate}
                onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ink-800">Photographer / Studio Name</label>
              <Input
                type="text"
                value={formData.photographerName}
                onChange={(e) => setFormData({ ...formData, photographerName: e.target.value })}
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold text-ink-800">Subtitle or Welcome Note</label>
              <Textarea
                rows={2}
                placeholder="Optional greeting for guests (e.g. Celebrating our union at Taj Lake Palace, Udaipur)."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ink-800">Publication Status</label>
              <Select
                value={formData.publicationStatus}
                onChange={(e) => setFormData({ ...formData, publicationStatus: e.target.value })}
                options={[
                  { value: 'draft', label: 'Draft (Admin Only)' },
                  { value: 'published', label: 'Published (Publicly Viewable)' },
                ]}
                className="text-xs"
              />
            </div>
          </div>
        </Card>
      )}

      {/* Tab 2: Google Drive Folder Configuration */}
      {activeTab === 'drive' && (
        <Card className="p-6 border border-ink-100 shadow-sm space-y-5">
          <div className="border-b border-ink-100 pb-3">
            <h3 className="text-sm font-bold text-ink-900 flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-brand-600" />
              <span>Google Drive Folder Connection</span>
            </h3>
            <p className="text-2xs text-ink-500">
              Paste the shared Google Drive folder link containing the high-res wedding photos.
            </p>
          </div>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ink-800">
                Google Drive Folder URL <span className="text-rose-500">*</span>
              </label>
              <div className="flex gap-2">
                <Input
                  type="url"
                  placeholder="https://drive.google.com/drive/folders/1ABC_xyz..."
                  value={formData.driveFolderUrl}
                  onChange={(e) => setFormData({ ...formData, driveFolderUrl: e.target.value })}
                  className="text-xs font-mono flex-1"
                />
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  icon={FolderCheck}
                  onClick={handleValidateFolder}
                  disabled={validatingFolder}
                >
                  {validatingFolder ? 'Connecting...' : 'Validate Folder'}
                </Button>
                {isEditing && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    icon={RefreshCw}
                    onClick={handleSyncFromDrive}
                    disabled={validatingFolder}
                    title="Fetch and sync all photos directly from Google Drive"
                  >
                    {validatingFolder ? 'Syncing...' : 'Sync Latest Photos'}
                  </Button>
                )}
              </div>
            </div>

            {/* Sharing Permission Guide */}
            <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-amber-950">
                <ShieldAlert className="w-4 h-4 text-amber-700" />
                <span>Crucial Google Drive Sharing Requirement:</span>
              </div>
              <p className="text-2xs text-amber-800 leading-relaxed">
                In Google Drive, right-click your photo folder, click <strong>Share</strong>, and set General Access to <strong>"Anyone with the link can view"</strong>. Guests will NOT need to sign into Google to view the gallery.
              </p>
            </div>

            {/* Folder Validation Feedback Banner */}
            {folderValidation && (
              <div
                className={`p-4 rounded-xl border space-y-2 ${
                  folderValidation.valid
                    ? 'bg-emerald-50/40 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50/40 border-rose-200 text-rose-900'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-xs">
                  {folderValidation.valid ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                  )}
                  <span>{folderValidation.message || folderValidation.error}</span>
                </div>
                {folderValidation.photoCount !== undefined && (
                  <p className="text-2xs text-emerald-800">
                    Detected {folderValidation.photoCount} supported image file(s) in this folder.
                  </p>
                )}
              </div>
            )}

            {/* Comprehensive All-Photos Thumbnail Viewer */}
            {previewPhotos.length > 0 && (
              <div className="space-y-3 pt-3 border-t border-ink-100">
                {/* Header Controls: Count, Cover Info, and Search */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-ink-50 p-3 rounded-xl border border-ink-200">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-ink-900">
                        Drive Photos ({filteredPreviewPhotos.length} of {previewPhotos.length})
                      </span>
                      {formData.coverImage?.fileId && (
                        <span className="inline-flex items-center gap-1 text-3xs font-medium text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full border border-brand-200">
                          <CheckCircle2 className="w-3 h-3 text-brand-600" /> Cover Selected
                        </span>
                      )}
                    </div>
                    <p className="text-3xs text-ink-500">
                      Click any photo thumbnail to set it as the Public Gallery Cover photo.
                    </p>
                  </div>

                  {/* Search / Filter Photos */}
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-400" />
                      <input
                        type="text"
                        placeholder="Search photo name..."
                        value={previewSearch}
                        onChange={(e) => setPreviewSearch(e.target.value)}
                        className="text-xs pl-8 pr-3 py-1.5 rounded-lg border border-ink-200 bg-white text-ink-900 placeholder-ink-400 focus:outline-brand-500 w-44 sm:w-56"
                      />
                    </div>
                    {previewSearch && (
                      <button
                        type="button"
                        onClick={() => setPreviewSearch('')}
                        className="text-3xs text-ink-500 hover:text-ink-800 underline px-1"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>

                {/* Selected Cover Banner */}
                {formData.coverImage?.fileId && (
                  <div className="flex items-center gap-3 p-2.5 rounded-lg bg-brand-50/60 border border-brand-200/80 text-xs text-brand-950">
                    <div className="w-10 h-10 rounded-md overflow-hidden bg-ink-200 shrink-0 border border-brand-300">
                      <img
                        src={`https://lh3.googleusercontent.com/d/${formData.coverImage.fileId}=w200`}
                        alt="Cover"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = `${PUBLIC_API_BASE}/public/drive-galleries/image/${formData.coverImage.fileId}?sz=w200`;
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-semibold block text-2xs uppercase tracking-wider text-brand-800">
                        Current Gallery Cover
                      </span>
                      <span className="text-3xs text-ink-600 truncate block">
                        File ID: {formData.coverImage.fileId}
                      </span>
                    </div>
                    <span className="text-3xs font-medium text-brand-700 bg-white px-2 py-1 rounded border border-brand-200">
                      Click another photo below to change
                    </span>
                  </div>
                )}

                {/* All Photos Compact Thumbnail Grid */}
                <div className="max-h-[520px] overflow-y-auto p-3 rounded-xl border border-ink-200 bg-ink-50/30 shadow-inner">
                  {filteredPreviewPhotos.length > 0 ? (
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-2">
                      {filteredPreviewPhotos.map((photo, idx) => (
                        <AdminThumbnailCard
                          key={photo.fileId || `thumb-${idx}`}
                          photo={photo}
                          idx={idx}
                          isCover={formData.coverImage?.fileId === photo.fileId}
                          onSelectCover={handleSelectCover}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-xs text-ink-500">
                      No photos match "{previewSearch}". Try a different search term.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Tab 3: Client Branding */}
      {activeTab === 'branding' && (
        <Card className="p-6 border border-ink-100 shadow-sm space-y-5">
          <div className="border-b border-ink-100 pb-3">
            <h3 className="text-sm font-bold text-ink-900">Studio & Client Branding</h3>
            <p className="text-2xs text-ink-500">Customize the studio watermark, intro story, and client names.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between md:col-span-2 p-3 rounded-xl bg-ink-50 border border-ink-100">
              <div>
                <span className="text-xs font-bold text-ink-900 block">Enable Studio Branding</span>
                <span className="text-3xs text-ink-500">Display your studio name and logo on the public gallery page.</span>
              </div>
              <Switch
                checked={formData.branding.enabled}
                onChange={(checked) =>
                  setFormData({
                    ...formData,
                    branding: { ...formData.branding, enabled: checked },
                  })
                }
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ink-800">Studio Name</label>
              <Input
                type="text"
                value={formData.branding.studioName}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    branding: { ...formData.branding, studioName: e.target.value },
                  })
                }
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ink-800">Studio Logo URL (Optional)</label>
              <Input
                type="url"
                placeholder="https://your-domain.com/logo.png"
                value={formData.branding.studioLogoUrl}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    branding: { ...formData.branding, studioLogoUrl: e.target.value },
                  })
                }
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold text-ink-800">Introduction / Story Message</label>
              <Textarea
                rows={2}
                placeholder="A warm message welcoming guests to relive moments from this memorable day."
                value={formData.branding.introMessage}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    branding: { ...formData.branding, introMessage: e.target.value },
                  })
                }
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold text-ink-800">Footer Text</label>
              <Input
                type="text"
                value={formData.branding.footerText}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    branding: { ...formData.branding, footerText: e.target.value },
                  })
                }
                className="text-xs"
              />
            </div>
          </div>
        </Card>
      )}

      {/* Tab 4: Theme & Appearance */}
      {activeTab === 'appearance' && (
        <Card className="p-6 border border-ink-100 shadow-sm space-y-5">
          <div className="border-b border-ink-100 pb-3">
            <h3 className="text-sm font-bold text-ink-900 flex items-center gap-2">
              <Palette className="w-4 h-4 text-brand-600" />
              <span>Theme & Visual Styling</span>
            </h3>
            <p className="text-2xs text-ink-500">Fine-tune the gallery mood, layout style, and accent colors.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ink-800">Color Palette Theme</label>
              <Select
                value={formData.themeSettings.theme}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    themeSettings: { ...formData.themeSettings, theme: e.target.value },
                  })
                }
                options={[
                  { value: 'dark', label: 'Luxury Dark (Deep Obsidian)' },
                  { value: 'light', label: 'Elegance Light (Clean White & Ivory)' },
                  { value: 'auto', label: 'System Auto (Matches Device Mode)' },
                ]}
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ink-800">Photo Grid Layout</label>
              <Select
                value={formData.themeSettings.layout}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    themeSettings: { ...formData.themeSettings, layout: e.target.value },
                  })
                }
                options={[
                  { value: 'masonry', label: 'Dynamic Masonry (Pinterest Style)' },
                  { value: 'grid', label: 'Uniform Square Grid' },
                  { value: 'justified', label: 'Justified Heights' },
                ]}
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ink-800">Grid Density</label>
              <Select
                value={formData.themeSettings.gridDensity}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    themeSettings: { ...formData.themeSettings, gridDensity: e.target.value },
                  })
                }
                options={[
                  { value: 'compact', label: 'Compact (4-5 columns, tight gaps)' },
                  { value: 'normal', label: 'Balanced (3-4 columns)' },
                  { value: 'spacious', label: 'Spacious (2-3 columns, large previews)' },
                ]}
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ink-800">Image Corner Style</label>
              <Select
                value={formData.themeSettings.imageRadius}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    themeSettings: { ...formData.themeSettings, imageRadius: e.target.value },
                  })
                }
                options={[
                  { value: 'none', label: 'Sharp Corners (0px)' },
                  { value: 'sm', label: 'Subtle Rounding (6px)' },
                  { value: 'md', label: 'Smooth Curvature (12px)' },
                  { value: 'lg', label: 'Organic Curvature (18px)' },
                ]}
                className="text-xs"
              />
            </div>

            {/* Accent Color Preset Selector */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-semibold text-ink-800">Accent Color</label>
              <div className="flex flex-wrap gap-2">
                {ACCENT_PRESETS.map((p) => {
                  const selected = formData.themeSettings.accentColor === p.value;
                  return (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          themeSettings: { ...formData.themeSettings, accentColor: p.value },
                        })
                      }
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-2xs font-medium transition-all ${
                        selected
                          ? 'border-brand-600 bg-brand-50/50 text-brand-900 shadow-xs'
                          : 'border-ink-200 hover:border-ink-300 text-ink-700'
                      }`}
                    >
                      <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: p.value }} />
                      <span>{p.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Tab 5: Gallery Behavior */}
      {activeTab === 'behavior' && (
        <Card className="p-6 border border-ink-100 shadow-sm space-y-5">
          <div className="border-b border-ink-100 pb-3">
            <h3 className="text-sm font-bold text-ink-900 flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-brand-600" />
              <span>Interactive Controls & Guest Permissions</span>
            </h3>
            <p className="text-2xs text-ink-500">Configure downloads, lightbox tools, and image sorting.</p>
          </div>

          <div className="space-y-4 divide-y divide-ink-100">
            <div className="flex items-center justify-between pt-2">
              <div>
                <span className="text-xs font-semibold text-ink-900 block">Allow Original Photo Downloads</span>
                <span className="text-3xs text-ink-500">Guests can download full-resolution images directly from Google Drive.</span>
              </div>
              <Switch
                checked={formData.gallerySettings.allowDownloads}
                onChange={(checked) =>
                  setFormData({
                    ...formData,
                    gallerySettings: { ...formData.gallerySettings, allowDownloads: checked },
                  })
                }
              />
            </div>

            <div className="flex items-center justify-between pt-3">
              <div>
                <span className="text-xs font-semibold text-ink-900 block">Enable Full-Screen Lightbox</span>
                <span className="text-3xs text-ink-500">Clicking an image opens an immersive viewer with keyboard navigation.</span>
              </div>
              <Switch
                checked={formData.gallerySettings.enableLightbox}
                onChange={(checked) =>
                  setFormData({
                    ...formData,
                    gallerySettings: { ...formData.gallerySettings, enableLightbox: checked },
                  })
                }
              />
            </div>

            <div className="flex items-center justify-between pt-3">
              <div>
                <span className="text-xs font-semibold text-ink-900 block">Enable Auto-Slideshow Mode</span>
                <span className="text-3xs text-ink-500">Allows guests to autoplay a hands-free photo presentation.</span>
              </div>
              <Switch
                checked={formData.gallerySettings.enableSlideshow}
                onChange={(checked) =>
                  setFormData({
                    ...formData,
                    gallerySettings: { ...formData.gallerySettings, enableSlideshow: checked },
                  })
                }
              />
            </div>

            <div className="flex items-center justify-between pt-3">
              <div>
                <span className="text-xs font-semibold text-ink-900 block">Show Photo Count Badge</span>
                <span className="text-3xs text-ink-500">Displays total number of photographs in gallery header.</span>
              </div>
              <Switch
                checked={formData.gallerySettings.showPhotoCount}
                onChange={(checked) =>
                  setFormData({
                    ...formData,
                    gallerySettings: { ...formData.gallerySettings, showPhotoCount: checked },
                  })
                }
              />
            </div>

            <div className="pt-3 space-y-1.5">
              <label className="text-xs font-semibold text-ink-800">Default Photo Sorting</label>
              <Select
                value={formData.gallerySettings.sortOrder}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    gallerySettings: { ...formData.gallerySettings, sortOrder: e.target.value },
                  })
                }
                options={[
                  { value: 'name_asc', label: 'File Name (A to Z) — Recommended for numbered cameras' },
                  { value: 'name_desc', label: 'File Name (Z to A)' },
                  { value: 'date_asc', label: 'Capture Date (Oldest to Newest)' },
                  { value: 'date_desc', label: 'Capture Date (Newest to Oldest)' },
                ]}
                className="text-xs w-80"
              />
            </div>
          </div>
        </Card>
      )}

      {/* Footer Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-ink-100">
        <Button as={Link} to={CRM.driveGalleries} variant="outline" size="sm">
          Cancel
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleSubmit('draft')}
          disabled={saving}
        >
          Save as Draft
        </Button>
        <Button
          variant="primary"
          size="sm"
          icon={Save}
          onClick={() => handleSubmit('published')}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save & Publish'}
        </Button>
      </div>
    </div>
  );
};

export default DriveGalleryForm;

