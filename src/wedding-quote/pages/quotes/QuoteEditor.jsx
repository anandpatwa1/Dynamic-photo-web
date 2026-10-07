import { useCallback, useEffect, useLayoutEffect, useMemo, useReducer, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft, Calculator, Download, Maximize2, PanelRight, PieChart, Redo2, RotateCcw, Undo2, ZoomIn, ZoomOut,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, EmptyState, Input, PageLoader } from '@/components/ui';
import { cn } from '@/utils/cn';
import { CRM } from '@/routes/paths';
import { QuoteCanvas } from '../../components/QuoteCanvas';
import { SidePanel } from '../../components/SidePanel';
import { ExportPanel } from '../../components/ExportPanel';
import { BreakdownDrawer } from '../../components/BreakdownDrawer';
import { ThemePicker } from '../../components/ThemePicker';
import { PermissionGate } from '../../components/PermissionGate';
import { useWqPermissions } from '../../hooks/useWqPermissions';
import { fetchWqStudio, fetchWqThemes } from '../../redux/wqSlices';
import { wqMasters, wqQuoteApi, wqSettingsApi, wqThemeApi } from '../../api/wqApi';
import { editorReducer, initialEditorState, isDirty } from '../../utils/editorReducer';
import * as ops from '../../utils/quoteOps';
import { BUILTIN_THEMES } from '../../utils/engine/builtinThemes';
import { DESIGN_WIDTH } from '../../utils/engine/layout';
import { T, fmt } from '../../constants/strings';

const E = T.editor;

export const QuoteEditor = () => (
  <PermissionGate anyOf={['viewQuotes']}>
    <EditorInner />
  </PermissionGate>
);

