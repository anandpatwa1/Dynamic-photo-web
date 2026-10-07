import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Download, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, Input } from '@/components/ui';
import { QuoteCanvas } from './QuoteCanvas';
import { DESIGN_WIDTH, exportSize, formatBytes } from '../utils/engine/layout';
import { encodeJpeg, rasterize } from '../utils/exportJpg';
import { downloadBlob, quoteFileName } from '../utils/download';
import { wqSettingsApi } from '../api/wqApi';
import { T } from '../constants/strings';

const X = T.export;

/**
 * Export controls (A12). Renders an off-screen QuoteCanvas in export mode with
 * the editor's exact layout plan, so the JPG matches the editor pixel-for-pixel.
 * The size readout is the real encoded blob size (debounced), not a guess.
 */
export const ExportPanel = ({ quote, theme, studio, plan, defaults, canExport, onSave }) => {
  const [quality, setQuality] = useState(defaults?.quality ?? 0.9);
  const [widthPx, setWidthPx] = useState(defaults?.widthPx ?? 1600);
  const [estimate, setEstimate] = useState({ bytes: null, busy: false, error: null });
  const [working, setWorking] = useState(false);
  const nodeRef = useRef(null);
  const rasterCache = useRef({ key: null, canvas: null });

  useEffect(() => {
    if (defaults) { setQuality(defaults.quality ?? 0.9); setWidthPx(defaults.widthPx ?? 1600); }
  }, [defaults]);

  const size = useMemo(() => exportSize({ designWidth: DESIGN_WIDTH, designHeight: plan?.height ?? DESIGN_WIDTH, widthPx }), [plan, widthPx]);
  const contentKey = useMemo(() => JSON.stringify([quote, theme?._id, plan, size.width, size.height]), [quote, theme, plan, size]);

  const getCanvas = async () => {
    if (rasterCache.current.key === contentKey && rasterCache.current.canvas) return rasterCache.current.canvas;
    const canvas = await rasterize(nodeRef.current, { width: DESIGN_WIDTH, height: plan.height, outW: size.width, outH: size.height, theme, background: theme.definition.canvas.bg });
    rasterCache.current = { key: contentKey, canvas };
    return canvas;
  };

  // Live estimate (debounced): re-rasterise only when content/size change, re-encode on quality.
  useEffect(() => {
    if (!plan || !nodeRef.current || !canExport) return undefined;
    setEstimate((e) => ({ ...e, busy: true }));
    const t = setTimeout(async () => {
      try {
        const blob = await encodeJpeg(await getCanvas(), quality);
        setEstimate({ bytes: blob.size, busy: false, error: null });
      } catch {
        setEstimate({ bytes: null, busy: false, error: X.failed });
      }
    }, 700);
    return () => clearTimeout(t);
  }, [contentKey, quality, canExport]); // eslint-disable-line react-hooks/exhaustive-deps

  const download = async ({ save }) => {
    setWorking(true);
    try {
      let current = quote;
      if (save) {
        const saved = await onSave?.();
        if (!saved) return;
        current = saved;
      }
      const blob = await encodeJpeg(await getCanvas(), quality);
      downloadBlob(blob, quoteFileName(current));
      wqSettingsApi.saveLastUsedExport({ quality, widthPx, scale: size.scale }).catch(() => {});
    } catch {
      toast.error(X.failed);
    } finally {
      setWorking(false);
    }
  };

  if (!canExport) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-ink-900">{X.title}</h3>
      <label className="block text-sm">
        <span className="flex justify-between text-ink-700"><span>{X.quality}</span><span className="tabular">{Math.round(quality * 100)}%</span></span>
        <input type="range" min="0.3" max="1" step="0.01" value={quality} onChange={(e) => setQuality(Number(e.target.value))} className="w-full accent-brand-500" aria-label={X.quality} />
      </label>
      <Input label={`${X.width} (px)`} type="number" min="320" max="4096" value={widthPx} onChange={(e) => setWidthPx(Math.max(320, Math.min(4096, Number(e.target.value) || 320)))} />
      <dl className="space-y-1 rounded-xl bg-ink-50 p-3 text-sm">
        <div className="flex justify-between"><dt className="text-ink-500">{X.dimensions}</dt><dd className="tabular text-ink-800">{size.width} × {size.height}</dd></div>
        <div className="flex justify-between"><dt className="text-ink-500">{X.estimated}</dt><dd className="tabular text-ink-800">{estimate.busy ? X.measuring : formatBytes(estimate.bytes)}</dd></div>
      </dl>
      {size.capped && <p className="rounded-lg bg-warning-50 px-3 py-2 text-xs text-warning-700">{X.capped}</p>}
      {estimate.error && <p className="rounded-lg bg-danger-50 px-3 py-2 text-xs text-danger-700">{estimate.error}</p>}
      <div className="grid gap-2">
        <Button icon={Save} loading={working} onClick={() => download({ save: true })}>{X.saveDownload}</Button>
        <Button variant="secondary" icon={Download} disabled={working} onClick={() => download({ save: false })}>{X.downloadOnly}</Button>
      </div>
      {plan &&
        createPortal(
          <div aria-hidden="true" style={{ position: 'fixed', left: -100000, top: 0, pointerEvents: 'none' }}>
            <QuoteCanvas ref={nodeRef} quote={quote} theme={theme} studio={studio} mode="export" plan={plan} />
          </div>,
          document.body,
        )}
    </div>
  );
};
