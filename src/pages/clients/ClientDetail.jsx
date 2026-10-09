import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Archive,
  Building2,
  Calendar,
  Hash,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Receipt,
  StickyNote,
  Trash2,
  User,
} from 'lucide-react';
import toast from 'react-hot-toast';

import {
  Avatar,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  ConfirmDialog,
  PageHeader,
  PageLoader,
  StatusBadge,
} from '@/components/ui';
import {
  fetchClient,
  deleteClient,
  archiveClient,
  selectCurrentClient,
  selectClientLoading,
  selectClientSaving,
  clearCurrentClient,
} from '@/redux/client/clientSlice';
import { useAuth } from '@/hooks/useAuth';
import { CLIENT_STATUS_META, PERMISSIONS } from '@/constants';
import { formatAddress, formatDate, humanize } from '@/utils/format';
import { ClientFormModal } from './ClientFormModal';

/** Label/value row used throughout the detail cards. */
const DetailRow = ({ icon: Icon, label, value, href }) => (
  <div className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink-100 text-ink-500">
      <Icon className="h-4 w-4" aria-hidden="true" />
    </span>
    <div className="min-w-0 flex-1">
      <p className="text-xs text-ink-500">{label}</p>
      {value ? (
        href ? (
          <a href={href} className="text-base font-medium text-ink-900 hover:text-brand-600">
            {value}
          </a>
        ) : (
          <p className="text-pretty text-base font-medium text-ink-900">{value}</p>
        )
      ) : (
        <p className="text-base text-ink-400">Not provided</p>
      )}
    </div>
  </div>
);

export const ClientDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const client = useSelector(selectCurrentClient);
  const loading = useSelector(selectClientLoading);
  const saving = useSelector(selectClientSaving);
  const { can } = useAuth();
  const canEdit = can(PERMISSIONS.CLIENTS_EDIT);
  const canDelete = can(PERMISSIONS.CLIENTS_DELETE);

  const [editOpen, setEditOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchClient(id));
    return () => dispatch(clearCurrentClient());
  }, [dispatch, id]);

  const handleDelete = async () => {
    const result = await dispatch(deleteClient(id));
    if (deleteClient.fulfilled.match(result)) {
      toast.success('Client deleted');
      navigate('/CRM/clients', { replace: true });
    } else {
      toast.error(result.payload?.message ?? 'Could not delete');
      setConfirmOpen(false);
    }
  };

  const handleArchive = async () => {
    const result = await dispatch(archiveClient(id));
    if (archiveClient.fulfilled.match(result)) toast.success('Client archived');
  };

  if (loading && !client) return <PageLoader label="Loading client" />;

  if (!client) {
    return (
      <Card>
        <CardBody className="py-16 text-center">
          <p className="text-md text-ink-500">This client could not be found.</p>
          <Button as={Link} to="/CRM/clients" variant="secondary" className="mt-5">
            Back to clients
          </Button>
        </CardBody>
      </Card>
    );
  }

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: 'Clients', to: '/clients' }, { label: client.name }]}
        title={client.name}
        description={client.contactPerson ? `Primary contact · ${client.contactPerson}` : undefined}
        actions={
          (canEdit || canDelete) && (
            <>
              {canEdit && client.status !== 'archived' && (
                <Button variant="secondary" icon={Archive} onClick={handleArchive} loading={saving}>
                  Archive
                </Button>
              )}
              {canEdit && <Button variant="secondary" icon={Pencil} onClick={() => setEditOpen(true)}>Edit</Button>}
              {canDelete && <Button variant="danger-soft" icon={Trash2} onClick={() => setConfirmOpen(true)}>Delete</Button>}
            </>
          )
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex min-w-0 items-center gap-4">
                <Avatar name={client.name} size="xl" rounded="xl" />
                <div className="min-w-0">
                  <CardTitle className="truncate">{client.name}</CardTitle>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <StatusBadge status={client.status} meta={CLIENT_STATUS_META} />
                    <Badge tone="neutral">{humanize(client.type)}</Badge>
                    <Badge tone="neutral">via {humanize(client.source)}</Badge>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardBody className="divide-y divide-ink-200/60">
              <DetailRow
                icon={User}
                label="Contact person"
                value={client.contactPerson}
              />
              <DetailRow
                icon={Mail}
                label="Email"
                value={client.email}
                href={client.email ? `mailto:${client.email}` : undefined}
              />
              <DetailRow
                icon={Phone}
                label="Phone"
                value={client.phone}
                href={client.phone ? `tel:${client.phone}` : undefined}
              />
              {client.alternatePhone && (
                <DetailRow
                  icon={Phone}
                  label="Alternate phone"
                  value={client.alternatePhone}
                  href={`tel:${client.alternatePhone}`}
                />
              )}
              <DetailRow
                icon={MapPin}
                label="Address"
                value={formatAddress(client.address)}
              />
            </CardBody>
          </Card>

          {client.notes && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <StickyNote className="h-4.5 w-4.5 text-brand-500" aria-hidden="true" />
                  <CardTitle>Internal notes</CardTitle>
                </div>
              </CardHeader>
              <CardBody>
                <p className="whitespace-pre-wrap text-pretty text-base leading-relaxed text-ink-700">
                  {client.notes}
                </p>
              </CardBody>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-md">Business details</CardTitle>
            </CardHeader>
            <CardBody className="divide-y divide-ink-200/60">
              <DetailRow icon={Receipt} label="GSTIN" value={client.gstin} />
              <DetailRow icon={Hash} label="PAN" value={client.pan} />
              <DetailRow icon={Building2} label="Place of supply" value={client.placeOfSupply} />
              <DetailRow icon={Calendar} label="Client since" value={formatDate(client.createdAt)} />
            </CardBody>
          </Card>

          {client.tags?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-md">Tags</CardTitle>
              </CardHeader>
              <CardBody>
                <div className="flex flex-wrap gap-2">
                  {client.tags.map((tag) => (
                    <Badge key={tag} tone="brand">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      </div>

      <ClientFormModal open={editOpen} onClose={() => setEditOpen(false)} client={client} />

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
        loading={saving}
        title={`Delete ${client.name}?`}
        message="This permanently removes the client. Clients with documents cannot be deleted — archive them instead."
        confirmLabel="Delete client"
      />
    </>
  );
};

export default ClientDetail;
