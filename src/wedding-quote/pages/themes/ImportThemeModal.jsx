import { useState } from 'react';
import { AlertTriangle, CheckCircle2, Upload, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, Modal, SegmentedControl, Spinner } from '@/components/ui';
import { ThemePreview } from './ThemePreview';
import { wqThemeApi } from '../../api/wqApi';
import { T } from '../../constants/strings';

const TH = T.themes;

/** upload → server validation report → live preview (1/3/7/10 dates) → confirm (re-validated server-side). */
export const ImportThemeModal = ({ open, onClose, onImported }) => {
  const [file, setFile] = useState(null);
  const [report, setReport] = useState(null);
  const [busy, setBusy] = useState(false);
  const [days, setDays] = useState(3);

  const reset = () => { setFile(null); setReport(null); setBusy(false); };
  const close = () => { reset(); onClose(); };

  const choose = async (f) => {
    if (!f) return;
    setFile(f);
    setReport(null);
    setBusy(true);
    try {
      const r = await wqThemeApi.validateImport(f);
      setReport(r.report);
    } catch (e) {
      setReport({ ok: false, errors: [{ path: '(upload)', message: e?.response?.data?.message ?? 'Upload failed' }], warnings: [] });
    } finally {
      setBusy(false);
    }
  };

  const confirm = async () => {
    setBusy(true);
    try {
      const r = await wqThemeApi.commitImport(file);
      toast.success(TH.confirm);
      onImported(r.theme);
      close();
    } catch (e) {
      toast.error(e?.response?.data?.message ?? 'Import failed');
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={close} size="2xl" title={TH.importTitle}
      footer={<><Button variant="secondary" onClick={close}>{T.common.cancel}</Button><Button disabled={!report?.ok} loading={busy && !!report?.ok} onClick={confirm}>{TH.confirm}</Button></>}>
      <div className="space-y-5">
        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-ink-200 px-6 py-8 text-center hover:border-brand-300">
          <Upload className="h-6 w-6 text-ink-400" aria-hidden="true" />
          <span className="text-sm font-medium text-ink-700">{file ? file.name : TH.chooseFile}</span>
          <input type="file" accept=".zip,.json,application/zip,application/json" className="sr-only" onChange={(e) => choose(e.target.files?.[0])} />
        </label>
        {busy && !report && <p className="flex items-center gap-2 text-sm text-ink-500"><Spinner /> {TH.validating}</p>}
        {report && (
          <div className="space-y-3">
            {report.ok ? (
              <p className="flex items-center gap-2 font-medium text-success-700"><CheckCircle2 className="h-5 w-5" /> {TH.valid}</p>
            ) : (
              <div className="rounded-xl bg-danger-50 p-3">
                <p className="mb-1 flex items-center gap-2 font-medium text-danger-700"><XCircle className="h-5 w-5" /> {TH.errors} ({report.errors.length})</p>
                <ul className="space-y-0.5 text-sm text-danger-700">
                  {report.errors.map((e, i) => <li key={i}><code className="rounded bg-white/60 px-1">{e.path}</code> {e.message}</li>)}
                </ul>
              </div>
            )}
            {report.warnings?.length > 0 && (
              <div className="rounded-xl bg-warning-50 p-3">
                <p className="mb-1 flex items-center gap-2 font-medium text-warning-700"><AlertTriangle className="h-5 w-5" /> {TH.warnings}</p>
                <ul className="space-y-0.5 text-sm text-warning-700">
                  {report.warnings.map((w, i) => <li key={i}><code className="rounded bg-white/60 px-1">{w.path}</code> {w.message}</li>)}
                </ul>
              </div>
            )}
            {report.ok && report.theme && (
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <p className="font-medium text-ink-800">{TH.preview}: {report.theme.name}</p>
                  <SegmentedControl value={days} onChange={setDays} options={[1, 3, 7, 10].map((n) => ({ value: n, label: `${n}` }))} />
                </div>
                <div className="flex justify-center"><ThemePreview theme={report.theme} dayCount={days} width={360} /></div>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
