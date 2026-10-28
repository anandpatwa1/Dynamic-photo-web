import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Copy, IndianRupee, PieChart, Plus, Send, Share2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Badge, Button, ConfirmDialog, DataTable, EmptyState, PageHeader, SearchInput, SegmentedControl, StatCard, Toolbar } from '@/components/ui';
import { formatDate as formatUpdated } from '@/utils/format';
import { PermissionGate } from '../../components/PermissionGate';
import { BreakdownDrawer } from '../../components/BreakdownDrawer';
import { ShareQuoteModal } from '../../components/ShareQuoteModal';
import { useWqPermissions } from '../../hooks/useWqPermissions';
import { wqQuotes } from '../../redux/wqSlices';
import { wqQuoteApi } from '../../api/wqApi';
import { formatINR } from '../../utils/engine/money';
import { T } from '../../constants/strings';
import { CRM } from '@/routes/paths';

const L = T.list;

const STATUS_MAP = {
  draft: { label: 'Draft', tone: 'neutral' },
  saved: { label: 'Ready', tone: 'info' },
  sent: { label: 'Sent', tone: 'primary' },
  viewed: { label: 'Viewed', tone: 'warning' },
  accepted: { label: 'Accepted ✅', tone: 'success' },
  revision_requested: { label: 'Revision 🔄', tone: 'warning' },
  rejected: { label: 'Declined', tone: 'danger' },
  expired: { label: 'Expired ⏰', tone: 'neutral' },
};

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
  const [sharingId, setSharingId] = useState(null);

  const metrics = useMemo(() => {
    let totalValue = 0;
    let acceptedValue = 0;
    let acceptedCount = 0;
    let sentCount = 0;
    let viewedCount = 0;
    let followUpCount = 0;
    const now = Date.now();

    for (const r of rows) {
      const val = r.computed?.display?.finalSelling || r.computed?.display?.selling || 0;
      totalValue += val;

      if (r.status === 'accepted') {
        acceptedCount += 1;
        acceptedValue += val;
      } else if (r.status === 'sent') {
        sentCount += 1;
      } else if (r.status === 'viewed') {
        viewedCount += 1;
      }

      const daysLeft = r.validUntil
        ? Math.ceil((new Date(r.validUntil).getTime() - now) / (1000 * 60 * 60 * 24))
        : null;

      if (r.status !== 'accepted' && r.status !== 'rejected') {
        if (r.status === 'viewed' || (daysLeft !== null && daysLeft >= 0 && daysLeft <= 3)) {
          followUpCount += 1;
        }
      }
    }

    const responded = acceptedCount + sentCount + viewedCount;
    const conversionRate = responded > 0 ? Math.round((acceptedCount / responded) * 100) : 0;

    return {
      totalValue,
      acceptedValue,
      acceptedCount,
      activeCount: sentCount + viewedCount,
      viewedCount,
      followUpCount,
      conversionRate,
    };
  }, [rows]);

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

  const bookToCalendar = async (row) => {
    try {
      const res = await wqQuoteApi.syncCalendar(row._id);
      toast.success(res.message || 'Booked to calendar!');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not sync to calendar');
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
      key: 'quoteCode',
      header: 'ID',
      render: (r) => (
        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200 inline-block shadow-2xs">
          #{r.quoteCode || '—'}
        </span>
      ),
    },
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
    {
      key: 'status',
      header: 'Status',
      render: (r) => {
        const cfg = STATUS_MAP[r.status] || { label: r.status, tone: 'neutral' };
        const daysLeft = r.validUntil
          ? Math.ceil((new Date(r.validUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          : null;
        const isExpiringSoon = daysLeft !== null && daysLeft >= 0 && daysLeft <= 3 && r.status !== 'accepted' && r.status !== 'rejected';

        return (
          <div className="flex flex-col gap-0.5">
            <Badge tone={cfg.tone} size="sm">{cfg.label}</Badge>
            {r.viewCount > 0 && (
              <span className="text-[10px] text-ink-500">👁 {r.viewCount} views</span>
            )}
            {isExpiringSoon && (
              <span className="text-[10px] font-medium text-warning-600">
                ⏰ {daysLeft === 0 ? 'Expires today' : `${daysLeft}d left`}
              </span>
            )}
          </div>
        );
      },
    },
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
          <Button size="xs" variant="ghost" iconOnly icon={Share2} aria-label="Share proposal" onClick={() => setSharingId(r._id)} title="Share proposal with client" />
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

      {/* Quote Pipeline & Performance Metrics */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Pipeline Value"
          value={formatINR(metrics.totalValue)}
          hint={`${rows.length} quotes loaded`}
          icon={IndianRupee}
          accent="brand"
          onClick={() => setQuery((q) => ({ ...q, status: '', page: 1 }))}
        />
        <StatCard
          label="Accepted Proposals"
          value={formatINR(metrics.acceptedValue)}
          hint={`${metrics.acceptedCount} won (${metrics.conversionRate}% conversion)`}
          icon={CheckCircle2}
          accent="success"
          onClick={() => setQuery((q) => ({ ...q, status: 'accepted', page: 1 }))}
        />
        <StatCard
          label="Active / Sent"
          value={metrics.activeCount}
          hint={`${metrics.viewedCount} viewed by client`}
          icon={Send}
          accent="info"
          onClick={() => setQuery((q) => ({ ...q, status: 'sent', page: 1 }))}
        />
        <StatCard
          label="Requires Action"
          value={metrics.followUpCount}
          hint={metrics.followUpCount > 0 ? 'Follow-up or expiring' : 'All proposals active'}
          icon={AlertCircle}
          accent={metrics.followUpCount > 0 ? 'warning' : 'olive'}
          onClick={() => setQuery((q) => ({ ...q, status: 'viewed', page: 1 }))}
        />
      </div>

      <Toolbar>
        <SearchInput value={query.search} onChange={(search) => setQuery((q) => ({ ...q, search, page: 1 }))} placeholder="Search by ID (#A43), package, client..." className="w-full sm:w-80" />
        <SegmentedControl
          value={query.status}
          onChange={(status) => setQuery((q) => ({ ...q, status, page: 1 }))}
          options={[
            { value: '', label: 'All' },
            { value: 'draft', label: 'Draft' },
            { value: 'sent', label: 'Sent' },
            { value: 'viewed', label: 'Viewed' },
            { value: 'accepted', label: 'Accepted' },
            { value: 'revision_requested', label: 'Revision' },
            { value: 'rejected', label: 'Declined' },
          ]}
        />
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
      <ShareQuoteModal open={!!sharingId} quoteId={sharingId} onClose={() => setSharingId(null)} onUpdated={load} />
      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={remove} loading={busy} message={T.common.confirmDelete} />
    </>
  );
};

export default QuoteList;
