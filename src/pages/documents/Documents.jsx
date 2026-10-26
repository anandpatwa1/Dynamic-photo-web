import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Copy,
  Download,
  FileText,
  IndianRupee,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  Wallet,
} from 'lucide-react';
import toast from 'react-hot-toast';

import {
  Badge,
  Button,
  ConfirmDialog,
  DataTable,
  Dropdown,
  DropdownDivider,
  DropdownItem,
  EmptyState,
  PageHeader,
  SearchInput,
  Select,
  StatCard,
  StatusBadge,
  Tabs,
  Toolbar,
} from '@/components/ui';
import {
  fetchDocuments,
  fetchDocumentStats,
  deleteDocument,
  duplicateDocument,
  selectDocuments,
  selectDocumentsMeta,
  selectDocumentsLoading,
  selectDocumentStats,
  selectDocumentSaving,
} from '@/redux/document/documentSlice';
import { documentApi } from '@/api/documentApi';
import { useListQuery } from '@/hooks/useListQuery';
import { useAuth } from '@/hooks/useAuth';
import { DOCUMENT_STATUS_META, DOCUMENT_TYPE_OPTIONS, PERMISSIONS, statusOptions } from '@/constants';
import { formatCompactCurrency, formatCurrency, formatDate } from '@/utils/format';

const STATUS_OPTIONS = statusOptions(DOCUMENT_STATUS_META);

const TYPE_TABS = [
  { value: '', label: 'All' },
  ...DOCUMENT_TYPE_OPTIONS.map(({ value, label }) => ({ value, label })),
];

