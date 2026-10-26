import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  CalendarClock,
  FolderKanban,
  IndianRupee,
  MapPin,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';

import {
  Badge,
  Button,
  CardSkeleton,
  ConfirmDialog,
  Dropdown,
  DropdownDivider,
  DropdownItem,
  EmptyState,
  PageHeader,
  Pagination,
  SearchInput,
  Select,
  StatCard,
  StatusBadge,
  Toolbar,
} from '@/components/ui';
import {
  fetchProjects,
  fetchProjectStats,
  updateProjectStatus,
  deleteProject,
  selectProjects,
  selectProjectsMeta,
  selectProjectsLoading,
  selectProjectStats,
  selectProjectSaving,
} from '@/redux/project/projectSlice';
import { useListQuery } from '@/hooks/useListQuery';
import { useAuth } from '@/hooks/useAuth';
import { PACKAGE_CATEGORIES, PERMISSIONS, PROJECT_STATUS_META, statusOptions } from '@/constants';
import { formatCompactCurrency, formatCurrency, formatDate, humanize } from '@/utils/format';
import { cn } from '@/utils/cn';
import { ProjectFormModal } from './ProjectFormModal';

const STATUS_OPTIONS = statusOptions(PROJECT_STATUS_META);

const PRIORITY_TONE = { high: 'danger', normal: 'neutral', low: 'neutral' };

const ProjectCard = ({ project, canEdit, canDelete, onEdit, onDelete, onAdvance }) => (
  <article className="group flex flex-col rounded-2xl bg-white shadow-card transition-all duration-200 ease-smooth hover:-translate-y-0.5 hover:shadow-card-hover">
    <header className="flex items-start justify-between gap-3 p-5 pb-4">
      <div className="min-w-0">
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          <StatusBadge status={project.status} meta={PROJECT_STATUS_META} size="sm" />
          {project.priority === 'high' && (
            <Badge tone={PRIORITY_TONE.high} size="sm">
              High priority
            </Badge>
          )}
          {project.isDeliveryLate && (
            <Badge tone="danger" size="sm">
              Delivery late
            </Badge>
          )}
        </div>
        <h3 className="text-balance text-md font-semibold leading-snug text-ink-900">
          {project.title}
        </h3>
        <p className="mt-0.5 truncate text-sm text-ink-500">
          {project.client?.name} · {humanize(project.category)}
        </p>
      </div>

      {(canEdit || canDelete) && (
        <Dropdown
          trigger={({ toggle }) => (
            <Button
              variant="ghost"
              size="sm"
              iconOnly
              icon={MoreHorizontal}
              onClick={toggle}
              aria-label={`Actions for ${project.title}`}
              className="-mr-1.5 -mt-1 shrink-0"
            />
          )}
        >
          {canEdit && <DropdownItem icon={Pencil} onClick={() => onEdit(project)}>Edit project</DropdownItem>}
          {canEdit && <DropdownDivider />}
          {canEdit && STATUS_OPTIONS.filter((option) => option.value !== project.status).map((option) => (
            <DropdownItem key={option.value} onClick={() => onAdvance(project, option.value)}>
              Move to {option.label.toLowerCase()}
            </DropdownItem>
          ))}
          {canDelete && <>{canEdit && <DropdownDivider />}<DropdownItem icon={Trash2} danger onClick={() => onDelete(project)}>Delete</DropdownItem></>}
        </Dropdown>
      )}
    </header>

    <div className="flex-1 space-y-3 px-5">
      <div>
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="text-ink-500">Progress</span>
          <span className="tabular font-medium text-ink-700">{project.progress}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-ink-100">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500 ease-smooth',
              project.progress === 100 ? 'bg-success-500' : 'bg-brand-500',
            )}
            style={{ width: `${project.progress}%` }}
          />
        </div>
      </div>

      <div className="space-y-1.5 text-sm text-ink-600">
        {project.shootDate && (
          <p className="flex items-center gap-2">
            <CalendarClock className="h-3.5 w-3.5 shrink-0 text-ink-400" aria-hidden="true" />
            Shoot {formatDate(project.shootDate)}
          </p>
        )}
        {project.location && (
          <p className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-ink-400" aria-hidden="true" />
            <span className="truncate">{project.location}</span>
          </p>
        )}
      </div>
    </div>

    <footer className="mt-4 flex items-center justify-between border-t border-ink-200/70 bg-ink-50/60 px-5 py-3.5">
      <span className="text-xs text-ink-500">Budget</span>
      <span className="tabular text-md font-semibold text-ink-900">
        {formatCurrency(project.budget)}
      </span>
    </footer>
  </article>
);

