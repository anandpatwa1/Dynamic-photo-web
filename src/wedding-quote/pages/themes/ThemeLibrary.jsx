import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Bot, Download, Eye, FileDown, GitCompareArrows, Package, Pencil, Trash2, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { Badge, Button, Card, CardBody, ConfirmDialog, Input, Modal, PageHeader, SearchInput, SegmentedControl, Skeleton, Tabs } from '@/components/ui';
import { CRM } from '@/routes/paths';
import { PermissionGate } from '../../components/PermissionGate';
import { useWqPermissions } from '../../hooks/useWqPermissions';
import { fetchWqThemes, wqMetaActions } from '../../redux/wqSlices';
import { wqThemeApi } from '../../api/wqApi';
import { downloadBlob, copyText } from '../../utils/download';
import { buildAiPrompt } from '../../utils/engine/themeSchema';
import { ThemePreview } from './ThemePreview';
import { ImportThemeModal } from './ImportThemeModal';
import { T, fmt } from '../../constants/strings';

const TH = T.themes;

export const ThemeLibrary = () => (
  <PermissionGate anyOf={['manageThemes']}>
    <LibraryInner />
  </PermissionGate>
);

const LibraryInner = () => {
  const dispatch = useDispatch();
  const perms = useWqPermissions();
  const { themes, themesLoaded } = useSelector((s) => s.wqMeta);
  const [days, setDays] = useState(3);
  const [importing, setImporting] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [previewing, setPreviewing] = useState(null);
  const [editing, setEditing] = useState(null);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [saving, setSaving] = useState(false);
  const [compareIds, setCompareIds] = useState([]);
  const [all, setAll] = useState([]);

  const reload = () => wqThemeApi.list({ includeInactive: 'true' }).then((r) => setAll(r.themes));
  useEffect(() => { reload(); if (!themesLoaded) dispatch(fetchWqThemes()); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const run = async (fn, okMsg) => {
    try { await fn(); if (okMsg) toast.success(okMsg); } catch (e) { toast.error(e?.response?.data?.message ?? 'Something went wrong'); }
  };

  const copyPrompt = async () => {
    // Generated from the live zod schema, so it never drifts from what import accepts.
    if (await copyText(buildAiPrompt())) toast.success(TH.promptCopied);
  };

  const toggle = (t) => run(async () => {
    const r = await wqThemeApi.update(t._id, { isActive: !t.isActive });
    await reload();
    dispatch(fetchWqThemes());
    return r;
  });

  const list = all.length ? all : themes;
  const filtered = list.filter((theme) => {
    if (status === 'active' && theme.isActive === false) return false;
    if (status === 'inactive' && theme.isActive !== false) return false;
    return theme.name.toLowerCase().includes(query.trim().toLowerCase());
  });
  const compareThemes = list.filter((theme) => compareIds.includes(String(theme._id)));
  const toggleCompare = (theme) => setCompareIds((ids) => ids.includes(String(theme._id)) ? ids.filter((id) => id !== String(theme._id)) : ids.length < 2 ? [...ids, String(theme._id)] : ids);

  const saveDetails = async () => {
    if (!editing?.name.trim() || !editing.forDays.length) return;
    setSaving(true);
    try {
      await wqThemeApi.update(editing._id, { name: editing.name.trim(), forDays: editing.forDays });
      await reload();
      dispatch(fetchWqThemes());
      setEditing(null);
      toast.success(T.common.saved);
    } catch (e) {
      toast.error(e?.response?.data?.message ?? 'Could not update theme');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title={TH.title}
        description={TH.description}
        breadcrumbs={[{ label: T.module, to: CRM.wqQuotes }, { label: TH.title }]}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" icon={FileDown} onClick={() => run(async () => downloadBlob(await wqThemeApi.exampleZip(), 'example-theme.zip'))}>{TH.downloadExample}</Button>
            <Button variant="secondary" icon={Package} onClick={() => run(async () => downloadBlob(await wqThemeApi.exportAllZip(), 'wedding-quote-theme-kit.zip'))}>{TH.downloadKit}</Button>
            <Button variant="secondary" icon={Bot} onClick={copyPrompt}>{TH.copyPrompt}</Button>
            <Button variant="secondary" icon={GitCompareArrows} disabled={compareIds.length < 2} onClick={() => setPreviewing({ compare: compareThemes })}>{TH.compare} {compareIds.length}/2</Button>
            {perms.manageThemes && <Button icon={Upload} onClick={() => setImporting(true)}>{TH.import}</Button>}
          </div>
        }
      />
      <div className="mb-5 space-y-3 rounded-2xl bg-white p-3 shadow-card sm:p-4">
        <div className="flex items-center gap-3 overflow-x-auto pb-1">
          <span className="shrink-0 text-sm font-medium text-ink-700">{TH.preview}:</span>
          <SegmentedControl className="shrink-0" value={days} onChange={setDays} options={[1, 3, 5, 7, 10].map((n) => ({ value: n, label: fmt(TH.days, { n }) }))} />
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <Tabs size="sm" value={status} onChange={setStatus} className="sm:min-w-80"
            tabs={[{ value: 'all', label: TH.all, count: list.length }, { value: 'active', label: T.common.active, count: list.filter((t) => t.isActive !== false).length }, { value: 'inactive', label: T.common.inactive, count: list.filter((t) => t.isActive === false).length }]} />
          <SearchInput value={query} onChange={setQuery} delay={0} placeholder={TH.search} className="w-full sm:max-w-xs" />
        </div>
      </div>
      {!list.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-96" />)}</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((t) => (
            <Card key={t._id} className={t.isActive === false ? 'opacity-60' : undefined}>
              <CardBody className="space-y-3">
                <button type="button" onClick={() => setPreviewing(t)} className="group relative flex w-full justify-center overflow-hidden rounded-xl bg-ink-50">
                  <ThemePreview theme={t} dayCount={days} width={280} />
                  <span className="absolute inset-0 grid place-items-center bg-ink-950/0 opacity-0 transition group-hover:bg-ink-950/25 group-hover:opacity-100">
                    <span className="flex items-center gap-2 rounded-full bg-white px-3 py-2 text-sm font-medium text-ink-800 shadow-lg"><Eye className="h-4 w-4" /> {TH.preview}</span>
                  </span>
                </button>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-ink-900">{t.name}</p>
                    <p className="text-xs text-ink-500">{fmt(TH.forDays, { days: (t.forDays ?? []).join(', ') })}</p>
                  </div>
                  <div className="flex flex-wrap justify-end gap-1">
                    {t.isBuiltIn && <Badge tone="brand" size="sm">{TH.builtIn}</Badge>}
                    <Badge tone={(t.forDays ?? []).includes(days) ? 'success' : 'neutral'} size="sm">{(t.forDays ?? []).includes(days) ? TH.compatible : TH.notCompatible}</Badge>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Button size="xs" variant="secondary" icon={Eye} onClick={() => setPreviewing(t)}>{TH.preview}</Button>
                  <Button size="xs" variant={compareIds.includes(String(t._id)) ? 'subtle' : 'ghost'} icon={GitCompareArrows} disabled={compareIds.length >= 2 && !compareIds.includes(String(t._id))} onClick={() => toggleCompare(t)}>{TH.compare}</Button>
                  <Button size="xs" variant="secondary" icon={Download} onClick={() => run(async () => downloadBlob(await wqThemeApi.exportZip(t._id), `theme-${t.key}.zip`))}>{TH.exportOne}</Button>
                  {!t.isBuiltIn && <Button size="xs" variant="ghost" icon={Pencil} onClick={() => setEditing({ ...t, forDays: [...(t.forDays ?? [])] })}>{TH.editDetails}</Button>}
                  <Button size="xs" variant="ghost" onClick={() => toggle(t)}>{t.isActive === false ? TH.activate : TH.deactivate}</Button>
                  {!t.isBuiltIn && <Button size="xs" variant="ghost" icon={Trash2} onClick={() => setDeleting(t)}>{T.common.delete}</Button>}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
      {list.length > 0 && filtered.length === 0 && <p className="rounded-2xl bg-white py-16 text-center text-sm text-ink-500 shadow-card">No themes found</p>}
      <Modal open={!!previewing} onClose={() => setPreviewing(null)} title={previewing?.compare ? TH.compareThemes : previewing?.name} description={previewing?.compare ? TH.pickerDescription : previewing ? fmt(TH.forDays, { days: (previewing.forDays ?? []).join(', ') }) : ''} size={previewing?.compare ? '2xl' : 'xl'}>
        {previewing && (
          <div className="space-y-4">
            {previewing.compare ? <div className="grid gap-5 md:grid-cols-2">{previewing.compare.map((theme) => <div key={theme._id} className="space-y-2"><p className="font-semibold text-ink-900">{theme.name}</p><div className="flex justify-center overflow-auto rounded-2xl bg-ink-100 p-3 sm:p-5"><ThemePreview theme={theme} dayCount={days} width={280} /></div><p className="text-xs text-ink-500">{fmt(TH.forDays, { days: (theme.forDays ?? []).join(', ') })}</p></div>)}</div> : <div className="flex justify-center overflow-auto rounded-2xl bg-ink-100 p-3 sm:p-5"><ThemePreview theme={previewing} dayCount={days} width={300} /></div>}
            <div className="flex items-center justify-center gap-3 overflow-x-auto">
              <span className="shrink-0 text-sm text-ink-500">{TH.preview}:</span>
              <SegmentedControl className="shrink-0" value={days} onChange={setDays} options={[1, 3, 5, 7, 10].map((n) => ({ value: n, label: String(n) }))} />
            </div>
          </div>
        )}
      </Modal>
      <Modal open={!!editing} onClose={() => setEditing(null)} title={TH.editDetails} size="md"
        footer={<><Button variant="secondary" onClick={() => setEditing(null)}>{T.common.cancel}</Button><Button loading={saving} onClick={saveDetails}>{T.common.save}</Button></>}>
        {editing && <div className="space-y-5">
          <Input label={TH.themeName} value={editing.name} onChange={(e) => setEditing((theme) => ({ ...theme, name: e.target.value }))} />
          <div>
            <p className="mb-2 text-sm font-medium text-ink-800">{TH.supportedDays}</p>
            <div className="grid grid-cols-5 gap-2">
              {Array.from({ length: 10 }, (_, index) => index + 1).map((day) => {
                const active = editing.forDays.includes(day);
                return <button key={day} type="button" aria-pressed={active}
                  onClick={() => setEditing((theme) => ({ ...theme, forDays: active ? (theme.forDays.length === 1 ? theme.forDays : theme.forDays.filter((n) => n !== day)) : [...theme.forDays, day].sort((a, b) => a - b) }))}
                  className={active ? 'h-10 rounded-xl bg-brand-500 font-semibold text-white' : 'h-10 rounded-xl bg-ink-50 font-medium text-ink-600 ring-1 ring-inset ring-ink-200'}>{day}</button>;
              })}
            </div>
          </div>
        </div>}
      </Modal>
      <ImportThemeModal open={importing} onClose={() => setImporting(false)} onImported={(theme) => { dispatch(wqMetaActions.themeUpserted(theme)); reload(); }} />
      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} message={T.common.confirmDelete}
        onConfirm={() => run(async () => { await wqThemeApi.remove(deleting._id); dispatch(wqMetaActions.themeRemoved(deleting._id)); setDeleting(null); reload(); }, T.common.deleted)} />
    </>
  );
};

export default ThemeLibrary;
