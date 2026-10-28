import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Bell,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Eye,
  HardDrive,
  Instagram,
  Layers,
  MoreVertical,
  Plus,
  QrCode,
  RotateCcw,
  Send,
  Sparkles,
  Trash2,
  Users,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  DataTable,
  Dropdown,
  DropdownItem,
  DropdownDivider,
  EmptyState,
  PageHeader,
  SearchInput,
  Select,
  Switch,
} from '@/components/ui';
import { CRM } from '@/routes/paths';
import { weddingQrApi } from '@/api/weddingQrApi';
import { QrCodeModal } from './components/QrCodeModal';
import { GuestRegistrationsModal } from './components/GuestRegistrationsModal';
import { SendNotificationsModal } from './components/SendNotificationsModal';

export const WeddingQrProjects = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [galleryStatusFilter, setGalleryStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, pages: 1, limit: 20 });

  const [selectedQrProject, setSelectedQrProject] = useState(null);
  const [selectedRegistrationProject, setSelectedRegistrationProject] = useState(null);
  const [selectedNotifyProject, setSelectedNotifyProject] = useState(null);
  const [deleteProject, setDeleteProject] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [duplicatingId, setDuplicatingId] = useState(null);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const res = await weddingQrApi.list({
        page,
        limit: 20,
        search: search.trim() || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        galleryStatus: galleryStatusFilter !== 'all' ? galleryStatusFilter : undefined,
      });
      const items = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.data?.projects)
        ? res.data.projects
        : Array.isArray(res?.projects)
        ? res.projects
        : Array.isArray(res)
        ? res
        : [];
      setProjects(items);
      const resMeta = res?.meta || {};
      setMeta({
        total: resMeta.total ?? items.length,
        pages: resMeta.pages ?? 1,
        totalPages: resMeta.totalPages ?? resMeta.pages ?? 1,
        limit: resMeta.limit ?? 20,
        page: resMeta.page ?? page,
      });
    } catch (err) {
      console.error('Failed to load wedding QR projects:', err);
      toast.error(err?.response?.data?.message || 'Could not load wedding QR projects');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, galleryStatusFilter]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleToggleStatus = async (project) => {
    try {
      const updated = await weddingQrApi.toggleStatus(project._id, !project.isActive);
      toast.success(updated.message || 'Status updated');
      setProjects((prev) =>
        prev.map((p) => (p._id === project._id ? { ...p, isActive: !p.isActive } : p))
      );
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not update project status');
    }
  };

  const handleToggleGalleryStatus = async (project) => {
    const nextStatus = project.galleryStatus === 'ready' ? 'preparing' : 'ready';
    if (nextStatus === 'ready' && (!project.galleries || !project.galleries.length)) {
      toast.error('Please configure at least one usable gallery URL before marking photos ready.');
      return;
    }
    try {
      await weddingQrApi.setGalleryStatus(project._id, nextStatus);
      toast.success(
        nextStatus === 'ready'
          ? 'Photos marked as Ready! Guests can now view galleries and notifications can be sent.'
          : 'Status changed to Preparing. Guests will see the notification registration form.'
      );
      fetchProjects();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not update gallery status');
    }
  };

  const handleStartNewCycle = async (project) => {
    const confirmCycle = window.confirm(
      `Start a new event cycle for "${project.name}"?\n\nThis will increment the cycle to #${(project.eventCycle || 1) + 1} and reset the status to "Preparing". All current registrations will be safely archived for the previous wedding and will NOT be mixed with new guests.`
    );
    if (!confirmCycle) return;

    try {
      const res = await weddingQrApi.startNewEventCycle(project._id);
      toast.success(res?.message || 'Started new event cycle!');
      fetchProjects();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to start new cycle');
    }
  };

  const handleDuplicate = async (project) => {
    setDuplicatingId(project._id);
    try {
      const res = await weddingQrApi.duplicate(project._id);
      toast.success('Project duplicated as an inactive draft! You can edit it now.');
      fetchProjects();
      if (res?.data?.project?._id) {
        navigate(CRM.weddingQrEdit(res.data.project._id));
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to duplicate project');
    } finally {
      setDuplicatingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteProject) return;
    setDeleting(true);
    try {
      await weddingQrApi.remove(deleteProject._id);
      toast.success('Project deleted successfully');
      setDeleteProject(null);
      fetchProjects();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete project');
    } finally {
      setDeleting(false);
    }
  };

  const copyPublicLink = (slug) => {
    const url = `${window.location.origin}/photos/${slug}`;
    navigator.clipboard.writeText(url).then(
      () => toast.success('Public gallery link copied!'),
      () => toast.error('Could not copy link')
    );
  };

  const columns = [
    {
      key: 'name',
      header: 'Project / Event',
      label: 'Project / Event',
      render: (row) => (
        <div className="min-w-0 max-w-xs">
          <div className="flex items-center gap-2">
            <Link
              to={CRM.weddingQrEdit(row._id)}
              className="font-semibold text-ink-900 hover:text-brand-600 transition truncate"
            >
              {row.name}
            </Link>
            {row.isActive ? (
              <Badge tone="brand" size="xs">Active</Badge>
            ) : (
              <Badge tone="default" size="xs">Inactive</Badge>
            )}
          </div>
          {row.description && (
            <p className="text-2xs text-ink-500 truncate mt-0.5">{row.description}</p>
          )}
          <div className="flex items-center gap-1.5 mt-1">
            <span className="font-mono text-2xs text-ink-400">/photos/{row.slug}</span>
            <button
              type="button"
              onClick={() => copyPublicLink(row.slug)}
              className="text-ink-400 hover:text-brand-600 transition"
              title="Copy link"
            >
              <Copy className="w-3 h-3" />
            </button>
            <a
              href={`/photos/${row.slug}`}
              target="_blank"
              rel="noreferrer"
              className="text-ink-400 hover:text-brand-600 transition"
              title="Open public page"
            >
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      ),
    },
    {
      key: 'galleryStatus',
      header: 'Photos Status',
      label: 'Photos Status',
      render: (row) => {
        const isReady = row.galleryStatus === 'ready';
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              {isReady ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3" /> Photos Ready
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                  <Clock className="w-3 h-3" /> Preparing
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => handleToggleGalleryStatus(row)}
              className="text-3xs text-brand-600 hover:underline block"
            >
              Switch to {isReady ? 'Preparing' : 'Ready'}
            </button>
          </div>
        );
      },
    },
    {
      key: 'registrations',
      header: 'Guest Contacts',
      label: 'Guest Contacts',
      render: (row) => (
        <button
          type="button"
          onClick={() => setSelectedRegistrationProject(row)}
          className="text-left group cursor-pointer"
        >
          <div className="flex items-center gap-1.5 text-xs font-semibold text-ink-800 group-hover:text-brand-600">
            <Users className="w-3.5 h-3.5 text-ink-400 group-hover:text-brand-600" />
            <span>{row.totalRegistrations || 0} registered</span>
          </div>
          <div className="text-3xs text-ink-400 font-mono mt-0.5">
            {row.emailEligibleCount || 0} email · {row.whatsappEligibleCount || 0} WA (Cycle #{row.eventCycle || 1})
          </div>
        </button>
      ),
    },
    {
      key: 'galleries',
      header: 'Galleries',
      label: 'Galleries',
      render: (row) => (
        <div className="flex items-center gap-1 text-xs font-semibold text-ink-700">
          <Layers className="w-3.5 h-3.5 text-ink-400" />
          <span>{row.galleries?.length || 0}</span>
          <span className="text-2xs font-normal text-ink-400">
            {row.galleries?.length === 1 ? 'gallery' : 'galleries'}
          </span>
        </div>
      ),
    },
    {
      key: 'analytics',
      header: 'Lifetime Activity',
      label: 'Lifetime Activity',
      render: (row) => {
        const a = row.analytics || {};
        return (
          <div className="flex items-center gap-2 text-2xs font-medium text-ink-600">
            <span title="Lifetime landing page visits across all cycles" className="tabular">
              <strong className="text-ink-900">{a.visits || 0}</strong> visits
            </span>
            <span className="text-ink-300">·</span>
            <span title="Lifetime Instagram profile clicks" className="tabular text-pink-700">
              <strong>{a.instagramClicks || 0}</strong> IG clicks
            </span>
            <span className="text-ink-300">·</span>
            <span title="Lifetime gallery links unlocked" className="tabular text-emerald-700">
              <strong>{a.galleryClicks || 0}</strong> unlocked
            </span>
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Visibility',
      label: 'Visibility',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Switch
            checked={row.isActive}
            onChange={() => handleToggleStatus(row)}
            aria-label={`Toggle active status for ${row.name}`}
          />
          <span className="text-xs text-ink-500">{row.isActive ? 'Live' : 'Hidden'}</span>
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      label: '',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          {row.galleryStatus === 'ready' && (
            <Button
              size="sm"
              variant="secondary"
              icon={Send}
              onClick={() => setSelectedNotifyProject(row)}
              title="Notify registered guests"
            >
              Notify
            </Button>
          )}

          <Button
            size="sm"
            variant="secondary"
            icon={QrCode}
            onClick={() => setSelectedQrProject(row)}
            title="View & Download QR Code"
          >
            QR
          </Button>

          <Dropdown
            trigger={({ toggle }) => (
              <Button
                size="sm"
                variant="ghost"
                iconOnly
                icon={MoreVertical}
                aria-label={`Actions for ${row.name}`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggle();
                }}
              />
            )}
          >
            <DropdownItem
              icon={Eye}
              onClick={() => window.open(`/photos/${row.slug}`, '_blank')}
            >
              View Public Page
            </DropdownItem>
            <DropdownItem
              icon={BarChart3}
              onClick={() => navigate(`${CRM.weddingQrAnalytics}?projectId=${row._id}&cycle=${row.eventCycle || 1}`)}
            >
              View Analytics
            </DropdownItem>
            <DropdownItem
              icon={Users}
              onClick={() => setSelectedRegistrationProject(row)}
            >
              View Guest Contacts
            </DropdownItem>
            <DropdownItem
              icon={Sparkles}
              onClick={() => navigate(CRM.weddingQrEdit(row._id))}
            >
              Edit Configuration
            </DropdownItem>
            <DropdownItem
              icon={RotateCcw}
              onClick={() => handleStartNewCycle(row)}
            >
              Start New Event Cycle
            </DropdownItem>
            <DropdownItem
              icon={Copy}
              onClick={() => handleDuplicate(row)}
              disabled={duplicatingId === row._id}
            >
              {duplicatingId === row._id ? 'Duplicating...' : 'Duplicate Project'}
            </DropdownItem>
            <DropdownDivider />
            <DropdownItem
              icon={Trash2}
              danger
              onClick={() => setDeleteProject(row)}
            >
              Delete Project
            </DropdownItem>
          </Dropdown>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Wedding QR Projects"
        description="Display QR codes at wedding venues to grow your Instagram followers while providing guests convenient access and notifications for their event photo galleries."
        actions={
          <div className="flex items-center gap-2">
            <Button
              as={Link}
              to={CRM.driveGalleries}
              variant="outline"
              icon={HardDrive}
            >
              Google Drive Galleries
            </Button>
            <Button
              as={Link}
              to={CRM.weddingQrAnalytics}
              variant="outline"
              icon={BarChart3}
            >
              QR Analytics
            </Button>
            <Button
              as={Link}
              to={CRM.weddingQrNew}
              variant="brand"
              icon={Plus}
            >
              New Wedding QR
            </Button>
          </div>
        }
      />

      {/* Filter Toolbar */}
      <Card className="p-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="w-full sm:max-w-xs">
            <SearchInput
              value={search}
              onChange={(val) => {
                setSearch(val);
                setPage(1);
              }}
              placeholder="Search by project name or slug..."
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-2xs font-semibold text-ink-500 uppercase tracking-wider">
                Photos:
              </span>
              <Select
                value={galleryStatusFilter}
                onChange={(e) => {
                  setGalleryStatusFilter(e.target.value);
                  setPage(1);
                }}
                options={[
                  { value: 'all', label: 'All States' },
                  { value: 'preparing', label: 'Preparing Only' },
                  { value: 'ready', label: 'Ready Only' },
                ]}
                className="w-36 text-xs"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-2xs font-semibold text-ink-500 uppercase tracking-wider">
                Status:
              </span>
              <Select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                options={[
                  { value: 'all', label: 'All Projects' },
                  { value: 'active', label: 'Active Only' },
                  { value: 'inactive', label: 'Inactive Only' },
                ]}
                className="w-32 text-xs"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Projects Table */}
      <DataTable
        columns={columns}
        rows={projects}
        rowKey={(row) => row._id}
        loading={loading}
        meta={meta}
        onPageChange={setPage}
        empty={
          <EmptyState
            icon={QrCode}
            title="No Wedding QR Projects Found"
            description="Create a project to display a QR code at your next wedding event. Guests scan it to follow your Instagram and receive notifications for event photos."
            actionLabel="Create First QR Project"
            onAction={() => navigate(CRM.weddingQrNew)}
          />
        }
      />

      {/* QR Code Preview & Download Modal */}
      {selectedQrProject && (
        <QrCodeModal
          open={Boolean(selectedQrProject)}
          onClose={() => setSelectedQrProject(null)}
          project={selectedQrProject}
        />
      )}

      {/* Guest Registrations Modal */}
      {selectedRegistrationProject && (
        <GuestRegistrationsModal
          open={Boolean(selectedRegistrationProject)}
          onClose={() => setSelectedRegistrationProject(null)}
          project={selectedRegistrationProject}
          onNotifyClick={(p) => setSelectedNotifyProject(p)}
        />
      )}

      {/* Send Notifications Modal */}
      {selectedNotifyProject && (
        <SendNotificationsModal
          open={Boolean(selectedNotifyProject)}
          onClose={() => setSelectedNotifyProject(null)}
          project={selectedNotifyProject}
          onComplete={fetchProjects}
        />
      )}

      {/* Delete Confirmation */}
      {deleteProject && (
        <ConfirmDialog
          open={Boolean(deleteProject)}
          onClose={() => setDeleteProject(null)}
          title={`Delete "${deleteProject.name}"?`}
          description="Are you sure you want to delete this wedding QR project? If you have already printed or displayed its QR code at a venue, scanning it will stop working and show an error to guests. External galleries themselves will not be affected."
          confirmLabel={deleting ? 'Deleting...' : 'Delete Project'}
          confirmVariant="danger"
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
};

export default WeddingQrProjects;
