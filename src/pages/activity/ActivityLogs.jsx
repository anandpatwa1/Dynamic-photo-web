import { useEffect, useState } from 'react';
import { Activity, History } from 'lucide-react';
import toast from 'react-hot-toast';

import { activityApi } from '@/api/activityApi';
import { Badge, Card, CardBody, EmptyState, PageHeader, Pagination, Select, Skeleton, Toolbar } from '@/components/ui';
import { humanize } from '@/utils/format';

const ACTIONS = [{ value: 'created', label: 'Created' }, { value: 'updated', label: 'Updated' }, { value: 'deleted', label: 'Deleted' }];
const RESOURCES = [
  'clients', 'packages', 'projects', 'documents', 'payments', 'profiles', 'website', 'settings', 'auth',
  'wedding_quote.quotes', 'wedding_quote.bookings', 'wedding_quote.masters', 'wedding_quote.themes',
].map((value) => ({ value, label: humanize(value.replace('.', ' ')) }));
const toneFor = (action) => ({ created: 'success', updated: 'info', deleted: 'danger' }[action] ?? 'neutral');
const when = (date) => new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(date));

export const ActivityLogs = () => {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [filters, setFilters] = useState({ page: 1, limit: 30, resource: '', action: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    activityApi.list(filters).then((result) => {
      if (active) { setItems(result.items); setMeta(result.meta); }
    }).catch((error) => toast.error(error?.response?.data?.message ?? 'Could not load activity'))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [filters]);

  const setFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value, page: 1 }));

  return <>
    <PageHeader title="Activity Logs" description="A permanent trail of who created, edited or deleted records." />
    <Toolbar>
      <Select value={filters.resource} onChange={(event) => setFilter('resource', event.target.value)} options={RESOURCES} placeholder="All sections" wrapperClassName="w-full sm:w-56" />
      <Select value={filters.action} onChange={(event) => setFilter('action', event.target.value)} options={ACTIONS} placeholder="All actions" wrapperClassName="w-full sm:w-44" />
    </Toolbar>

    {loading ? <div className="space-y-3">{[1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-24 w-full" />)}</div> : items.length ? (
      <Card>
        <div className="divide-y divide-ink-100">{items.map((item) => <CardBody key={item._id} className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ink-50 text-ink-500"><Activity className="h-5 w-5" /></div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium text-ink-900">{item.actorSnapshot?.name ?? 'System'}</p>
              <Badge tone={toneFor(item.action)} size="sm">{humanize(item.action)}</Badge>
              <span className="text-sm text-ink-600">{humanize(item.resource?.replace('.', ' '))}</span>
            </div>
            <p className="mt-1 truncate text-sm text-ink-500">{item.path}{item.changedFields?.length ? ` · ${item.changedFields.join(', ')}` : ''}</p>
          </div>
          <div className="shrink-0 sm:text-right"><p className="text-sm font-medium text-ink-700">{when(item.createdAt)}</p><p className="text-xs text-ink-400">{humanize(item.actorSnapshot?.role)}</p></div>
        </CardBody>)}</div>
        <Pagination meta={meta} onPageChange={(page) => setFilters((current) => ({ ...current, page }))} onLimitChange={(limit) => setFilters((current) => ({ ...current, limit, page: 1 }))} />
      </Card>
    ) : <Card><EmptyState icon={History} title="No activity found" description="Successful edits and deletions will appear here." /></Card>}
  </>;
};

export default ActivityLogs;
