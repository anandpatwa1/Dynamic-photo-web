import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Building2,
  CalendarClock,
  ExternalLink,
  Globe2,
  KeyRound,
  Pencil,
  Plus,
  Power,
  SearchX,
  ShieldCheck,
  Users,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { businessApi } from '@/api/businessApi';
import { parseApiError, tokenStore } from '@/api/axios';
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardSkeleton,
  ConfirmDialog,
  EmptyState,
  Input,
  Modal,
  PageHeader,
  Pagination,
  SearchInput,
  Select,
  StatusBadge,
  Switch,
  Textarea,
} from '@/components/ui';
import { CRM } from '@/routes/paths';
import { formatDate, humanize, toDateInputValue } from '@/utils/format';

const STATUS_META = {
  active: { label: 'Active', tone: 'success' },
  disabled: { label: 'Disabled', tone: 'danger' },
  expired: { label: 'Expired', tone: 'warning' },
  pending: { label: 'Starts later', tone: 'info' },
};

const ACCESS_OPTIONS = [
  { value: 'unlimited', label: 'Unlimited access' },
  { value: 'time_limited', label: 'Time-limited access' },
];

const EXPIRY_OPTIONS = [
  { value: 'live_read_only', label: 'Keep public site live (read only)' },
  { value: 'maintenance', label: 'Show maintenance page' },
];

const STATUS_FILTERS = [
  { value: '', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'disabled', label: 'Disabled' },
  { value: 'expired', label: 'Expired' },
];

const GB = 1024 ** 3;

const emptyForm = (features = []) => ({
  name: '',
  slug: '',
  details: '',
  adminName: '',
  adminEmail: '',
  password: '',
  status: 'active',
  accessType: 'unlimited',
  startsAt: '',
  expiresAt: '',
  expiryPublicPolicy: 'live_read_only',
  primaryDomain: '',
  allowedOrigins: '',
  storageLimitGb: '',
  enabledFeatures: features,
});

const formFromBusiness = (business) => ({
  ...emptyForm(business.enabledFeatures ?? []),
  name: business.name ?? '',
  slug: business.slug ?? '',
  details: business.details ?? '',
  status: business.status ?? 'active',
  accessType: business.accessType ?? 'unlimited',
  startsAt: toDateInputValue(business.startsAt),
  expiresAt: toDateInputValue(business.expiresAt),
  expiryPublicPolicy: business.expiryPublicPolicy ?? 'live_read_only',
  primaryDomain: business.primaryDomain ?? '',
  allowedOrigins: (business.allowedOrigins ?? []).join('\n'),
  storageLimitGb: business.storageLimitBytes == null
    ? ''
    : String(Math.round((business.storageLimitBytes / GB) * 100) / 100),
});

const slugify = (value = '') => value
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

const localDateIso = (value, endOfDay = false) => {
  if (!value) return undefined;
  const time = endOfDay ? '23:59:59.999' : '00:00:00.000';
  return new Date(`${value}T${time}`).toISOString();
};

const fieldErrorsFrom = (error) => Object.fromEntries(
  (parseApiError(error).errors ?? []).filter((entry) => entry.field).map((entry) => [entry.field, entry.message]),
);

