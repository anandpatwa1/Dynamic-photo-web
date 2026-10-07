import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Button, Card, CardBody, Input, PageHeader, Select, Skeleton, Tabs } from '@/components/ui';
import { PermissionGate } from '../../components/PermissionGate';
import { useWqPermissions } from '../../hooks/useWqPermissions';
import { wqMasters, wqSettingsApi } from '../../api/wqApi';
import { WQ_ACTIONS, WQ_ROLES } from '../../utils/engine/permissions';
import { T } from '../../constants/strings';
import { CRM } from '@/routes/paths';

const S = T.settings;

export const QuoteSettings = () => (
  <PermissionGate anyOf={['manageMasters', 'managePermissions']}>
    <SettingsInner />
  </PermissionGate>
);

const SettingsInner = () => {
  const perms = useWqPermissions();
  const [tab, setTab] = useState(perms.manageMasters ? 'defaults' : 'permissions');
  const [settings, setSettings] = useState(null);
  const [sets, setSets] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    wqSettingsApi.get().then((r) => setSettings(r.settings));
    wqMasters.sets.list({ limit: 200 }).then((r) => setSets(r.data.items));
  }, []);

  const tabs = [
    ...(perms.manageMasters ? [{ value: 'defaults', label: S.defaults }, { value: 'export', label: S.export }] : []),
    ...(perms.managePermissions ? [{ value: 'permissions', label: S.permissions }] : []),
  ];

  const run = async (fn) => {
    setSaving(true);
    try {
      await fn();
      toast.success(T.common.saved);
    } catch (e) {
      toast.error(e?.response?.data?.message ?? 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  if (!settings) return <Skeleton className="h-64 w-full" />;

  return (
    <>
      <PageHeader title={S.title} breadcrumbs={[{ label: T.module, to: CRM.wqQuotes }, { label: S.title }]} />
      <Tabs tabs={tabs} value={tab} onChange={setTab} className="mb-5" />
      <Card>
        <CardBody className="space-y-5">
          {tab === 'defaults' && (
            <>
              <Select label={S.defaultSet} value={settings.defaultDeliverableSetId ?? ''} placeholder={T.common.none}
                options={sets.map((s) => ({ value: s._id, label: s.name }))}
                onChange={(e) => setSettings({ ...settings, defaultDeliverableSetId: e.target.value || null })} />
              <Button loading={saving} onClick={() => run(() => wqSettingsApi.update({ defaultDeliverableSetId: settings.defaultDeliverableSetId }))}>{T.common.save}</Button>
            </>
          )}
          {tab === 'export' && (
            <>
              <div className="grid gap-4 sm:grid-cols-3">
                <Input label={`${S.quality} (0.3–1)`} type="number" step="0.05" min="0.3" max="1" value={settings.export?.quality ?? 0.9}
                  onChange={(e) => setSettings({ ...settings, export: { ...settings.export, quality: Number(e.target.value) } })} />
                <Input label={S.width} type="number" min="320" max="4096" value={settings.export?.widthPx ?? 1600}
                  onChange={(e) => setSettings({ ...settings, export: { ...settings.export, widthPx: Number(e.target.value) } })} />
                <Input label={S.scale} type="number" step="0.25" min="0.25" max="4" value={settings.export?.scale ?? 1}
                  onChange={(e) => setSettings({ ...settings, export: { ...settings.export, scale: Number(e.target.value) } })} />
              </div>
              <Button loading={saving} onClick={() => run(() => wqSettingsApi.update({ export: settings.export }))}>{T.common.save}</Button>
            </>
          )}
          {tab === 'permissions' && settings.permissions && (
            <PermissionMatrix value={settings.permissions} saving={saving}
              onSave={(matrix) => run(async () => {
                const r = await wqSettingsApi.updatePermissions(matrix);
                setSettings({ ...settings, permissions: r.permissions });
              })} />
          )}
        </CardBody>
      </Card>
    </>
  );
};

const PermissionMatrix = ({ value, onSave, saving }) => {
  const [m, setM] = useState(value);
  useEffect(() => setM(value), [value]);
  const toggle = (role, action) => setM({ ...m, [role]: { ...m[role], [action]: !m[role][action] } });
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-ink-200 text-left text-xs uppercase tracking-wide text-ink-400">
              <th className="py-2">Action</th>
              {WQ_ROLES.map((r) => <th key={r} className="py-2 text-center capitalize">{r}</th>)}
            </tr>
          </thead>
          <tbody>
            {WQ_ACTIONS.map((action) => (
              <tr key={action} className="border-b border-ink-100">
                <td className="py-2.5 text-ink-800">{S.actions[action]}</td>
                {WQ_ROLES.map((role) => {
                  const locked = role === 'admin' && action === 'managePermissions';
                  return (
                    <td key={role} className="py-2.5 text-center">
                      <input type="checkbox" className="h-4.5 w-4.5 accent-brand-500" checked={Boolean(m[role]?.[action])} disabled={locked}
                        aria-label={`${role} ${action}`} onChange={() => toggle(role, action)} />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-ink-500">{S.adminLocked}</p>
      <Button className="mt-4" loading={saving} onClick={() => onSave(m)}>{S.savePermissions}</Button>
    </div>
  );
};

export default QuoteSettings;
