import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  CalendarDays,
  IndianRupee,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import toast from 'react-hot-toast';

import {
  Badge,
  Button,
  ConfirmDialog,
  DataTable,
  Dropdown,
  DropdownItem,
  EmptyState,
  PageHeader,
  SearchInput,
  Select,
  StatCard,
  StatusBadge,
  Toolbar,
} from '@/components/ui';
import {
  fetchPayments,
  fetchPaymentStats,
  deletePayment,
  selectPayments,
  selectPaymentsMeta,
  selectPaymentsLoading,
  selectPaymentStats,
  selectPaymentSaving,
} from '@/redux/payment/paymentSlice';
import { useListQuery } from '@/hooks/useListQuery';
import { useAuth } from '@/hooks/useAuth';
import { PAYMENT_MODES, PAYMENT_STATUS_META, statusOptions } from '@/constants';
import { formatCompactCurrency, formatCurrency, formatDate, humanize } from '@/utils/format';
import { PaymentFormModal } from './PaymentFormModal';

const STATUS_OPTIONS = statusOptions(PAYMENT_STATUS_META);

export const Payments = () => {
  const dispatch = useDispatch();
  const payments = useSelector(selectPayments);
  const meta = useSelector(selectPaymentsMeta);
  const loading = useSelector(selectPaymentsLoading);
  const stats = useSelector(selectPaymentStats);
  const saving = useSelector(selectPaymentSaving);
  const { canManage } = useAuth();

  const { params, query, sort, setPage, setLimit, setSearch, setSort, setFilter } = useListQuery({
    sortBy: 'date',
  });

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirming, setConfirming] = useState(null);

  useEffect(() => {
    dispatch(fetchPayments(params));
  }, [dispatch, params]);

  useEffect(() => {
    dispatch(fetchPaymentStats());
  }, [dispatch]);

  const refresh = () => {
    dispatch(fetchPayments(params));
    dispatch(fetchPaymentStats());
  };

  const handleDelete = async () => {
    const result = await dispatch(deletePayment(confirming._id));
    setConfirming(null);

    if (deletePayment.fulfilled.match(result)) {
      toast.success('Payment removed — the invoice balance has been restored');
      refresh();
    } else {
      toast.error(result.payload?.message ?? 'Could not remove the payment');
    }
  };

  const columns = [
    {
      key: 'receiptNumber',
      header: 'Receipt',
      render: (payment) => (
        <div className="min-w-0">
          <p className="tabular truncate font-medium text-ink-900">{payment.receiptNumber}</p>
          <p className="truncate text-sm text-ink-500">{humanize(payment.mode)}</p>
        </div>
      ),
    },
    {
      key: 'document',
      header: 'Invoice',
      render: (payment) =>
        payment.document ? (
          <Link
            to={`/CRM/documents/${payment.document._id}`}
            className="tabular text-ink-700 hover:text-brand-600"
          >
            {payment.document.number}
          </Link>
        ) : (
          <span className="text-ink-400">—</span>
        ),
    },
    {
      key: 'client',
      header: 'Client',
      render: (payment) => (
        <span className="truncate text-ink-700">{payment.client?.name ?? '—'}</span>
      ),
    },
    {
      key: 'date',
      header: 'Date',
      sortable: true,
      render: (payment) => <span className="text-ink-500">{formatDate(payment.date)}</span>,
    },
    {
      key: 'amount',
      header: 'Amount',
      sortable: true,
      align: 'right',
      numeric: true,
      render: (payment) => (
        <span className="font-medium text-ink-900">{formatCurrency(payment.amount)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (payment) => <StatusBadge status={payment.status} meta={PAYMENT_STATUS_META} />,
    },
    ...(canManage
      ? [
          {
            key: 'actions',
            header: '',
            width: 56,
            align: 'right',
            render: (payment) => (
              <Dropdown
                trigger={({ toggle }) => (
                  <Button
                    variant="ghost"
                    size="sm"
                    iconOnly
                    icon={MoreHorizontal}
                    aria-label={`Actions for ${payment.receiptNumber}`}
                    onClick={toggle}
                  />
                )}
              >
                <DropdownItem
                  icon={Pencil}
                  onClick={() => {
                    setEditing(payment);
                    setFormOpen(true);
                  }}
                >
                  Edit payment
                </DropdownItem>
                <DropdownItem icon={Trash2} danger onClick={() => setConfirming(payment)}>
                  Remove
                </DropdownItem>
              </Dropdown>
            ),
          },
        ]
      : []),
  ];

  const hasFilters = Boolean(query.search || query.mode || query.status);

  return (
    <>
      <PageHeader
        title="Payments"
        description="Every rupee received, matched to the invoice it settles."
        actions={
          canManage && (
            <Button
              icon={Plus}
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              Record payment
            </Button>
          )
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total received"
          value={formatCompactCurrency(stats?.totalReceived ?? 0)}
          icon={Wallet}
          accent="success"
          loading={!stats}
        />
        <StatCard
          label="This month"
          value={formatCompactCurrency(stats?.receivedThisMonth ?? 0)}
          icon={CalendarDays}
          accent="info"
          loading={!stats}
        />
        <StatCard
          label="Outstanding"
          value={formatCompactCurrency(stats?.outstanding ?? 0)}
          hint={`${stats?.outstandingInvoices ?? 0} invoice${stats?.outstandingInvoices === 1 ? '' : 's'}`}
          icon={IndianRupee}
          accent="warning"
          loading={!stats}
        />
        <StatCard
          label="Payments recorded"
          value={stats?.paymentCount ?? 0}
          icon={TrendingUp}
          loading={!stats}
        />
      </div>

      {stats?.byMode?.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span className="text-sm text-ink-500">Collected by:</span>
          {stats.byMode.map((entry) => (
            <Badge key={entry.mode} tone="neutral">
              {humanize(entry.mode)} · {formatCompactCurrency(entry.total)}
            </Badge>
          ))}
        </div>
      )}

      <Toolbar>
        <SearchInput
          value={query.search}
          onChange={setSearch}
          placeholder="Search by receipt or reference…"
          className="w-full sm:max-w-sm"
        />
        <Select
          value={query.mode ?? ''}
          onChange={(event) => setFilter('mode', event.target.value)}
          options={PAYMENT_MODES}
          placeholder="All modes"
          wrapperClassName="w-full sm:w-44"
        />
        <Select
          value={query.status ?? ''}
          onChange={(event) => setFilter('status', event.target.value)}
          options={STATUS_OPTIONS}
          placeholder="All statuses"
          wrapperClassName="w-full sm:w-44"
        />
      </Toolbar>

      <DataTable
        columns={columns}
        rows={payments}
        loading={loading}
        meta={meta}
        sort={sort}
        onSortChange={setSort}
        onPageChange={setPage}
        onLimitChange={setLimit}
        empty={
          hasFilters ? (
            <EmptyState
              icon={Wallet}
              title="No payments match those filters"
              description="Try a different search term or clear the filters."
            />
          ) : (
            <EmptyState
              icon={Wallet}
              title="No payments yet"
              description="Record your first payment against an invoice and the balance updates itself."
              actionLabel={canManage ? 'Record a payment' : undefined}
              actionIcon={Plus}
              onAction={canManage ? () => setFormOpen(true) : undefined}
            />
          )
        }
      />

      <PaymentFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        payment={editing}
        onSaved={refresh}
      />

      <ConfirmDialog
        open={Boolean(confirming)}
        onClose={() => setConfirming(null)}
        onConfirm={handleDelete}
        loading={saving}
        title={`Remove ${confirming?.receiptNumber}?`}
        message="The invoice balance and status will be recalculated without this payment."
        confirmLabel="Remove payment"
      />
    </>
  );
};

export default Payments;