const FeaturePicker = ({ catalog = [], selected, onChange }) => {
  const groups = useMemo(() => catalog.reduce((result, feature) => {
    const group = feature.group || 'Other';
    result[group] = [...(result[group] ?? []), feature];
    return result;
  }, {}), [catalog]);

  const toggle = (key) => onChange(
    selected.includes(key) ? selected.filter((item) => item !== key) : [...selected, key],
  );

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {Object.entries(groups).map(([group, features]) => (
        <section key={group} className="rounded-2xl border border-ink-200/80 bg-white">
          <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3">
            <h4 className="text-sm font-semibold text-ink-800">{group}</h4>
            <button
              type="button"
              className="text-xs font-medium text-brand-600 hover:text-brand-700"
              onClick={() => {
                const keys = features.map((feature) => feature.key);
                const allSelected = keys.every((key) => selected.includes(key));
                onChange(allSelected
                  ? selected.filter((key) => !keys.includes(key))
                  : [...new Set([...selected, ...keys])]);
              }}
            >
              {features.every((feature) => selected.includes(feature.key)) ? 'Clear' : 'Enable all'}
            </button>
          </div>
          <div className="space-y-3 p-4">
            {features.map((feature) => (
              <Switch
                key={feature.key}
                label={feature.label}
                checked={selected.includes(feature.key)}
                onChange={() => toggle(feature.key)}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};

const BusinessFormModal = ({ open, onClose, business, config, onSaved }) => {
  const editing = Boolean(business);
  const allFeatures = useMemo(() => (config?.features ?? []).map((feature) => feature.key), [config]);
  const [form, setForm] = useState(() => emptyForm(allFeatures));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(editing ? formFromBusiness(business) : emptyForm(allFeatures));
    setErrors({});
  }, [allFeatures, business, editing, open]);

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const submit = async () => {
    setSaving(true);
    setErrors({});
    const payload = {
      name: form.name,
      details: form.details,
      accessType: form.accessType,
      startsAt: form.startsAt ? localDateIso(form.startsAt) : null,
      expiresAt: form.accessType === 'time_limited'
        ? (form.expiresAt ? localDateIso(form.expiresAt, true) : null)
        : null,
      expiryPublicPolicy: form.expiryPublicPolicy,
      enabledFeatures: form.enabledFeatures,
      primaryDomain: form.primaryDomain,
      allowedOrigins: form.allowedOrigins.split(/\r?\n|,/).map((item) => item.trim()).filter(Boolean),
      storageLimitBytes: form.storageLimitGb === '' ? null : Math.round(Number(form.storageLimitGb) * GB),
    };
    if (!editing) Object.assign(payload, {
      slug: form.slug,
      adminName: form.adminName,
      adminEmail: form.adminEmail,
      password: form.password,
      status: form.status,
    });

    try {
      if (editing) await businessApi.update(business._id, payload);
      else await businessApi.create(payload);
      toast.success(editing ? 'Business updated' : 'Business and primary login created');
      onSaved();
      onClose();
    } catch (error) {
      const parsed = parseApiError(error);
      setErrors(fieldErrorsFrom(error));
      toast.error(parsed.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={saving ? undefined : onClose}
      closeOnBackdrop={!saving}
      size="2xl"
      title={editing ? `Edit ${business.name}` : 'Add a business'}
      description={editing
        ? 'Update access, domains and product features. The permanent URL identifier stays unchanged.'
        : 'Create an isolated workspace and its first admin login.'}
      footer={(
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={submit} loading={saving}>{editing ? 'Save changes' : 'Create business'}</Button>
        </>
      )}
    >
      <div className="space-y-7">
        <section>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-ink-500">Business identity</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Business name"
              required
              value={form.name}
              error={errors.name}
              onChange={(event) => {
                const name = event.target.value;
                setForm((current) => ({
                  ...current,
                  name,
                  ...(!editing && (!current.slug || current.slug === slugify(current.name))
                    ? { slug: slugify(name) }
                    : {}),
                }));
              }}
            />
            <Input
              label="Workspace URL"
              required={!editing}
              value={form.slug}
              error={errors.slug}
              readOnly={editing}
              prefix="/"
              hint={editing ? 'Permanent after creation' : 'Used in the customer website API URL'}
              onChange={(event) => update('slug', slugify(event.target.value))}
            />
            <Textarea
              label="Internal details"
              optional
              rows={3}
              wrapperClassName="sm:col-span-2"
              value={form.details}
              error={errors.details}
              onChange={(event) => update('details', event.target.value)}
            />
          </div>
        </section>

        {!editing && (
          <section>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-ink-500">Primary login</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Input label="Admin name" required value={form.adminName} error={errors.adminName} onChange={(event) => update('adminName', event.target.value)} />
              <Input label="Admin email" required type="email" value={form.adminEmail} error={errors.adminEmail} onChange={(event) => update('adminEmail', event.target.value)} />
              <Input label="Temporary password" required type="password" autoComplete="new-password" value={form.password} error={errors.password} onChange={(event) => update('password', event.target.value)} />
            </div>
          </section>
        )}

        <section>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-ink-500">Access and expiry</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {!editing && <Select label="Initial status" value={form.status} options={(config?.statuses ?? []).map((value) => ({ value, label: humanize(value) }))} onChange={(event) => update('status', event.target.value)} />}
            <Select label="Access period" value={form.accessType} options={ACCESS_OPTIONS} onChange={(event) => update('accessType', event.target.value)} />
            <Input label="Starts on" optional type="date" value={form.startsAt} error={errors.startsAt} onChange={(event) => update('startsAt', event.target.value)} />
            {form.accessType === 'time_limited' && (
              <Input label="Expires at end of" required type="date" value={form.expiresAt} error={errors.expiresAt} onChange={(event) => update('expiresAt', event.target.value)} />
            )}
            <Select label="After expiry" value={form.expiryPublicPolicy} options={EXPIRY_OPTIONS} onChange={(event) => update('expiryPublicPolicy', event.target.value)} wrapperClassName="sm:col-span-2 lg:col-span-1" />
            <Input label="Storage limit" optional type="number" min="0" step="0.25" suffix="GB" value={form.storageLimitGb} error={errors.storageLimitBytes} onChange={(event) => update('storageLimitGb', event.target.value)} />
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-ink-500">Website connection</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Primary domain" optional placeholder="studio.example.com" value={form.primaryDomain} error={errors.primaryDomain} onChange={(event) => update('primaryDomain', event.target.value)} />
            <Textarea label="Allowed website origins" optional rows={3} placeholder={'https://studio.example.com\nhttps://studio.vercel.app'} hint="One complete origin per line; no paths" value={form.allowedOrigins} error={errors.allowedOrigins} onChange={(event) => update('allowedOrigins', event.target.value)} />
          </div>
        </section>

        <section>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-ink-500">Enabled product features</h3>
              <p className="mt-1 text-sm text-ink-500">Customer permissions are checked separately inside each enabled feature.</p>
            </div>
            <Badge tone="brand">{form.enabledFeatures.length} enabled</Badge>
          </div>
          <FeaturePicker catalog={config?.features} selected={form.enabledFeatures} onChange={(value) => update('enabledFeatures', value)} />
        </section>
      </div>
    </Modal>
  );
};

const CredentialsModal = ({ business, onClose, onSaved }) => {
  const [form, setForm] = useState({
    name: business?.primaryAdmin?.name ?? '',
    email: business?.primaryAdmin?.email ?? '',
    isActive: business?.primaryAdmin?.isActive ?? true,
    newPassword: '',
    confirmPassword: '',
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!business) return;
    setForm({
      name: business.primaryAdmin?.name ?? '',
      email: business.primaryAdmin?.email ?? '',
      isActive: business.primaryAdmin?.isActive ?? true,
      newPassword: '',
      confirmPassword: '',
    });
    setErrors({});
  }, [business]);

  const submit = async () => {
    if (form.newPassword && form.newPassword !== form.confirmPassword) {
      setErrors({ confirmPassword: 'Passwords do not match' });
      return;
    }
    setSaving(true);
    setErrors({});
    try {
      await businessApi.updatePrimaryAdmin(business._id, {
        name: form.name,
        email: form.email,
        isActive: form.isActive,
      });
      if (form.newPassword) {
        await businessApi.resetPassword(business._id, { newPassword: form.newPassword });
      }
      toast.success(form.newPassword ? 'Login updated, password reset and sessions revoked' : 'Primary login updated');
      onSaved();
      onClose();
    } catch (error) {
      const parsed = parseApiError(error);
      setErrors(fieldErrorsFrom(error));
      toast.error(parsed.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={Boolean(business)}
      onClose={saving ? undefined : onClose}
      closeOnBackdrop={!saving}
      title="Primary login"
      description={business ? `Manage the owner login for ${business.name}. Passwords are never displayed.` : undefined}
      footer={(
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={submit} loading={saving}>Save login</Button>
        </>
      )}
    >
      <div className="space-y-4">
        <Input label="Admin name" required value={form.name} error={errors.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        <Input label="Login email" required type="email" value={form.email} error={errors.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
        <Switch label="Login is active" description="Turning this off immediately blocks this account." checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} />
        <div className="border-t border-ink-200/70 pt-4">
          <p className="mb-3 text-sm font-semibold text-ink-800">Reset password</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="New password" optional type="password" autoComplete="new-password" value={form.newPassword} error={errors.newPassword} onChange={(event) => setForm({ ...form, newPassword: event.target.value })} />
            <Input label="Confirm password" optional type="password" autoComplete="new-password" value={form.confirmPassword} error={errors.confirmPassword} onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })} />
          </div>
          <p className="mt-2 text-xs leading-relaxed text-ink-500">Setting a new password signs this account out from all existing sessions.</p>
        </div>
      </div>
    </Modal>
  );
};

const BusinessCard = ({ business, onEdit, onCredentials, onStatus, onSupport }) => {
  const accessState = business.accessState ?? business.status;
  const featureCount = business.enabledFeatures?.length ?? 0;
  const isActive = business.status === 'active' && accessState !== 'expired';

  return (
    <Card className="overflow-hidden">
      <CardBody className="space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-100">
              <Building2 className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-lg font-semibold text-ink-900">{business.name}</h2>
                {business.isDefault && <Badge size="sm" tone="brand">Default</Badge>}
              </div>
              <p className="mt-0.5 truncate font-mono text-xs text-ink-500">/api/v1/{business.slug}</p>
            </div>
          </div>
          <StatusBadge status={accessState} meta={STATUS_META} />
        </div>

        {business.details && <p className="line-clamp-2 text-sm leading-relaxed text-ink-600">{business.details}</p>}

        <dl className="grid grid-cols-2 gap-x-4 gap-y-4 border-y border-ink-100 py-4 text-sm sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
          <div>
            <dt className="flex items-center gap-1.5 text-xs text-ink-500"><Users className="h-3.5 w-3.5" /> Team</dt>
            <dd className="mt-1 font-medium text-ink-800">{business.userCount} login{business.userCount === 1 ? '' : 's'}</dd>
          </div>
          <div>
            <dt className="flex items-center gap-1.5 text-xs text-ink-500"><ShieldCheck className="h-3.5 w-3.5" /> Features</dt>
            <dd className="mt-1 font-medium text-ink-800">{featureCount} enabled</dd>
          </div>
          <div>
            <dt className="flex items-center gap-1.5 text-xs text-ink-500"><CalendarClock className="h-3.5 w-3.5" /> Access</dt>
            <dd className="mt-1 font-medium text-ink-800">{business.accessType === 'unlimited' ? 'Unlimited' : `Until ${formatDate(business.expiresAt)}`}</dd>
          </div>
          <div>
            <dt className="flex items-center gap-1.5 text-xs text-ink-500"><Globe2 className="h-3.5 w-3.5" /> Domain</dt>
            <dd className="mt-1 truncate font-medium text-ink-800">{business.primaryDomain || 'Not connected'}</dd>
          </div>
        </dl>

        <div className="min-w-0 rounded-xl bg-ink-50 px-3.5 py-3">
          <p className="text-xs font-medium text-ink-500">Primary admin</p>
          <p className="mt-1 truncate text-sm font-medium text-ink-800">{business.primaryAdmin?.name || 'No login linked'}</p>
          <p className="truncate text-xs text-ink-500">{business.primaryAdmin?.email || '—'}</p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <Button size="sm" variant="secondary" icon={Pencil} onClick={() => onEdit(business)}>Edit</Button>
          <Button size="sm" variant="secondary" icon={KeyRound} onClick={() => onCredentials(business)}>Login</Button>
          <Button
            size="sm"
            variant={isActive ? 'danger-soft' : 'subtle'}
            icon={Power}
            onClick={() => onStatus(business, isActive ? 'disabled' : 'active')}
          >
            {isActive ? 'Disable' : 'Activate'}
          </Button>
          {business.status !== 'expired' && (
            <Button size="sm" variant="secondary" icon={CalendarClock} onClick={() => onStatus(business, 'expired')}>
              Expire
            </Button>
          )}
          <Button size="sm" variant="dark" icon={ExternalLink} onClick={() => onSupport(business)}>Open workspace</Button>
        </div>
      </CardBody>
    </Card>
  );
};

export const BusinessManagement = () => {
  const [businesses, setBusinesses] = useState([]);
  const [config, setConfig] = useState(null);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState({ search: '', status: '', page: 1, limit: 20 });
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [credentials, setCredentials] = useState(null);
  const [statusChange, setStatusChange] = useState(null);
  const [statusSaving, setStatusSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await businessApi.list(query);
      setBusinesses(result.data?.businesses ?? []);
      setMeta(result.meta);
    } catch (error) {
      toast.error(parseApiError(error).message);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    businessApi.config().then(setConfig).catch((error) => toast.error(parseApiError(error).message));
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (business) => {
    setEditing(business);
    setFormOpen(true);
  };

  const requestStatus = (business, status) => setStatusChange({ business, status });

  const updateStatus = async () => {
    setStatusSaving(true);
    try {
      await businessApi.updateStatus(statusChange.business._id, { status: statusChange.status });
      toast.success(`${statusChange.business.name} ${statusChange.status === 'active' ? 'activated' : statusChange.status}`);
      setStatusChange(null);
      load();
    } catch (error) {
      toast.error(parseApiError(error).message);
    } finally {
      setStatusSaving(false);
    }
  };

  const openSupport = (business) => {
    tokenStore.setBusinessContext(business.slug);
    window.location.assign(CRM.dashboard);
  };

  const setSearch = useCallback((search) => setQuery((current) => ({ ...current, search, page: 1 })), []);

  return (
    <>
      <PageHeader
        title="Businesses"
        description="Create isolated customer workspaces, control access and open a tenant-safe support view."
        actions={<Button icon={Plus} onClick={openCreate}>Add business</Button>}
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_190px]">
        <SearchInput value={query.search} onChange={setSearch} placeholder="Search business, URL or domain" />
        <Select
          aria-label="Filter by status"
          value={query.status}
          options={STATUS_FILTERS}
          onChange={(event) => setQuery((current) => ({ ...current, status: event.target.value, page: 1 }))}
        />
      </div>

      {loading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => <CardSkeleton key={index} className="h-80" />)}
        </div>
      ) : businesses.length ? (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            {businesses.map((business) => (
              <BusinessCard
                key={business._id}
                business={business}
                onEdit={openEdit}
                onCredentials={setCredentials}
                onStatus={requestStatus}
                onSupport={openSupport}
              />
            ))}
          </div>
          <Card className="mt-5 overflow-hidden">
            <Pagination
              meta={meta}
              onPageChange={(page) => setQuery((current) => ({ ...current, page }))}
              onLimitChange={(limit) => setQuery((current) => ({ ...current, limit, page: 1 }))}
            />
          </Card>
        </>
      ) : (
        <Card>
          <EmptyState
            icon={query.search || query.status ? SearchX : Building2}
            title={query.search || query.status ? 'No businesses match these filters' : 'Add your first business'}
            description={query.search || query.status ? 'Clear the search or choose another status.' : 'Each business gets isolated data, its own public website URL and a primary admin login.'}
            actionLabel={query.search || query.status ? undefined : 'Add business'}
            actionIcon={Plus}
            onAction={query.search || query.status ? undefined : openCreate}
          />
        </Card>
      )}

      <BusinessFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        business={editing}
        config={config}
        onSaved={load}
      />
      <CredentialsModal business={credentials} onClose={() => setCredentials(null)} onSaved={load} />
      <ConfirmDialog
        open={Boolean(statusChange)}
        onClose={() => setStatusChange(null)}
        onConfirm={updateStatus}
        loading={statusSaving}
        tone={statusChange?.status === 'disabled' ? 'danger' : 'warning'}
        title={`${statusChange?.status === 'disabled' ? 'Disable' : statusChange?.status === 'expired' ? 'Expire' : 'Activate'} ${statusChange?.business?.name ?? 'business'}?`}
        message={statusChange?.status === 'disabled'
          ? 'All customer logins will be blocked immediately. Public website behavior follows the configured access policy.'
          : statusChange?.status === 'expired'
            ? 'Customer logins will stop and the configured public expiry policy will apply immediately.'
            : 'Customer logins and enabled features will become available again.'}
        confirmLabel={statusChange?.status === 'disabled' ? 'Disable business' : statusChange?.status === 'expired' ? 'Expire business' : 'Activate business'}
      />
    </>
  );
};

export default BusinessManagement;
