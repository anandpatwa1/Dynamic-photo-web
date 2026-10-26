import { createThemeThumbnail } from '../../utils/themeThumbnail';
import { packageTheme } from '../../utils/themePackage';
import { copyText } from '../../utils/download';
import { THEME_SCHEMA_VERSION } from '../../utils/engine/themeSchema';
import { useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Upload, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, Modal, SegmentedControl, Spinner } from '@/components/ui';
import { ThemePreview } from './ThemePreview';
import { wqThemeApi } from '../../api/wqApi';
import { T } from '../../constants/strings';

const TH = T.themes;

/** upload → server validation report → live preview (1/3/7/10 dates) → confirm (re-validated server-side). */
export const ImportThemeModal = ({ open, onClose, onImported }) => {
  const serial = useRef(0);
  const abort = useRef(null);
  const [json,setJson]=useState('');
  const [assetText,setAssetText]=useState('{}');
  const [progress,setProgress]=useState(0);
  const [file, setFile] = useState(null);
  const [report, setReport] = useState(null);
  const [committing,setCommitting]=useState(false);
  const [busy, setBusy] = useState(false);
  const [days, setDays] = useState(3);

  const reset = () => { serial.current+=1; abort.current?.abort(); setFile(null); setReport(null); setBusy(false); };
  const close = () => { if(committing)return;reset(); onClose(); };

  const choose = async (f) => {
    if (!f) return;
    const token=++serial.current;
    abort.current?.abort();
    abort.current=new AbortController();
    setProgress(0);
    setFile(f);
    setReport(null);
    setBusy(true);
    try {
      const r = await wqThemeApi.validateImport(f,{signal:abort.current.signal,onUploadProgress:e=>setProgress(Math.round((e.progress??0)*100))});
      if(token===serial.current)setReport(r.report);
    } catch (e) {
      if(token!==serial.current)return;
      setReport({ ok: false, errors: [{ path: '(upload)', message: e?.response?.data?.message ?? 'Upload failed' }], warnings: [] });
    } finally {
      if(token===serial.current)setBusy(false);
    }
  };

  const confirm = async () => {
    setBusy(true);setCommitting(true);
    try {
      const thumbnail=await createThemeThumbnail(report.theme).catch(()=>undefined);
      const r = await wqThemeApi.commitImport(file,{thumbnail});
      toast.success(TH.confirm);
      onImported(r.theme);
      reset();onClose();
    } catch (e) {
      toast.error(e?.response?.data?.message ?? 'Import failed');
      setBusy(false);
    } finally {setCommitting(false);}
  };

  return (
    <Modal open={open} onClose={close} showClose={!committing} closeOnBackdrop={!committing} size="2xl" title={TH.importTitle}
      footer={<><Button variant="secondary" disabled={committing} onClick={close}>{T.common.cancel}</Button><Button disabled={!report?.ok || busy} loading={busy && !!report?.ok} onClick={confirm}>{TH.confirm}</Button></>}>
      <div className="space-y-5">
        <details><summary className="cursor-pointer text-sm font-medium">Paste JSON / text-only AI package</summary><div className="mt-3 space-y-3"><textarea disabled={committing} aria-label="Theme JSON" className="min-h-40 w-full rounded border p-2 font-mono text-sm" placeholder="Paste complete theme.json" value={json} onChange={e=>{setJson(e.target.value);setReport(null);serial.current+=1;abort.current?.abort();setBusy(false)}}/><textarea disabled={committing} aria-label="SVG file mapping" className="min-h-20 w-full rounded border p-2 font-mono text-sm" placeholder={'{"frame.svg":"<svg ...>...</svg>"}'} value={assetText} onChange={e=>{setAssetText(e.target.value);setReport(null);serial.current+=1;abort.current?.abort();setBusy(false)}}/><Button disabled={busy} onClick={async()=>{try{const definition=JSON.parse(json);const assets=JSON.parse(assetText);if(!assets||Array.isArray(assets)||typeof assets!=='object'||Object.entries(assets).some(([name,text])=>!name.endsWith('.svg')||typeof text!=='string'))throw Error('Asset mapping must contain SVG filenames and complete SVG text');await choose(await packageTheme({definition,assets:[]},assets))}catch(e){toast.error(e.message)}}}>Validate pasted package</Button></div></details>
        <p className="text-xs text-ink-500">ZIP up to 12 MiB; expanded package 40 MiB; assets 32 MiB total, 8 MiB each (SVG 2 MiB). No minimum size.</p>
        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-ink-200 px-6 py-8 text-center hover:border-brand-300">
          <Upload className="h-6 w-6 text-ink-400" aria-hidden="true" />
          <span className="text-sm font-medium text-ink-700">{file ? file.name : TH.chooseFile}</span>
          <input type="file" disabled={committing} accept=".zip,.json,application/zip,application/json" className="sr-only" onChange={(e) => choose(e.target.files?.[0])} />
        </label>
        {busy && !report && <p className="flex items-center gap-2 text-sm text-ink-500"><Spinner /> {TH.validating} {progress}%</p>}
        {report && <Button size="sm" variant="secondary" onClick={async()=>{let definition=report.theme?.definition;try{if(!definition&&file?.name.endsWith('.json'))definition=JSON.parse(await file.text())}catch{}await copyText(JSON.stringify({task:'Repair this theme using supported properties. Supply all missing assets; do not invent base64 data.',schemaVersion:THEME_SCHEMA_VERSION,errors:report.errors,warnings:report.warnings,definition:definition??(json||undefined)},null,2));toast.success('Repair prompt copied')}}>Copy repair prompt</Button>}
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
                  <SegmentedControl value={days} onChange={setDays} options={[1, 3, 5, 7, 10].map((n) => ({ value: n, label: `${n}` }))} />
                </div>
                <div className="flex justify-center"><ThemePreview theme={report.theme} dayCount={days} width={280} /></div>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
