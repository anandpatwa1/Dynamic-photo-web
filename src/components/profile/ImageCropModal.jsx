import { useEffect, useRef, useState } from 'react';
import { Crop, Loader2, Move, ZoomIn } from 'lucide-react';
import { Button, Modal } from '@/components/ui';
import { cropRect } from './cropGeometry';

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

const drawCrop = (canvas, image, aspect, zoom, position, width) => {
  if (!canvas || !image) return;
  const height = Math.round(width / aspect);
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  const source = cropRect(image, aspect, zoom, position);
  context.clearRect(0, 0, width, height);
  context.drawImage(
    image,
    source.x,
    source.y,
    source.width,
    source.height,
    0,
    0,
    width,
    height,
  );
};

const canvasBlob = (canvas, type = 'image/jpeg', quality = 0.92) =>
  new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not crop this photo'))), type, quality);
  });

/**
 * Dependency-free cropper used for public-profile portraits and covers.
 * The canvas is also the preview, so the saved pixels always match what the
 * admin saw. Dragging moves the crop; the sliders provide precise control.
 */
export const ImageCropModal = ({ file, kind, aspect: requestedAspect, outputWidth, onClose, onConfirm }) => {
  const canvasRef = useRef(null);
  const dragRef = useRef(null);
  const workerRef = useRef(null);
  const pendingCrop = useRef(null);
  const [image, setImage] = useState(null);
  const [error,setError] = useState('');
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0.5, y: 0.5 });
  const [saving, setSaving] = useState(false);
  const isProfile = kind === 'profile';
  const aspect = requestedAspect ?? (isProfile ? 1 : 2);

  useEffect(() => {
    setImage(null); setError(''); setZoom(1); setPosition({ x: 0.5, y: 0.5 });
    if (!file) return undefined;
    let active = true, preview, url, worker, timer, firstFrame, secondFrame;
    const fail = message => { if (active) { clearTimeout(timer); setError(message); } };
    const fallback = () => {
      if (!active) return;
      url = URL.createObjectURL(file);
      const nextImage = new Image();
      nextImage.onload = () => { if (active) { clearTimeout(timer); setImage(nextImage); } };
      nextImage.onerror = () => fail('This file could not be opened. Choose a JPG, PNG or WEBP image.');
      nextImage.src = url;
    };
    // Paint the shell and Cancel before starting any image work, including the
    // compatibility path for browsers without worker image decoding.
    firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => {
        if (!active) return;
        timer = setTimeout(() => {
          worker?.terminate(); workerRef.current = null;
          fail('This photo is taking too long to open. Cancel and choose it again.');
        }, 45000);
        try {
          worker = new Worker(new URL('./imageCrop.worker.js', import.meta.url), { type: 'module' });
          workerRef.current = worker;
          worker.onmessage = ({ data }) => {
            if (!active) { data.preview?.close(); return; }
            if (data.type === 'unsupported') {
              worker.terminate(); workerRef.current = null; fallback();
            } else if (data.type === 'ready') {
              clearTimeout(timer); preview = data.preview; setImage(preview);
            } else if (data.type === 'cropped') {
              pendingCrop.current?.resolve(data.blob); pendingCrop.current = null;
            } else if (data.type === 'error') {
              if (pendingCrop.current) { pendingCrop.current.reject(new Error(data.message)); pendingCrop.current = null; }
              else fail('This file could not be opened. Choose a JPG, PNG or WEBP image.');
            }
          };
          worker.onerror = event => {
            event.preventDefault();
            if (pendingCrop.current) { pendingCrop.current.reject(new Error('Could not prepare this crop. Please try again.')); pendingCrop.current = null; }
            worker.terminate(); workerRef.current = null; setImage(null); fallback();
          };
          worker.postMessage({ type: 'prepare', file });
        } catch { workerRef.current = null; fallback(); }
      });
    });
    return () => {
      active = false; cancelAnimationFrame(firstFrame); cancelAnimationFrame(secondFrame);
      clearTimeout(timer); worker?.terminate(); workerRef.current = null; preview?.close();
      if (url) URL.revokeObjectURL(url);
      pendingCrop.current?.reject(new Error('Crop cancelled.')); pendingCrop.current = null;
    };
  }, [file]);

  useEffect(() => {
    if (!image) return undefined;
    const frame = requestAnimationFrame(() => {
      try { drawCrop(canvasRef.current, image, aspect, zoom, position, 1000); }
      catch { setError('Could not display this photo. Please choose another image.'); }
    });
    return () => cancelAnimationFrame(frame);
  }, [image, aspect, zoom, position]);

  const startDrag = (event) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      position,
      width: event.currentTarget.clientWidth,
      height: event.currentTarget.clientHeight,
    };
  };
  const drag = (event) => {
    const start = dragRef.current;
    if (!start || start.pointerId !== event.pointerId) return;
    setPosition({
      x: clamp(start.position.x - ((event.clientX - start.x) / start.width) * 1.35),
      y: clamp(start.position.y - ((event.clientY - start.y) / start.height) * 1.35),
    });
  };

  const save = async () => {
    if (!image) return;
    setError('');
    setSaving(true);
    try {
      const width = outputWidth ?? (isProfile ? 1000 : 1800);
      let blob;
      if (workerRef.current) {
        blob = await new Promise((resolve, reject) => {
          pendingCrop.current = {resolve, reject};
          workerRef.current.postMessage({type:'crop', aspect, zoom, position, width});
        });
      } else {
        const canvas = document.createElement('canvas');
        drawCrop(canvas, image, aspect, zoom, position, width);
        blob = await canvasBlob(canvas);
      }
      const baseName = file.name.replace(/\.[^.]+$/, '') || kind;
      await onConfirm(new File([blob], `${baseName}-${kind}-cropped.jpg`, { type: blob.type }));
    } catch(error) { setError(error.message || 'Could not prepare this crop.'); } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={Boolean(file)}
      onClose={saving ? undefined : onClose}
      closeOnBackdrop={!saving}
      size="lg"
      layer={60}
      animated={false}
      title={isProfile ? 'Crop profile photo' : kind === 'cover' ? 'Crop cover photo' : 'Crop image'}
      description={isProfile ? 'Keep your face inside the square frame.' : 'Drag or use the sliders to choose the exact part of your image.'}
      footer={<><Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button><Button icon={Crop} loading={saving} disabled={!image} onClick={save}>{saving ? 'Processing image…' : 'Use this crop'}</Button></>}
    >
      <div className="space-y-5">
        {!image && !error && <div role="status" aria-live="polite" className="flex items-center gap-3 rounded-xl border border-ink-200 bg-ink-50 px-4 py-4 text-sm text-ink-800"><Loader2 className="h-5 w-5 shrink-0 animate-spin text-brand-600" aria-hidden="true"/><div><p className="font-medium">Preparing your photo…</p><p className="mt-1 text-xs text-ink-600">Large images may take a moment. You can cancel while it loads.</p></div></div>}
        {error&&<p role="alert" className="text-danger-600">{error}</p>}
        {saving && <p role="status" className="flex items-center gap-2 text-sm text-ink-700"><Loader2 className="h-4 w-4 animate-spin"/>Processing and uploading your image. Please wait…</p>}
        <div className="relative mx-auto overflow-hidden rounded-2xl bg-ink-950 shadow-inner" style={{ aspectRatio: String(aspect), width: `min(100%, calc(45vh * ${aspect}))` }}>
          {image ? (
            <canvas
              ref={canvasRef}
              className="absolute inset-0 h-full w-full cursor-move touch-none object-cover"
              onPointerDown={startDrag}
              onPointerMove={drag}
              onPointerUp={() => { dragRef.current = null; }}
              onPointerCancel={() => { dragRef.current = null; }}
              aria-label="Photo crop preview. Drag to reposition."
            />
          ) : <div role="status" className="absolute inset-0 grid place-items-center text-sm text-white/80">{error ? 'Preview unavailable' : 'Preparing photo…'}</div>}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <label className="sm:col-span-3">
            <span className="mb-2 flex items-center gap-2 text-sm font-medium text-ink-700"><ZoomIn className="h-4 w-4" /> Zoom</span>
            <input className="w-full accent-brand-500" type="range" min="1" max="3" step="0.01" disabled={!image || saving} value={zoom} onChange={(event) => setZoom(Number(event.target.value))} />
          </label>
          <label>
            <span className="mb-2 flex items-center gap-2 text-xs font-medium text-ink-600"><Move className="h-3.5 w-3.5" /> Horizontal</span>
            <input className="w-full accent-brand-500" type="range" min="0" max="1" step="0.01" disabled={!image || saving} value={position.x} onChange={(event) => setPosition((current) => ({ ...current, x: Number(event.target.value) }))} />
          </label>
          <label>
            <span className="mb-2 flex items-center gap-2 text-xs font-medium text-ink-600"><Move className="h-3.5 w-3.5 rotate-90" /> Vertical</span>
            <input className="w-full accent-brand-500" type="range" min="0" max="1" step="0.01" disabled={!image || saving} value={position.y} onChange={(event) => setPosition((current) => ({ ...current, y: Number(event.target.value) }))} />
          </label>
          <p className="self-end text-xs leading-5 text-ink-500">You can also drag directly on the photo.</p>
        </div>
      </div>
    </Modal>
  );
};
