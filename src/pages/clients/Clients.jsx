import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  Archive,
  Building2,
  Mail,
  MoreHorizontal,
  Pencil,
  Phone,
  Plus,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react';
import toast from 'react-hot-toast';

import {
  Avatar,
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
  Toolbar,
} from '@/components/ui';
import {
  fetchClients,
  fetchClientStats,
  deleteClient,
  archiveClient,
  selectClients,
  selectClientsMeta,
  selectClientsLoading,
  selectClientStats,
  selectClientSaving,
} from '@/redux/client/clientSlice';
import { useListQuery } from '@/hooks/useListQuery';
import { useAuth } from '@/hooks/useAuth';
import { CLIENT_STATUS_META, statusOptions } from '@/constants';
import { CLIENT_SOURCE_OPTIONS } from '@/validations/client.schema';
import { formatDate, humanize, truncate } from '@/utils/format';
import { ClientFormModal } from './ClientFormModal';

const STATUS_FILTER_OPTIONS = statusOptions(CLIENT_STATUS_META);

export const Clients = () => {
  const dispatch = useDispatch();
  const clients = useSelector(selectClients);
  const meta = useSelector(selectClientsMeta);
  const loading = useSelector(selectClientsLoading);
  const stats = useSelector(selectClientStats);
  const saving = useSelector(selectClientSaving);
  const { canManage } = useAuth();

  const { params, query, sort, setPage, setLimit, setSearch, setSort, setFilter } = useListQuery({
    sortBy: 'createdAt',
  });

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirming, setConfirming] = useState(null);

  useEffect(() => {
    dispatch(fetchClients(params));
  }, [dispatch, params]);

  useEffect(() => {
    dispatch(fetchClientStats());
  }, [dispatch]);

  const refresh = useCallback(() => {
    dispatch(fetchClients(params));
    dispatch(fetchClientStats());
  }, [dispatch, params]);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (client) => {
    setEditing(client);
    setFormOpen(true);
  };

  const handleArchive = async (client) => {
    const result = await dispatch(archiveClient(client._id));
    if (archiveClient.fulfilled.match(result)) toast.success(`${client.name} archived`);
    else toast.error(result.payload?.message ?? 'Could not archive');
  };

  const handleDelete = async () => {
    const result = await dispatch(deleteClient(confirming._id));
    if (deleteClient.fulfilled.match(result)) {
      toast.success('Client deleted');
      setConfirming(null);
      dispatch(fetchClientStats());
    } else {
      // Deleting is refused when documents exist — surface exactly why.
      toast.error(result.payload?.message ?? 'Could not delete');
      setConfirming(null);
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'Client',
      sortable: true,
      render: (client) => (
        <div className="flex items-center gap-3">
          <Avatar name={client.name} size="md" rounded="xl" />
          <div className="min-w-0">
            <Link
              to={`/CRM/clients/${client._id}`}
              className="block truncate font-medium text-ink-900 hover:text-brand-600"
            >
              {client.name}
            </Link>
            <p className="truncate text-sm text-ink-500">
              {client.contactPerson || humanize(client.type)}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'Contact',
      render: (client) => (
        <div className="space-y-1">
          {client.email && (
            <a
              href={`mailto:${client.email}`}
              onClick={(event) => event.stopPropagation()}
              className="flex items-center gap-1.5 text-sm text-ink-600 hover:text-brand-600"
            >
              <Mail className="h-3.5 w-3.5 shrink-0 text-ink-400" aria-hidden="true" />
              {truncate(client.email, 28)}
            </a>
          )}
          {client.phone && (
            <a
              href={`tel:${client.phone}`}
              onClick={(event) => event.stopPropagation()}
              className="flex items-center gap-1.5 text-sm text-ink-600 hover:text-brand-600"
            >
              <Phone className="h-3.5 w-3.5 shrink-0 text-ink-400" aria-hidden="true" />
              {client.phone}
            </a>
          )}
          {!client.email && !client.phone && <span className="text-ink-400">—</span>}
        </div>
      ),
    },
    {
      key: 'city',
      header: 'Location',
      render: (client) => client.address?.city || <span className="text-ink-400">—</span>,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (client) => <StatusBadge status={client.status} meta={CLIENT_STATUS_META} />,
    },
    {
      key: 'createdAt',
      header: 'Added',
      sortable: true,
      align: 'right',
      numeric: true,
      render: (client) => <span className="text-ink-500">{formatDate(client.createdAt)}</span>,
    },
    ...(canManage
      ? [
          {
            key: 'actions',
            header: '',
            width: 56,
            align: 'right',
            render: (client) => (
              <Dropdown
                trigger={({ toggle }) => (
                  <Button
                    variant="ghost"
                    size="sm"
                    iconOnly
                    icon={MoreHorizontal}
                    aria-label={`Actions for ${client.name}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      toggle();
                    }}
                  />
                )}
              >
                <DropdownItem icon={Pencil} onClick={() => openEdit(client)}>
                  Edit details
                </DropdownItem>
                <DropdownItem as={Link} to={`/CRM/clients/${client._id}`} icon={Building2}>
                  View profile
                </DropdownItem>
                <DropdownDivider />
                {client.status !== 'archived' && (
                  <DropdownItem icon={Archive} onClick={() => handleArchive(client)}>
                    Archive
                  </DropdownItem>
                )}
                <DropdownItem icon={Trash2} danger onClick={() => setConfirming(client)}>
                  Delete
                </DropdownItem>
              </Dropdown>
            ),
          },
        ]
      : []),
  ];

  const hasFilters = Boolean(query.search || query.status || query.source);

  return (
    <>
      <PageHeader
        title="Clients"
        description="Every brand, business and couple you work with."
        actions={
          canManage && (
            <Button icon={Plus} onClick={openCreate}>
              New client
            </Button>
          )
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total clients" value={stats?.total ?? 0} icon={Users} loading={!stats} />
        <StatCard
          label="Active"
          value={stats?.byStatus?.active ?? 0}
          icon={Building2}
          accent="success"
          loading={!stats}
        />
        <StatCard
          label="Leads"
          value={stats?.byStatus?.lead ?? 0}
          icon={UserPlus}
          accent="warning"
          loading={!stats}
        />
        <StatCard
          label="Added this month"
          value={stats?.addedThisMonth ?? 0}
          icon={Plus}
          accent="info"
          loading={!stats}
        />
      </div>

      <Toolbar>
        <SearchInput
          value={query.search}
          onChange={setSearch}
          placeholder="Search by name, email, phone or city…"
          className="w-full sm:max-w-sm"
        />
        <Select
          value={query.status ?? ''}
          onChange={(event) => setFilter('status', event.target.value)}
          options={STATUS_FILTER_OPTIONS}
          placeholder="All statuses"
          wrapperClassName="w-full sm:w-44"
        />
        <Select
          value={query.source ?? ''}
          onChange={(event) => setFilter('source', event.target.value)}
          options={CLIENT_SOURCE_OPTIONS}
          placeholder="All sources"
          wrapperClassName="w-full sm:w-44"
        />
      </Toolbar>

      <DataTable
        columns={columns}
        rows={clients}
        loading={loading}
        meta={meta}
        sort={sort}
        onSortChange={setSort}
        onPageChange={setPage}
        onLimitChange={setLimit}
        empty={
          hasFilters ? (
            <EmptyState
              icon={Users}
              title="No clients match those filters"
              description="Try a different search term or clear the filters."
            />
          ) : (
            <EmptyState
              icon={Users}
              title="No clients yet"
              description="Add your first client to start sending quotations and invoices."
              actionLabel={canManage ? 'Add your first client' : undefined}
              actionIcon={Plus}
              onAction={canManage ? openCreate : undefined}
            />
          )
        }
      />

      <ClientFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        client={editing}
        onSaved={refresh}
      />

      <ConfirmDialog
        open={Boolean(confirming)}
        onClose={() => setConfirming(null)}
        onConfirm={handleDelete}
        loading={saving}
        title={`Delete ${confirming?.name}?`}
        message="This permanently removes the client. Clients with documents cannot be deleted — archive them instead."
        confirmLabel="Delete client"
      />
    </>
  );
};

export default Clients;