export const Projects = () => {
  const dispatch = useDispatch();
  const projects = useSelector(selectProjects);
  const meta = useSelector(selectProjectsMeta);
  const loading = useSelector(selectProjectsLoading);
  const stats = useSelector(selectProjectStats);
  const saving = useSelector(selectProjectSaving);
  const { can } = useAuth();
  const canCreate = can(PERMISSIONS.PROJECTS_CREATE);
  const canEdit = can(PERMISSIONS.PROJECTS_EDIT);
  const canDelete = can(PERMISSIONS.PROJECTS_DELETE);

  const { params, query, setPage, setLimit, setSearch, setFilter } = useListQuery({
    limit: 12,
    sortBy: 'createdAt',
  });

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirming, setConfirming] = useState(null);

  useEffect(() => {
    dispatch(fetchProjects(params));
  }, [dispatch, params]);

  useEffect(() => {
    dispatch(fetchProjectStats());
  }, [dispatch]);

  const refresh = () => {
    dispatch(fetchProjects(params));
    dispatch(fetchProjectStats());
  };

  const handleAdvance = async (project, status) => {
    const result = await dispatch(updateProjectStatus({ id: project._id, status }));
    if (updateProjectStatus.fulfilled.match(result)) {
      toast.success(`Moved to ${PROJECT_STATUS_META[status].label.toLowerCase()}`);
      dispatch(fetchProjectStats());
    } else {
      toast.error(result.payload?.message ?? 'Could not update the status');
    }
  };

  const handleDelete = async () => {
    const result = await dispatch(deleteProject(confirming._id));
    setConfirming(null);

    if (deleteProject.fulfilled.match(result)) {
      toast.success('Project deleted');
      refresh();
    } else {
      toast.error(result.payload?.message ?? 'Could not delete');
    }
  };

  const hasFilters = Boolean(query.search || query.status || query.category || query.upcoming);

  return (
    <>
      <PageHeader
        title="Projects"
        description="Every shoot from first enquiry to final delivery."
        actions={
          canCreate && (
            <Button
              icon={Plus}
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              New project
            </Button>
          )
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total projects" value={stats?.total ?? 0} icon={FolderKanban} loading={!stats} />
        <StatCard
          label="In progress"
          value={stats?.active ?? 0}
          icon={Zap}
          accent="info"
          loading={!stats}
        />
        <StatCard
          label="Upcoming shoots"
          value={stats?.upcoming ?? 0}
          icon={CalendarClock}
          accent="warning"
          loading={!stats}
        />
        <StatCard
          label="Pipeline value"
          value={formatCompactCurrency(stats?.pipelineValue ?? 0)}
          icon={IndianRupee}
          accent="olive"
          loading={!stats}
        />
      </div>

      <Toolbar>
        <SearchInput
          value={query.search}
          onChange={setSearch}
          placeholder="Search projects…"
          className="w-full sm:max-w-sm"
        />
        <Select
          value={query.status ?? ''}
          onChange={(event) => setFilter('status', event.target.value)}
          options={STATUS_OPTIONS}
          placeholder="All statuses"
          wrapperClassName="w-full sm:w-44"
        />
        <Select
          value={query.category ?? ''}
          onChange={(event) => setFilter('category', event.target.value)}
          options={PACKAGE_CATEGORIES}
          placeholder="All categories"
          wrapperClassName="w-full sm:w-48"
        />
        <Button
          variant={query.upcoming ? 'primary' : 'secondary'}
          icon={CalendarClock}
          onClick={() => setFilter('upcoming', query.upcoming ? '' : 'true')}
        >
          Upcoming only
        </Button>
      </Toolbar>

      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <CardSkeleton key={index} className="h-60" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="rounded-2xl bg-white shadow-card">
          {hasFilters ? (
            <EmptyState
              icon={FolderKanban}
              title="No projects match those filters"
              description="Try a different search term or clear the filters."
            />
          ) : (
            <EmptyState
              icon={FolderKanban}
              title="No projects yet"
              description="Create a project to track a shoot from enquiry through editing to delivery."
              actionLabel={canCreate ? 'Create a project' : undefined}
              actionIcon={Plus}
              onAction={canCreate ? () => setFormOpen(true) : undefined}
            />
          )}
        </div>
      ) : (
        <>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard
                key={project._id}
                project={project}
                canEdit={canEdit}
                canDelete={canDelete}
                onEdit={(item) => {
                  setEditing(item);
                  setFormOpen(true);
                }}
                onDelete={setConfirming}
                onAdvance={handleAdvance}
              />
            ))}
          </div>

          {meta && meta.totalPages > 1 && (
            <div className="mt-6 overflow-hidden rounded-2xl bg-white shadow-card">
              <Pagination meta={meta} onPageChange={setPage} onLimitChange={setLimit} />
            </div>
          )}
        </>
      )}

      <ProjectFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        project={editing}
        onSaved={refresh}
      />

      <ConfirmDialog
        open={Boolean(confirming)}
        onClose={() => setConfirming(null)}
        onConfirm={handleDelete}
        loading={saving}
        title={`Delete ${confirming?.title}?`}
        message="Documents raised against this project are kept — they simply stop being linked to it."
        confirmLabel="Delete project"
      />
    </>
  );
};

export default Projects;