const EditorInner = () => {
  const { id } = useParams();
  const reduxDispatch = useDispatch();
  const perms = useWqPermissions();
  const { themes, themesLoaded, studio } = useSelector((s) => s.wqMeta);
  const [state, dispatch] = useReducer(editorReducer, initialEditorState);
  const [loadError, setLoadError] = useState(null);
  const [assigned, setAssigned] = useState({ themeIds: [], defaultThemeId: null });
  const [selected, setSelected] = useState(null);
  const [panel, setPanel] = useState('fields'); // fields | export | null
  const [zoom, setZoom] = useState(0.5);
  const [plan, setPlan] = useState(null);
  const [saving, setSaving] = useState(false);
  const [breakdown, setBreakdown] = useState(false);
  const [addOns, setAddOns] = useState([]);
  const [exportDefaults, setExportDefaults] = useState(null);
  const stageRef = useRef(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  const canEdit = perms.editQuote || perms.createQuote;
  const quote = state.quote;

  // ---- load ---------------------------------------------------------------
  useEffect(() => {
    if (!themesLoaded) reduxDispatch(fetchWqThemes());
    if (!studio) reduxDispatch(fetchWqStudio());
    wqMasters.addOns.list({ isActive: 'true', limit: 200 }).then((r) => setAddOns(r.data.items)).catch(() => {});
    wqSettingsApi.get().then((r) => setExportDefaults(r.settings.exportLastUsed ?? r.settings.export)).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    wqQuoteApi.get(id).then((r) => dispatch({ type: 'load', quote: r.quote })).catch((e) => setLoadError(e?.response?.data?.message ?? 'Quote not found'));
  }, [id]);

  const dayCount = Math.max(1, quote?.days?.length ?? 1);
  useEffect(() => {
    if (!quote) return;
    wqThemeApi.forDay(Math.min(10, dayCount)).then(setAssigned).catch(() => {});
  }, [dayCount, Boolean(quote)]); // eslint-disable-line react-hooks/exhaustive-deps

  const apply = useCallback((fn) => dispatch({ type: 'apply', fn }), []);

  // Default theme for the day count when the quote has none.
  useEffect(() => {
    if (quote && !quote.themeId && assigned.defaultThemeId && canEdit) apply((q) => ({ ...q, themeId: assigned.defaultThemeId }));
  }, [quote?.themeId, assigned.defaultThemeId]); // eslint-disable-line react-hooks/exhaustive-deps

  const theme = useMemo(() => {
    const byId = themes.find((t) => t._id === String(quote?.themeId)) ?? themes.find((t) => t._id === String(assigned.defaultThemeId));
    return byId ?? themes[0] ?? BUILTIN_THEMES[0];
  }, [themes, quote?.themeId, assigned.defaultThemeId]);

  // ---- autosave -----------------------------------------------------------
  const save = useCallback(async (extra = {}) => {
    const s = stateRef.current;
    if (!s.quote || !canEdit) return null;
    const version = s.version;
    setSaving(true);
    try {
      const res = await wqQuoteApi.update(s.quote._id, { ...ops.quoteToBody(s.quote), ...extra });
      dispatch({ type: 'saved', quote: res.quote, version });
      return res.quote;
    } catch (e) {
      toast.error(e?.response?.data?.message ?? 'Could not save');
      return null;
    } finally {
      setSaving(false);
    }
  }, [canEdit]);

  useEffect(() => {
    if (!isDirty(state) || !canEdit) return undefined;
    const t = setTimeout(() => save(), 1200);
    return () => clearTimeout(t);
  }, [state.version]); // eslint-disable-line react-hooks/exhaustive-deps

  // Safe leave: warn on tab close; flush on in-app navigation.
  useEffect(() => {
    const onBeforeUnload = (e) => {
      if (isDirty(stateRef.current)) { e.preventDefault(); e.returnValue = T.common.leaveWarning; }
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      if (isDirty(stateRef.current)) save();
    };
  }, [save]);

  // Undo / redo shortcuts (not while typing in a field).
  useEffect(() => {
    const onKey = (e) => {
      const t = e.target;
      if (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName)) return;
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === 'z') { e.preventDefault(); dispatch({ type: e.shiftKey ? 'redo' : 'undo' }); }
      if (mod && e.key.toLowerCase() === 'y') { e.preventDefault(); dispatch({ type: 'redo' }); }
      if (e.key === 'Escape') setSelected(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // ---- zoom / fit ---------------------------------------------------------
  const fit = useCallback(() => {
    const el = stageRef.current;
    if (!el || !plan) return;
    const z = Math.min((el.clientWidth - 32) / DESIGN_WIDTH, (window.innerHeight - 180) / plan.height);
    setZoom(Math.max(0.15, Math.min(1.5, Math.round(z * 100) / 100)));
  }, [plan]);
  const didFit = useRef(false);
  useLayoutEffect(() => {
    if (plan && !didFit.current) { didFit.current = true; fit(); }
  }, [plan, fit]);

  const onEditText = useCallback((path, text) => apply((q) => ops.setText(q, path, text)), [apply]);
  const onBlockOverride = useCallback((blockId, patch) => apply((q) => ops.setBlockOverride(q, blockId, patch)), [apply]);

  if (loadError) return <EmptyState title={loadError} action={<Link to={CRM.wqQuotes}>{T.list.title}</Link>} />;
  if (!quote) return <PageLoader />;

  const blockOv = selected ? quote.layout?.blockOverrides?.[selected] ?? {} : null;
  const dirty = isDirty(state);

  return (
    <div className="-mx-4 -my-6 flex min-h-[calc(100vh-4rem)] flex-col sm:-mx-6 lg:-mx-8 lg:-my-8">
      {/* toolbar */}
      <div className="sticky top-16 z-20 flex flex-wrap items-center gap-1.5 border-b border-ink-200/70 bg-white/95 px-3 py-2 backdrop-blur">
        <Button as={Link} to={CRM.wqQuotes} variant="ghost" size="sm" iconOnly icon={ArrowLeft} aria-label={T.common.back} />
        <p className="mr-2 max-w-[10rem] truncate font-semibold text-ink-900 xl:max-w-[14rem]">{quote.packageSnapshot?.name || T.list.untitled}</p>
        <ThemePicker themes={themes.length ? themes : [theme]} assignedIds={assigned.themeIds} value={quote.themeId ?? theme._id}
          dayCount={dayCount} disabled={!canEdit} onChange={(themeId) => apply((q) => ({ ...q, themeId }))} />
        <span className="mx-1 h-6 w-px bg-ink-200" />
        <Button size="sm" variant="ghost" iconOnly icon={Undo2} aria-label={E.undo} disabled={!state.past.length} onClick={() => dispatch({ type: 'undo' })} />
        <Button size="sm" variant="ghost" iconOnly icon={Redo2} aria-label={E.redo} disabled={!state.future.length} onClick={() => dispatch({ type: 'redo' })} />
        <Button size="sm" variant="ghost" iconOnly icon={ZoomOut} aria-label={E.zoomOut} onClick={() => setZoom((z) => Math.max(0.15, +(z - 0.1).toFixed(2)))} />
        <span className="tabular w-11 text-center text-xs text-ink-500">{Math.round(zoom * 100)}%</span>
        <Button size="sm" variant="ghost" iconOnly icon={ZoomIn} aria-label={E.zoomIn} onClick={() => setZoom((z) => Math.min(2, +(z + 0.1).toFixed(2)))} />
        <Button size="sm" variant="ghost" iconOnly icon={Maximize2} aria-label={E.fit} onClick={fit} />
        {canEdit && <Button size="sm" variant="ghost" icon={RotateCcw} onClick={() => apply(ops.resetQuoteToAuto)}>{E.resetQuote}</Button>}
        <div className="ml-auto flex shrink-0 items-center gap-1.5">
        <span className={cn('text-xs', dirty ? 'text-warning-700' : 'text-ink-400')} aria-live="polite">{saving ? T.common.saving : dirty ? T.common.unsaved : T.common.saved}</span>
        <Button size="sm" variant="secondary" icon={PieChart} onClick={async () => { if (dirty) await save(); setBreakdown(true); }}>{E.breakdown}</Button>
        {canEdit && (
          <Button size="sm" variant="ghost" iconOnly icon={Calculator} aria-label={E.recalc}
            onClick={async () => { await save(); const r = await wqQuoteApi.recalculate(quote._id); dispatch({ type: 'load', quote: r.quote }); toast.success(E.recalc); }} />
        )}
        <Button size="sm" variant={panel === 'fields' ? 'dark' : 'ghost'} iconOnly icon={PanelRight} aria-label={E.panel} aria-pressed={panel === 'fields'} onClick={() => setPanel(panel === 'fields' ? null : 'fields')} />
        {perms.exportJpg && <Button size="sm" variant={panel === 'export' ? 'dark' : 'primary'} icon={Download} onClick={() => setPanel(panel === 'export' ? null : 'export')}>JPG</Button>}
        </div>
      </div>

      {/* block controls */}
      {canEdit && (
        <div className="flex flex-wrap items-center gap-3 border-b border-ink-100 bg-ink-50/60 px-3 py-2 text-sm">
          {selected ? (
            <>
              <span className="font-medium text-ink-800">{E.blocks[selected]}</span>
              <Input aria-label={E.width} type="number" min="80" max="1080" wrapperClassName="w-28" suffix="px" value={Math.round(blockOv.w ?? 0) || ''} placeholder="auto"
                onChange={(e) => apply((q) => ops.setBlockOverride(q, selected, { w: e.target.value ? Math.max(80, Math.min(1080, Number(e.target.value))) : undefined }))} />
              <Input aria-label={E.fontScale} type="number" step="0.05" min="0.3" max="3" wrapperClassName="w-24" suffix="×" value={blockOv.fontScale ?? 1}
                onChange={(e) => apply((q) => ops.setBlockOverride(q, selected, { fontScale: Math.max(0.3, Math.min(3, Number(e.target.value) || 1)) }))} />
              <Button size="xs" variant="ghost" icon={RotateCcw} onClick={() => apply((q) => ops.resetBlock(q, selected))}>{E.resetBlock}</Button>
            </>
          ) : (
            <span className="text-ink-500">{E.clickToEdit}</span>
          )}
          {plan?.warning === 'overCap' && <span className="text-warning-700">{E.overCap}</span>}
          <span className="ml-auto text-xs text-ink-400">{fmt(E.assigned, { n: dayCount })}</span>
        </div>
      )}

      <div className="flex flex-1 flex-col lg:flex-row">
        {/* stage */}
        <div ref={stageRef} className="flex-1 overflow-auto bg-ink-100/70 p-4" onClick={() => setSelected(null)}>
          <div className="mx-auto shadow-xl" style={{ width: DESIGN_WIDTH * zoom, height: (plan?.height ?? DESIGN_WIDTH) * zoom }}>
            <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top left', width: DESIGN_WIDTH }}>
              <QuoteCanvas
                quote={quote}
                theme={theme}
                studio={studio}
                mode={canEdit ? 'edit' : 'view'}
                selectedBlock={selected}
                onSelectBlock={setSelected}
                onEditText={onEditText}
                onBlockOverride={onBlockOverride}
                onPlan={setPlan}
                zoom={zoom}
              />
            </div>
          </div>
        </div>

        {/* right panel */}
        {panel && (
          <aside className="w-full shrink-0 border-l border-ink-200/70 bg-white p-4 lg:sticky lg:top-[7.5rem] lg:h-[calc(100vh-7.5rem)] lg:w-96 lg:overflow-y-auto">
            {panel === 'fields' && canEdit && <SidePanel quote={quote} apply={apply} studio={studio} theme={theme} addOns={addOns} />}
            {panel === 'fields' && !canEdit && <p className="text-sm text-ink-500">{T.common.noPermission}</p>}
            {panel === 'export' && (
              <ExportPanel
                quote={quote}
                theme={theme}
                studio={studio}
                plan={plan}
                defaults={exportDefaults}
                canExport={perms.exportJpg}
                onSave={() => (canEdit ? save({ status: 'saved' }) : Promise.resolve(quote))}
              />
            )}
          </aside>
        )}
      </div>

      <BreakdownDrawer quoteId={quote._id} open={breakdown} onClose={() => setBreakdown(false)} refreshKey={state.savedVersion} />
    </div>
  );
};

export default QuoteEditor;
