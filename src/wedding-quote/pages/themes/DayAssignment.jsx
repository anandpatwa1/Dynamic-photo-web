import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ArrowDown, ArrowUp, GripVertical, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { Badge, Button, Card, CardBody, PageHeader, Select, Skeleton } from '@/components/ui';
import { CRM } from '@/routes/paths';
import { PermissionGate } from '../../components/PermissionGate';
import { fetchWqThemes } from '../../redux/wqSlices';
import { wqThemeApi } from '../../api/wqApi';
import { MAX_THEMES_PER_DAY, normalizeAssignment, resolveThemes } from '../../utils/engine/assignment';
import { moveItem } from '../../utils/engine/dates';
import { T, fmt } from '../../constants/strings';

const TH = T.themes;
const DAYS = Array.from({ length: 10 }, (_, i) => i + 1);

export const DayAssignment = () => (
  <PermissionGate anyOf={['manageThemes']}>
    <AssignmentInner />
  </PermissionGate>
);

const AssignmentInner = () => {
  const dispatch = useDispatch();
  const { themes, themesLoaded } = useSelector((s) => s.wqMeta);
  const [rows, setRows] = useState(null);
  const [saving, setSaving] = useState(false);
  const [drag, setDrag] = useState(null); // { day, index }

  useEffect(() => {
    if (!themesLoaded) dispatch(fetchWqThemes());
    wqThemeApi.assignments().then((r) => {
      const byDay = new Map(r.assignments.map((a) => [a.dayCount, a]));
      setRows(DAYS.map((d) => ({ dayCount: d, themeIds: (byDay.get(d)?.themeIds ?? []).map(String), defaultThemeId: byDay.get(d)?.defaultThemeId ? String(byDay.get(d).defaultThemeId) : null })));
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const byId = useMemo(() => new Map(themes.map((t) => [t._id, t])), [themes]);
  const update = (day, fn) => setRows((rs) => rs.map((r) => (r.dayCount === day ? normalizeAssignment(fn(r)).value ?? r : r)));

  const save = async () => {
    setSaving(true);
    try {
      await wqThemeApi.saveAssignments(rows);
      toast.success(T.common.saved);
    } catch (e) {
      toast.error(e?.response?.data?.message ?? 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  if (!rows) return <Skeleton className="h-96 w-full" />;

  return (
    <>
      <PageHeader title={TH.assignmentTitle} description={TH.assignmentDescription}
        breadcrumbs={[{ label: T.module, to: CRM.wqQuotes }, { label: TH.assignmentTitle }]}
        actions={<Button loading={saving} onClick={save}>{TH.saveAssignment}</Button>} />
      <div className="space-y-3">
        {rows.map((row) => {
          const resolved = row.themeIds.length ? null : resolveThemes(rows, row.dayCount, themes);
          const available = themes.filter((t) => !row.themeIds.includes(t._id));
          return (
            <Card key={row.dayCount}>
              <CardBody className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <p className="w-28 shrink-0 font-semibold text-ink-900">{fmt(TH.days, { n: row.dayCount })}</p>
                <ul className="flex flex-1 flex-wrap gap-2" aria-label={fmt(TH.days, { n: row.dayCount })}>
                  {row.themeIds.map((id, index) => (
                    <li key={id} draggable
                      onDragStart={() => setDrag({ day: row.dayCount, index })}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => { if (drag?.day === row.dayCount) update(row.dayCount, (r) => ({ ...r, themeIds: moveItem(r.themeIds, drag.index, index - drag.index) })); setDrag(null); }}
                      className="flex items-center gap-1 rounded-xl bg-ink-50 py-1 pl-1 pr-1.5 ring-1 ring-ink-200">
                      <GripVertical className="h-4 w-4 cursor-grab text-ink-300" aria-hidden="true" />
                      <label className="flex items-center gap-1.5 text-sm">
                        <input type="radio" name={`def-${row.dayCount}`} checked={row.defaultThemeId === id} className="accent-brand-500"
                          onChange={() => update(row.dayCount, (r) => ({ ...r, defaultThemeId: id }))} aria-label={TH.defaultTheme} />
                        {byId.get(id)?.name ?? '?'}
                      </label>
                      {row.defaultThemeId === id && <Badge size="sm" tone="brand">{TH.defaultTheme}</Badge>}
                      <Button size="xs" variant="ghost" iconOnly icon={ArrowUp} aria-label={T.common.moveUp} disabled={index === 0} onClick={() => update(row.dayCount, (r) => ({ ...r, themeIds: moveItem(r.themeIds, index, -1) }))} />
                      <Button size="xs" variant="ghost" iconOnly icon={ArrowDown} aria-label={T.common.moveDown} disabled={index === row.themeIds.length - 1} onClick={() => update(row.dayCount, (r) => ({ ...r, themeIds: moveItem(r.themeIds, index, 1) }))} />
                      <Button size="xs" variant="ghost" iconOnly icon={X} aria-label={T.common.remove} onClick={() => update(row.dayCount, (r) => ({ ...r, themeIds: r.themeIds.filter((x) => x !== id) }))} />
                    </li>
                  ))}
                  {resolved && (
                    <li className="text-sm text-ink-400">
                      {fmt(TH.fallback, { source: resolved.source === 'fallback-lower' ? 'a lower day count' : 'built-in themes' })}: {resolved.defaultTheme?.name ?? '—'}
                    </li>
                  )}
                </ul>
                <Select aria-label={TH.addTheme} wrapperClassName="w-full sm:w-56" value="" placeholder={TH.addTheme} disabled={row.themeIds.length >= MAX_THEMES_PER_DAY}
                  options={available.map((t) => ({ value: t._id, label: t.name }))}
                  onChange={(e) => e.target.value && update(row.dayCount, (r) => ({ ...r, themeIds: [...r.themeIds, e.target.value] }))} />
              </CardBody>
            </Card>
          );
        })}
      </div>
    </>
  );
};

export default DayAssignment;
