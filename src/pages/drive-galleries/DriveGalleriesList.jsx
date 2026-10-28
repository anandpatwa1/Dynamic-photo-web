import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Eye,
  Filter,
  HardDrive,
  Image as ImageIcon,
  MoreVertical,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Edit3,
  CopyPlus,
  AlertCircle,
  QrCode,
  ShieldAlert,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  PageHeader,
  Select,
} from '@/components/ui';
import { CRM } from '@/routes/paths';
import { driveGalleryApi } from '@/api/driveGalleryApi';

export const DriveGalleriesList = () => {
  const navigate = useNavigate();
  const [galleries, setGalleries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [syncingId, setSyncingId] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ open: false, gallery: null });
  const [deleting, setDeleting] = useState(false);

  const fetchGalleries = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (statusFilter !== 'all') params.status = statusFilter;

      const data = await driveGalleryApi.listGalleries(params);
      setGalleries(data?.galleries || []);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load Google Drive galleries');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchGalleries();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchGalleries]);

  const handleCopyLink = (slug) => {
    const fullUrl = `${window.location.origin}/gallery/${slug}`;
    navigator.clipboard.writeText(fullUrl);
    toast.success('Public gallery link copied to clipboard!');
  };

  const handleSync = async (gallery) => {
    try {
      setSyncingId(gallery._id);
      const res = await driveGalleryApi.syncGallery(gallery._id);
      toast.success(res?.message || 'Folder refreshed successfully!');
      fetchGalleries();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to sync folder contents');
    } finally {
      setSyncingId(null);
    }
  };

  const handleTogglePublish = async (gallery) => {
    try {
      const res = await driveGalleryApi.togglePublish(gallery._id);
      toast.success(res?.message || 'Status updated');
      setGalleries((prev) =>
        prev.map((g) =>
          g._id === gallery._id ? { ...g, publicationStatus: res.data.publicationStatus } : g,
        ),
      );
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not update publication status');
    }
  };

  const handleDuplicate = async (gallery) => {
    try {
      const res = await driveGalleryApi.duplicateGallery(gallery._id);
      toast.success('Gallery duplicated as Draft');
      navigate(CRM.driveGalleryEdit(res.data._id));
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not duplicate gallery');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.gallery) return;
    try {
      setDeleting(true);
      await driveGalleryApi.deleteGallery(deleteModal.gallery._id);
      toast.success('Gallery deleted. Source Drive files remain untouched.');
      setDeleteModal({ open: false, gallery: null });
      fetchGalleries();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete gallery');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Google Drive Galleries"
        description="Create and manage client photo galleries hosted securely on Google Drive. No photo files are copied or stored on your server."
        actions={
          <div className="flex items-center gap-2">
            <Button
              as={Link}
              to={CRM.weddingQr}
              variant="outline"
              size="sm"
              icon={QrCode}
              title="Switch to Wedding QR Projects"
            >
              Wedding QR
            </Button>
            <Button
              as={Link}
              to={CRM.driveGalleryNew}
              variant="primary"
              icon={Plus}
            >
              Create Gallery
            </Button>
          </div>
        }
      />

      {/* Info Notice Banner */}
      <div className="flex items-start gap-3 p-3.5 rounded-xl bg-ink-50 border border-ink-200 text-xs text-ink-700">
        <HardDrive className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-semibold text-ink-900">Zero Storage Footprint:</span>
          <p className="text-2xs text-ink-600 leading-relaxed">
            All original photographs remain on Google Drive. The application only caches photo metadata and delivers high-performance thumbnails directly through Google’s global image CDN.
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <Card className="p-4 border border-ink-100 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-ink-400" />
            <Input
              type="text"
              placeholder="Search by title, client, or slug..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Statuses' },
                { value: 'published', label: 'Published Only' },
                { value: 'draft', label: 'Drafts Only' },
              ]}
              className="text-xs w-36"
            />
            <Button
              variant="ghost"
              size="sm"
              icon={RefreshCw}
              onClick={fetchGalleries}
              title="Refresh list"
            />
          </div>
        </div>
      </Card>

      {/* Galleries Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((n) => (
            <Card key={n} className="p-4 space-y-4 animate-pulse">
              <div className="h-44 bg-ink-100 rounded-xl" />
              <div className="h-4 bg-ink-100 rounded w-3/4" />
              <div className="h-3 bg-ink-100 rounded w-1/2" />
            </Card>
          ))}
        </div>
      ) : galleries.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {galleries.map((gallery) => {
            const isPublished = gallery.publicationStatus === 'published';
            const publicUrl = `/gallery/${gallery.slug}`;
            const coverThumb = gallery.coverImage?.thumbnailUrl;

            return (
              <Card
                key={gallery._id}
                className="overflow-hidden border border-ink-100 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  {/* Gallery Cover Preview */}
                  <div className="relative h-44 bg-ink-900 overflow-hidden group">
                    {coverThumb ? (
                      <img
                        src={coverThumb}
                        alt={gallery.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-ink-500 gap-1.5">
                        <ImageIcon className="w-8 h-8 opacity-40" />
                        <span className="text-3xs uppercase tracking-wider">No Cover Image</span>
                      </div>
                    )}

                    {/* Status Badge */}
                    <div className="absolute top-3 left-3">
                      {isPublished ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-3xs font-bold uppercase tracking-wider bg-emerald-500 text-white shadow-xs">
                          <CheckCircle2 className="w-3 h-3" /> Published
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-3xs font-bold uppercase tracking-wider bg-amber-500 text-white shadow-xs">
                          <Clock className="w-3 h-3" /> Draft
                        </span>
                      )}
                    </div>

                    {/* Photo count pill */}
                    <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-xs text-white text-3xs font-medium px-2 py-0.5 rounded-full">
                      {gallery.totalPhotos || 0} photos
                    </div>

                    {/* Quick view button overlay */}
                    {isPublished && (
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button
                          as="a"
                          href={publicUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          variant="secondary"
                          size="xs"
                          icon={ExternalLink}
                        >
                          View Public Gallery
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Body Info */}
                  <div className="p-4 space-y-2">
                    <div>
                      <h3 className="font-bold text-ink-900 text-sm line-clamp-1 hover:text-brand-600 transition">
                        <Link to={CRM.driveGalleryEdit(gallery._id)}>{gallery.title}</Link>
                      </h3>
                      {gallery.clientNames && (
                        <p className="text-2xs text-ink-500 line-clamp-1">{gallery.clientNames}</p>
                      )}
                    </div>

                    {/* Slug & Link */}
                    <div className="flex items-center justify-between text-2xs p-1.5 rounded-lg bg-ink-50 border border-ink-100 font-mono text-ink-600">
                      <span className="truncate">/gallery/{gallery.slug}</span>
                      <button
                        type="button"
                        onClick={() => handleCopyLink(gallery.slug)}
                        className="text-ink-400 hover:text-ink-800 p-1"
                        title="Copy public link"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Stats & Meta */}
                    <div className="flex items-center justify-between text-3xs text-ink-400 pt-1">
                      <span>Views: <strong className="text-ink-700">{gallery.analytics?.views || 0}</strong></span>
                      <span>
                        {gallery.lastSyncedAt
                          ? `Synced: ${new Date(gallery.lastSyncedAt).toLocaleDateString()}`
                          : 'Never synced'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Action Bar */}
                <div className="p-3 border-t border-ink-100 bg-ink-50/40 flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1">
                    <Button
                      as={Link}
                      to={CRM.driveGalleryEdit(gallery._id)}
                      variant="outline"
                      size="xs"
                      icon={Edit3}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="xs"
                      icon={RefreshCw}
                      onClick={() => handleSync(gallery)}
                      disabled={syncingId === gallery._id}
                      className={syncingId === gallery._id ? 'animate-spin' : ''}
                      title="Sync folder contents"
                    >
                      Sync
                    </Button>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="xs"
                      icon={CopyPlus}
                      onClick={() => handleDuplicate(gallery)}
                      title="Duplicate gallery"
                    />
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => handleTogglePublish(gallery)}
                      className={isPublished ? 'text-amber-700' : 'text-emerald-700'}
                      title={isPublished ? 'Unpublish (set to Draft)' : 'Publish gallery'}
                    >
                      {isPublished ? 'Unpublish' : 'Publish'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="xs"
                      icon={Trash2}
                      onClick={() => setDeleteModal({ open: true, gallery })}
                      className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                      title="Delete gallery"
                    />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={HardDrive}
          title="No Google Drive galleries found"
          description="Create your first client gallery by pasting a shared Google Drive folder URL."
          action={
            <Button as={Link} to={CRM.driveGalleryNew} variant="primary" icon={Plus}>
              Create Gallery
            </Button>
          }
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-ink-100 animate-scale-in">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 rounded-full bg-rose-50">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-ink-900 text-base">Delete Gallery</h3>
                <p className="text-2xs text-ink-500">
                  {deleteModal.gallery?.title}
                </p>
              </div>
            </div>

            <p className="text-xs text-ink-600 leading-relaxed">
              Are you sure you want to delete this gallery configuration?
            </p>

            <div className="p-3 rounded-xl bg-ink-50 border border-ink-200 text-2xs text-ink-600 flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>Your photos are 100% safe:</strong> Deleting this gallery will <em>never</em> delete or modify any files on your Google Drive.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteModal({ open: false, gallery: null })}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleDeleteConfirm}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete Gallery'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriveGalleriesList;

