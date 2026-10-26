import { useEffect, useMemo, useState } from 'react';
import { KeyRound, Pencil, Plus, ShieldCheck, Trash2, UserRound } from 'lucide-react';
import toast from 'react-hot-toast';

import { authApi } from '@/api/authApi';
import { Avatar, Badge, Button, Card, CardBody, ConfirmDialog, EmptyState, Input, Modal, PageHeader, Select, Switch } from '@/components/ui';
import { PERMISSIONS, ROLE_OPTIONS, ROLES } from '@/constants';
import { useAuth } from '@/hooks/useAuth';
import { humanize } from '@/utils/format';

const blankMember = { name: '', email: '', password: '', phone: '', designation: '', role: ROLES.MANAGER, isActive: true, permissions: [], permissionsCustomized: false };

export const TeamAccess = () => {
  const { user: currentUser, isPlatformAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [config, setConfig] = useState(null);
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const load = async () => {
    try {
      const [team, access] = await Promise.all([authApi.listUsers(), authApi.getAccessConfig()]);
      setUsers(team.users ?? []);
      setConfig(access);
    } catch (error) {
      toast.error(error?.response?.data?.message ?? 'Could not load team access');
    }
  };

  useEffect(() => { load(); }, []);

  // The API decides which roles this actor may assign. Keeping this list
  // server-driven prevents a business admin from exposing Super Admin through
  // a client-side state change.
  const roleOptions = (config?.roles ?? []).map((role) => (
    ROLE_OPTIONS.find((option) => option.value === role)
    ?? { value: role, label: humanize(role) }
  ));
  const effectiveDraftPermissions = useMemo(() => {
    if (!draft || !config) return [];
    const selected = draft.permissionsCustomized ? draft.permissions : (config.defaults?.[draft.role] ?? []);
    return [...new Set([PERMISSIONS.DASHBOARD_VIEW, ...selected])];
  }, [config, draft]);

  const openCreate = () => setDraft({ ...blankMember, permissions: config?.defaults?.[ROLES.MANAGER] ?? [] });
  const openEdit = (member) => setDraft({
    _id: member._id, name: member.name ?? '', email: member.email ?? '', phone: member.phone ?? '',
    designation: member.designation ?? '', role: member.role, isActive: member.isActive !== false,
    permissions: member.permissionsCustomized ? (member.permissions ?? []) : (config?.defaults?.[member.role] ?? []),
    permissionsCustomized: Boolean(member.permissionsCustomized),
  });

  const changeRole = (role) => setDraft((value) => ({ ...value, role, permissions: config?.defaults?.[role] ?? [], permissionsCustomized: false }));
  const togglePermission = (permission) => setDraft((value) => {
    const source = value.permissionsCustomized ? value.permissions : (config?.defaults?.[value.role] ?? []);
    const next = source.includes(permission) ? source.filter((item) => item !== permission) : [...source, permission];
    return { ...value, permissions: next, permissionsCustomized: true };
  });

  const save = async () => {
    if (!draft.name.trim() || !draft.email.trim() || (!draft._id && draft.password.length < 8)) {
      toast.error('Name, email and an 8 character password are required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: draft.name.trim(), email: draft.email.trim(), phone: draft.phone, designation: draft.designation,
        role: draft.role, permissions: draft.permissionsCustomized ? draft.permissions : [],
        permissionsCustomized: draft.permissionsCustomized,
        ...(!draft._id ? { password: draft.password } : { isActive: draft.isActive }),
      };
      if (draft._id) await authApi.updateUser(draft._id, payload);
      else await authApi.register(payload);
      toast.success(draft._id ? 'Team member updated' : 'Login created');
      setDraft(null);
      await load();
    } catch (error) {
      toast.error(error?.response?.data?.message ?? 'Could not save team member');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setSaving(true);
    try {
      await authApi.deleteUser(deleting._id);
      toast.success('Team member removed');
      setDeleting(null);
      await load();
    } catch (error) {
      toast.error(error?.response?.data?.message ?? 'Could not remove team member');
    } finally { setSaving(false); }
  };

  return (
    <>
      <PageHeader title="Team & Permissions" description="Create separate logins and decide exactly what each person can view or change."
        actions={<Button icon={Plus} onClick={openCreate}>Add login</Button>} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {users.map((member) => {
          const canEditOwner = isPlatformAdmin || member.role !== ROLES.SUPER_ADMIN;
          const isSelf = String(member._id) === String(currentUser?._id);
          return (
            <Card key={member._id}>
              <CardBody>
                <div className="flex items-start gap-3">
                  <Avatar name={member.name} src={member.avatar?.url} size="lg" rounded="xl" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate font-semibold text-ink-900">{member.name}</h2>
                      {isSelf && <Badge tone="brand" size="sm">You</Badge>}
                    </div>
                    <p className="truncate text-sm text-ink-500">{member.email}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge tone={member.role === ROLES.SUPER_ADMIN ? 'warning' : 'neutral'}>{humanize(member.role)}</Badge>
                      <Badge tone={member.isActive ? 'success' : 'danger'} dot>{member.isActive ? 'Active' : 'Disabled'}</Badge>
                      {member.permissionsCustomized && <Badge tone="info">Custom access</Badge>}
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex gap-2 border-t border-ink-100 pt-4">
                  <Button variant="secondary" size="sm" icon={Pencil} onClick={() => openEdit(member)} disabled={!canEditOwner}>Edit access</Button>
                  {!isSelf && <Button variant="danger-soft" size="sm" iconOnly icon={Trash2} aria-label={`Remove ${member.name}`} onClick={() => setDeleting(member)} disabled={!canEditOwner} />}
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>
      {!users.length && <Card><EmptyState icon={UserRound} title="No team members" description="Create a login to start sharing the workspace." /></Card>}

      <Modal open={Boolean(draft)} onClose={() => setDraft(null)} size="2xl" title={draft?._id ? 'Edit login & access' : 'Create team login'}
        description="Role gives a safe starting point. Turn any permission on or off for this person."
        footer={<><Button variant="secondary" onClick={() => setDraft(null)}>Cancel</Button><Button icon={ShieldCheck} loading={saving} onClick={save}>{draft?._id ? 'Save access' : 'Create login'}</Button></>}>
        {draft && <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Full name" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
            <Input label="Email" type="email" value={draft.email} disabled={Boolean(draft._id)} onChange={(event) => setDraft({ ...draft, email: event.target.value })} />
            {!draft._id && <Input label="Temporary password" type="password" icon={KeyRound} value={draft.password} onChange={(event) => setDraft({ ...draft, password: event.target.value })} hint="At least 8 characters, with upper/lowercase and a number." />}
            <Select label="Role" value={draft.role} options={roleOptions} onChange={(event) => changeRole(event.target.value)} />
            <Input label="Phone" value={draft.phone} onChange={(event) => setDraft({ ...draft, phone: event.target.value })} />
            <Input label="Designation" value={draft.designation} onChange={(event) => setDraft({ ...draft, designation: event.target.value })} />
          </div>
          {draft._id && <div className="rounded-xl bg-ink-50 p-4"><Switch label="Login active" description="Turn off to immediately block this account without deleting its history." checked={draft.isActive} disabled={String(draft._id) === String(currentUser?._id)} onChange={(event) => setDraft({ ...draft, isActive: event.target.checked })} /></div>}

          <div>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div><h3 className="font-semibold text-ink-900">Permissions</h3><p className="text-sm text-ink-500">{draft.permissionsCustomized ? 'Custom permissions are active.' : `Using ${humanize(draft.role)} defaults.`}</p></div>
              {draft.permissionsCustomized && <Button variant="secondary" size="sm" onClick={() => setDraft({ ...draft, permissionsCustomized: false, permissions: config?.defaults?.[draft.role] ?? [] })}>Reset to role default</Button>}
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {config?.groups?.map((group) => <section key={group.key} className="rounded-2xl ring-1 ring-ink-200/80">
                <h4 className="border-b border-ink-100 px-4 py-3 text-sm font-semibold text-ink-800">{group.label}</h4>
                <div className="space-y-3 p-4">{group.permissions.map((permission) => <Switch key={permission.key} label={permission.label} checked={effectiveDraftPermissions.includes(permission.key)} disabled={draft.role === ROLES.SUPER_ADMIN || permission.key === PERMISSIONS.DASHBOARD_VIEW} onChange={() => togglePermission(permission.key)} />)}</div>
              </section>)}
            </div>
          </div>
        </div>}
      </Modal>

      <ConfirmDialog open={Boolean(deleting)} onClose={() => setDeleting(null)} onConfirm={remove} loading={saving}
        title={`Remove ${deleting?.name}?`} message="Their login will stop working. Existing activity history will stay available." confirmLabel="Remove login" />
    </>
  );
};

export default TeamAccess;
