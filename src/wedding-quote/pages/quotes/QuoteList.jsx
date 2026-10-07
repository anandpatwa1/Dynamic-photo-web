import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { Copy, PieChart, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Badge, Button, ConfirmDialog, DataTable, EmptyState, PageHeader, SearchInput, SegmentedControl, Toolbar } from '@/components/ui';
import { formatDate as formatUpdated } from '@/utils/format';
import { PermissionGate } from '../../components/PermissionGate';
import { BreakdownDrawer } from '../../components/BreakdownDrawer';
import { useWqPermissions } from '../../hooks/useWqPermissions';
import { wqQuotes } from '../../redux/wqSlices';
import { wqQuoteApi } from '../../api/wqApi';
import { formatINR } from '../../utils/engine/money';
import { T } from '../../constants/strings';
import { CRM } from '@/routes/paths';

const L = T.list;

export const QuoteList = () => (
  <PermissionGate anyOf={['viewQuotes']}>
    <QuoteListInner />
  </PermissionGate>
);

const QuoteListInner = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const perms = useWqPermissions();
  const rows = useSelector(wqQuotes.selectors.selectItems);
  const meta = useSelector(wqQuotes.selectors.selectMeta);
  const loading = useSelector(wqQuotes.selectors.selectLoading);
  const [query, setQuery] = useState({ search: '', status: '', page: 1, limit: 20 });
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const [breakdownId, setBreakdownId] = useState(null);

  const load = useCallback(() => dispatch(wqQuotes.thunks.fetchList({ ...query, search: query.search || undefined, status: query.status || undefined })), [dispatch, query]);
  useEffect(() => { load(); }, [load]);

  const duplicate = async (row) => {
    try {
      const r = await wqQuoteApi.duplicate(row._id);
      toast.success(L.duplicate);
      navigate(CRM.wqQuoteEdit(r.quote._id));
    } catch (e) {
      toast.error(e?.response?.data?.message ?? 'Could not duplicate');
    }
  };

  const remove = async () => {
    setBusy(true);
    const result = await dispatch(wqQuotes.thunks.remove(deleting._id));
    setBusy(false);
    if (result.error) toast.error(result.payload?.message ?? 'Could not delete');
    else toast.success(T.common.deleted);
    setDeleting(null);
  };

  const columns = [
    {
      key: 'label',
      header: T.wizard.packageName,
      render: (r) => (
        <Link to={CRM.wqQuoteEdit(r._id)} className="block">
          <p className="font-medium text-ink-900 hover:text-brand-600">{r.packageName || L.untitled}</p>
          {r.label && <p className="text-xs text-ink-500">{r.label}</p>}
        </Link>
      ),
    },
    { key: 'dates', header: L.dates, render: (r) => <span className="text-sm text-ink-600">{r.dates.join(', ') || '—'}</span> },
    { key: 'status', header: 'Status', render: (r) => <Badge tone={r.status === 'saved' ? 'success' : 'neutral'} size="sm">{L.status[r.status]}</Badge> },
    {
      key: 'price',
      header: L.price,
      align: 'right',
      render: (r) => (
        <div className="tabular text-right">
          <p className="font-semibold text-ink-900">{formatINR(r.computed?.display?.selling)}</p>
          {perms.viewCosting && r.computed?.profit !== undefined && <p className="text-xs text-ink-500">{T.breakdown.profit} {formatINR(r.computed.profit)}</p>}
        </div>
      ),
    },
    { key: 'updatedAt', header: L.updated, sortable: false, render: (r) => <span className="text-sm text-ink-500">{formatUpdated(r.updatedAt)}</span> },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (r) => (
        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Button size="xs" variant="ghost" iconOnly icon={PieChart} aria-label={L.breakdown} onClick={() => setBreakdownId(r._id)} />
          {perms.createQuote && <Button size="xs" variant="ghost" iconOnly icon={Copy} aria-label={L.duplicate} onClick={() => duplicate(r)} />}
          {perms.deleteQuote && <Button size="xs" variant="ghost" iconOnly icon={Trash2} aria-label={T.common.delete} onClick={() => setDeleting(r)} />}
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title={L.title}
        description={L.description}
        breadcrumbs={[{ label: T.module }, { label: L.title }]}
        actions={perms.createQuote && <Button icon={Plus} onClick={() => navigate(CRM.wqCreate)}>{T.nav.create}</Button>}
      />
      <Toolbar>
        <SearchInput value={query.search} onChange={(search) => setQuery((q) => ({ ...q, search, page: 1 }))} placeholder={T.common.search} className="w-full sm:w-80" />
        <SegmentedControl value={query.status} onChange={(status) => setQuery((q) => ({ ...q, status, page: 1 }))}
          options={[{ value: '', label: L.status.all }, { value: 'draft', label: L.status.draft }, { value: 'saved', label: L.status.saved }]} />
      </Toolbar>
      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        meta={meta}
        onPageChange={(page) => setQuery((q) => ({ ...q, page }))}
        onLimitChange={(limit) => setQuery((q) => ({ ...q, limit, page: 1 }))}
        onRowClick={(r) => navigate(CRM.wqQuoteEdit(r._id))}
        empty={<EmptyState title={L.empty} actionLabel={perms.createQuote ? T.nav.create : undefined} onAction={() => navigate(CRM.wqCreate)} actionIcon={Plus} />}
      />
      <BreakdownDrawer quoteId={breakdownId} open={!!breakdownId} onClose={() => setBreakdownId(null)} />
      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={remove} loading={busy} message={T.common.confirmDelete} />
    </>
  );
};

export default QuoteList;
