import { useEffect, useRef, useState } from 'react';
import { Crop, Move, ZoomIn } from 'lucide-react';
import { Button, Modal } from '@/components/ui';

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

const cropRect = (image, aspect, zoom, position) => {
  const sourceAspect = image.naturalWidth / image.naturalHeight;
  const baseWidth = sourceAspect > aspect ? image.naturalHeight * aspect : image.naturalWidth;
  const baseHeight = sourceAspect > aspect ? image.naturalHeight : image.naturalWidth / aspect;
  const width = baseWidth / zoom;
  const height = baseHeight / zoom;
  return {
    x: (image.naturalWidth - width) * position.x,
    y: (image.naturalHeight - height) * position.y,
    width,
    height,
  };
};

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
export const ImageCropModal = ({ file, kind, onClose, onConfirm }) => {
  const canvasRef = useRef(null);
  const dragRef = useRef(null);
  const [image, setImage] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0.5, y: 0.5 });
  const [saving, setSaving] = useState(false);
  const isProfile = kind === 'profile';
  const aspect = isProfile ? 1 : 2;

  useEffect(() => {
    setImage(null);
    setZoom(1);
    setPosition({ x: 0.5, y: 0.5 });
    if (!file) return undefined;
    const url = URL.createObjectURL(file);
    const nextImage = new Image();
    nextImage.onload = () => setImage(nextImage);
    nextImage.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    if (!image) return undefined;
    const frame = requestAnimationFrame(() => drawCrop(canvasRef.current, image, aspect, zoom, position, 1000));
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
    setSaving(true);
    try {
      const canvas = document.createElement('canvas');
      const width = isProfile ? 1000 : 1800;
      drawCrop(canvas, image, aspect, zoom, position, width);
      const blob = await canvasBlob(canvas);
      const baseName = file.name.replace(/\.[^.]+$/, '') || kind;
      await onConfirm(new File([blob], `${baseName}-${kind}-cropped.jpg`, { type: blob.type }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={Boolean(file)}
      onClose={saving ? undefined : onClose}
      closeOnBackdrop={!saving}
      size="lg"
      title={isProfile ? 'Crop profile photo' : 'Crop cover photo'}
      description={isProfile ? 'Keep your face inside the square frame.' : 'Drag and zoom to create a wide 2:1 cover.'}
      footer={<><Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button><Button icon={Crop} loading={saving} disabled={!image} onClick={save}>Use this crop</Button></>}
    >
      <div className="space-y-5">
        <div className="overflow-hidden rounded-2xl bg-ink-950 shadow-inner" style={{ aspectRatio: String(aspect) }}>
          {image ? (
            <canvas
              ref={canvasRef}
              className="h-full w-full cursor-move touch-none object-cover"
              onPointerDown={startDrag}
              onPointerMove={drag}
              onPointerUp={() => { dragRef.current = null; }}
              onPointerCancel={() => { dragRef.current = null; }}
              aria-label="Photo crop preview. Drag to reposition."
            />
          ) : <div className="grid h-full place-items-center text-sm text-white/60">Preparing photo…</div>}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <label className="sm:col-span-3">
            <span className="mb-2 flex items-center gap-2 text-sm font-medium text-ink-700"><ZoomIn className="h-4 w-4" /> Zoom</span>
            <input className="w-full accent-brand-500" type="range" min="1" max="3" step="0.01" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} />
          </label>
          <label>
            <span className="mb-2 flex items-center gap-2 text-xs font-medium text-ink-600"><Move className="h-3.5 w-3.5" /> Horizontal</span>
            <input className="w-full accent-brand-500" type="range" min="0" max="1" step="0.01" value={position.x} onChange={(event) => setPosition((current) => ({ ...current, x: Number(event.target.value) }))} />
          </label>
          <label>
            <span className="mb-2 flex items-center gap-2 text-xs font-medium text-ink-600"><Move className="h-3.5 w-3.5 rotate-90" /> Vertical</span>
            <input className="w-full accent-brand-500" type="range" min="0" max="1" step="0.01" value={position.y} onChange={(event) => setPosition((current) => ({ ...current, y: Number(event.target.value) }))} />
          </label>
          <p className="self-end text-xs leading-5 text-ink-500">You can also drag directly on the photo.</p>
        </div>
      </div>
    </Modal>
  );
};
