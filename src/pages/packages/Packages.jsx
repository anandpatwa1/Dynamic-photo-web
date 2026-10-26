import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { IndianRupee, Layers, Package as PackageIcon, Plus, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

import {
  Button,
  ConfirmDialog,
  EmptyState,
  PageHeader,
  Pagination,
  SearchInput,
  Select,
  StatCard,
  Toolbar,
  CardSkeleton,
} from '@/components/ui';
import {
  fetchPackages,
  fetchPackageStats,
  deletePackage,
  duplicatePackage,
  selectPackages,
  selectPackagesMeta,
  selectPackagesLoading,
  selectPackageStats,
  selectPackageSaving,
} from '@/redux/package/packageSlice';
import { useListQuery } from '@/hooks/useListQuery';
import { useAuth } from '@/hooks/useAuth';
import { PACKAGE_CATEGORIES, PERMISSIONS } from '@/constants';
import { formatCompactCurrency } from '@/utils/format';
import { PackageCard } from './PackageCard';
import { PackageFormModal } from './PackageFormModal';

const ACTIVE_OPTIONS = [
  { value: 'true', label: 'Active only' },
  { value: 'false', label: 'Inactive only' },
];

export const Packages = () => {
  const dispatch = useDispatch();
  const packages = useSelector(selectPackages);
  const meta = useSelector(selectPackagesMeta);
  const loading = useSelector(selectPackagesLoading);
  const stats = useSelector(selectPackageStats);
  const saving = useSelector(selectPackageSaving);
  const { can } = useAuth();
  const canCreate = can(PERMISSIONS.PACKAGES_CREATE);
  const canEdit = can(PERMISSIONS.PACKAGES_EDIT);
  const canDelete = can(PERMISSIONS.PACKAGES_DELETE);

  const { params, query, setPage, setLimit, setSearch, setFilter } = useListQuery({
    limit: 12,
    sortBy: 'sortOrder',
    sortOrder: 'asc',
  });

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirming, setConfirming] = useState(null);

  useEffect(() => {
    dispatch(fetchPackages(params));
  }, [dispatch, params]);

  useEffect(() => {
    dispatch(fetchPackageStats());
  }, [dispatch]);

  const refresh = useCallback(() => {
    dispatch(fetchPackages(params));
    dispatch(fetchPackageStats());
  }, [dispatch, params]);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const handleDuplicate = async (pkg) => {
    const result = await dispatch(duplicatePackage(pkg._id));
    if (duplicatePackage.fulfilled.match(result)) {
      toast.success('Package duplicated');
      setEditing(result.payload.package);
      setFormOpen(true);
    } else {
      toast.error(result.payload?.message ?? 'Could not duplicate');
    }
  };

  const handleDelete = async () => {
    const result = await dispatch(deletePackage(confirming._id));
    setConfirming(null);

    if (deletePackage.fulfilled.match(result)) {
      // The API deactivates instead of deleting when documents reference it.
      toast.success('Package removed');
      refresh();
    } else {
      toast.error(result.payload?.message ?? 'Could not delete');
    }
  };

  const hasFilters = Boolean(query.search || query.category || query.isActive);

  return (
    <>
      <PageHeader
        title="Packages"
        description="Reusable pricing and deliverables. Selecting one on a document fills in everything at once."
        actions={
          canCreate && (
            <Button icon={Plus} onClick={openCreate}>
              New package
            </Button>
          )
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total packages" value={stats?.total ?? 0} icon={PackageIcon} loading={!stats} />
        <StatCard
          label="Available now"
          value={stats?.active ?? 0}
          icon={Layers}
          accent="success"
          loading={!stats}
        />
        <StatCard
          label="Average price"
          value={formatCompactCurrency(stats?.averagePrice ?? 0)}
          icon={IndianRupee}
          accent="olive"
          loading={!stats}
        />
        <StatCard
          label="Most used"
          value={stats?.mostUsed?.timesUsed ?? 0}
          hint={stats?.mostUsed?.name ?? 'No usage yet'}
          icon={Sparkles}
          accent="warning"
          loading={!stats}
        />
      </div>

      <Toolbar>
        <SearchInput
          value={query.search}
          onChange={setSearch}
          placeholder="Search packages…"
          className="w-full sm:max-w-sm"
        />
        <Select
          value={query.category ?? ''}
          onChange={(event) => setFilter('category', event.target.value)}
          options={PACKAGE_CATEGORIES}
          placeholder="All categories"
          wrapperClassName="w-full sm:w-48"
        />
        <Select
          value={query.isActive ?? ''}
          onChange={(event) => setFilter('isActive', event.target.value)}
          options={ACTIVE_OPTIONS}
          placeholder="Active & inactive"
          wrapperClassName="w-full sm:w-44"
        />
      </Toolbar>

      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <CardSkeleton key={index} className="h-72" />
          ))}
        </div>
      ) : packages.length === 0 ? (
        <div className="rounded-2xl bg-white shadow-card">
          {hasFilters ? (
            <EmptyState
              icon={PackageIcon}
              title="No packages match those filters"
              description="Try a different search term or clear the filters."
            />
          ) : (
            <EmptyState
              icon={PackageIcon}
              title="No packages yet"
              description="Build your first package — wedding, monthly content, product shoot — and reuse it on every quotation."
              actionLabel={canCreate ? 'Create your first package' : undefined}
              actionIcon={Plus}
              onAction={canCreate ? openCreate : undefined}
            />
          )}
        </div>
      ) : (
        <>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {packages.map((pkg) => (
              <PackageCard
                key={pkg._id}
                package={pkg}
                canCreate={canCreate}
                canEdit={canEdit}
                canDelete={canDelete}
                onEdit={(item) => {
                  setEditing(item);
                  setFormOpen(true);
                }}
                onDuplicate={handleDuplicate}
                onDelete={setConfirming}
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

      <PackageFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        package={editing}
        onSaved={refresh}
      />

      <ConfirmDialog
        open={Boolean(confirming)}
        onClose={() => setConfirming(null)}
        onConfirm={handleDelete}
        loading={saving}
        title={`Delete ${confirming?.name}?`}
        message="Packages already used on a document are deactivated instead of deleted, so past documents keep rendering correctly."
        confirmLabel="Delete package"
      />
    </>
  );
};

export default Packages;