export const Documents = ({ fixedType = '' }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const documents = useSelector(selectDocuments);
  const meta = useSelector(selectDocumentsMeta);
  const loading = useSelector(selectDocumentsLoading);
  const stats = useSelector(selectDocumentStats);
  const saving = useSelector(selectDocumentSaving);
  const { can } = useAuth();
  const canCreate = can(PERMISSIONS.DOCUMENTS_CREATE);
  const canEdit = can(PERMISSIONS.DOCUMENTS_EDIT);
  const canDelete = can(PERMISSIONS.DOCUMENTS_DELETE);

  const { params, query, sort, setPage, setLimit, setSearch, setSort, setFilter } = useListQuery({
    sortBy: 'date',
    type: fixedType || undefined,
  });
  const typeMeta = DOCUMENT_TYPE_OPTIONS.find((option) => option.value === fixedType);

  const [confirming, setConfirming] = useState(null);

  useEffect(() => {
    dispatch(fetchDocuments(params));
  }, [dispatch, params]);

  useEffect(() => {
    dispatch(fetchDocumentStats());
  }, [dispatch]);

  const handleDownload = async (doc) => {
    try {
      await documentApi.download(doc._id, { filename: `${doc.number}.pdf` });
      toast.success('PDF downloaded');
    } catch {
      toast.error('Could not generate the PDF');
    }
  };

  const handleDuplicate = async (doc) => {
    const result = await dispatch(duplicateDocument(doc._id));
    if (duplicateDocument.fulfilled.match(result)) {
      toast.success(`${result.payload.document.number} created`);
      navigate(`/CRM/documents/${result.payload.document._id}/edit`);
    } else {
      toast.error(result.payload?.message ?? 'Could not duplicate');
    }
  };

  const handleDelete = async () => {
    const result = await dispatch(deleteDocument(confirming._id));
    setConfirming(null);

    if (deleteDocument.fulfilled.match(result)) {
      toast.success('Document removed');
      dispatch(fetchDocuments(params));
      dispatch(fetchDocumentStats());
    } else {
      toast.error(result.payload?.message ?? 'Could not delete');
    }
  };

  const columns = [
    {
      key: 'number',
      header: 'Document',
      sortable: true,
      render: (doc) => (
        <div className="min-w-0">
          <Link
            to={`/CRM/documents/${doc._id}`}
            className="tabular block truncate font-medium text-ink-900 hover:text-brand-600"
          >
            {doc.number}
          </Link>
          <p className="truncate text-sm capitalize text-ink-500">
            {doc.type}
            {doc.subject ? ` · ${doc.subject}` : ''}
          </p>
        </div>
      ),
    },
    {
      key: 'client',
      header: 'Client',
      render: (doc) => (
        <span className="truncate text-ink-700">
          {doc.clientSnapshot?.name ?? doc.client?.name ?? '—'}
        </span>
      ),
    },
    {
      key: 'date',
      header: 'Date',
      sortable: true,
      render: (doc) => <span className="text-ink-500">{formatDate(doc.date)}</span>,
    },
    {
      key: 'total',
      header: 'Amount',
      sortable: true,
      align: 'right',
      numeric: true,
      render: (doc) => (
        <div>
          <p className="font-medium text-ink-900">{formatCurrency(doc.total)}</p>
          {doc.balanceDue > 0 && doc.amountPaid > 0 && (
            <p className="text-xs text-warning-600">{formatCurrency(doc.balanceDue)} due</p>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (doc) => (
        <div className="flex flex-wrap items-center gap-1.5">
          <StatusBadge status={doc.status} meta={DOCUMENT_STATUS_META} />
          {doc.isOverdue && (
            <Badge tone="danger" size="sm">
              Overdue
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: 56,
      align: 'right',
      render: (doc) => (
        <Dropdown
          trigger={({ toggle }) => (
            <Button
              variant="ghost"
              size="sm"
              iconOnly
              icon={MoreHorizontal}
              aria-label={`Actions for ${doc.number}`}
              onClick={(event) => {
                event.stopPropagation();
                toggle();
              }}
            />
          )}
        >
          <DropdownItem as={Link} to={`/CRM/documents/${doc._id}`} icon={FileText}>
            Open
          </DropdownItem>
          <DropdownItem icon={Download} onClick={() => handleDownload(doc)}>
            Download PDF
          </DropdownItem>
          {(canEdit || canCreate || canDelete) && (
            <>
              <DropdownDivider />
              {canEdit && <DropdownItem as={Link} to={`/CRM/documents/${doc._id}/edit`} icon={Pencil}>Edit</DropdownItem>}
              {canCreate && <DropdownItem icon={Copy} onClick={() => handleDuplicate(doc)}>Duplicate</DropdownItem>}
              {canDelete && <><DropdownDivider /><DropdownItem icon={Trash2} danger onClick={() => setConfirming(doc)}>Delete</DropdownItem></>}
            </>
          )}
        </Dropdown>
      ),
    },
  ];

  const hasFilters = Boolean(query.search || query.status || (!fixedType && query.type) || query.overdue);

  return (
    <>
      <PageHeader
        title={typeMeta ? `${typeMeta.label}${fixedType === 'invoice' ? 's / Bills' : 's'}` : 'Documents'}
        description={typeMeta?.description ?? 'Quotations, estimates and invoices — independent from Wedding Quote.'}
        actions={
          canCreate && (typeMeta ? (
            <Button as={Link} to={`/CRM/documents/new?type=${typeMeta.value}`} icon={Plus}>New {typeMeta.label}</Button>
          ) : (
            <Dropdown
              align="right"
              trigger={({ toggle }) => (
                <Button icon={Plus} onClick={toggle}>
                  New document
                </Button>
              )}
            >
              {DOCUMENT_TYPE_OPTIONS.map((option) => (
                <DropdownItem
                  key={option.value}
                  as={Link}
                  to={`/CRM/documents/new?type=${option.value}`}
                  icon={FileText}
                >
                  {option.label}
                </DropdownItem>
              ))}
            </Dropdown>
          ))
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Invoiced"
          value={formatCompactCurrency(stats?.invoiced ?? 0)}
          icon={FileText}
          loading={!stats}
        />
        <StatCard
          label="Collected"
          value={formatCompactCurrency(stats?.collected ?? 0)}
          icon={Wallet}
          accent="success"
          loading={!stats}
        />
        <StatCard
          label="Outstanding"
          value={formatCompactCurrency(stats?.outstanding ?? 0)}
          icon={IndianRupee}
          accent="warning"
          loading={!stats}
        />
        <StatCard
          label="Overdue"
          value={formatCompactCurrency(stats?.overdue?.amount ?? 0)}
          hint={`${stats?.overdue?.count ?? 0} invoice${stats?.overdue?.count === 1 ? '' : 's'}`}
          icon={AlertTriangle}
          accent="danger"
          loading={!stats}
        />
      </div>

      {!fixedType && <Tabs tabs={TYPE_TABS} value={query.type ?? ''} onChange={(value) => setFilter('type', value)} className="mb-5" />}

      <Toolbar>
        <SearchInput
          value={query.search}
          onChange={setSearch}
          placeholder="Search by number, client or item…"
          className="w-full sm:max-w-sm"
        />
        <Select
          value={query.status ?? ''}
          onChange={(event) => setFilter('status', event.target.value)}
          options={STATUS_OPTIONS}
          placeholder="All statuses"
          wrapperClassName="w-full sm:w-48"
        />
        <Button
          variant={query.overdue ? 'primary' : 'secondary'}
          icon={AlertTriangle}
          onClick={() => setFilter('overdue', query.overdue ? '' : 'true')}
        >
          Overdue only
        </Button>
      </Toolbar>

      <DataTable
        columns={columns}
        rows={documents}
        loading={loading}
        meta={meta}
        sort={sort}
        onSortChange={setSort}
        onPageChange={setPage}
        onLimitChange={setLimit}
        empty={
          hasFilters ? (
            <EmptyState
              icon={FileText}
              title="No documents match those filters"
              description="Try a different search term or clear the filters."
            />
          ) : (
            <EmptyState
              icon={FileText}
              title={`No ${typeMeta?.label.toLowerCase() ?? 'documents'} yet`}
              description={typeMeta ? `Create your first ${typeMeta.label.toLowerCase()} with the original document builder.` : 'Create a quotation, estimate or bill with the original document builder.'}
              action={
                canCreate && (
                  <Button as={Link} to={`/CRM/documents/new?type=${fixedType || 'quotation'}`} icon={Plus}>
                    Create {typeMeta ? `a ${typeMeta.label.toLowerCase()}` : 'a quotation'}
                  </Button>
                )
              }
            />
          )
        }
      />

      <ConfirmDialog
        open={Boolean(confirming)}
        onClose={() => setConfirming(null)}
        onConfirm={handleDelete}
        loading={saving}
        title={`Delete ${confirming?.number}?`}
        message="Only drafts are deleted outright. An issued document is cancelled instead, so your numbering stays auditable."
        confirmLabel="Delete document"
      />
    </>
  );
};

export default Documents;
