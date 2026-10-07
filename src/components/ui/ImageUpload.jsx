import { useEffect, useRef, useState } from 'react';
import { ImageIcon, Trash2, UploadCloud } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Button } from './Button';

const MAX_SIZE = 5 * 1024 * 1024;
const ACCEPTED = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];

/**
 * Drag-and-drop image picker used for logo, signature, stamp and QR uploads.
 * Emits the raw `File` upward and renders a local object-URL preview so the
 * user sees the result before the form is submitted.
 */
export const ImageUpload = ({
  label,
  hint,
  value,
  onChange,
  onRemove,
  aspect = 'wide',
  className,
  disabled = false,
}) => {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');

  // Revoke the object URL when it is replaced or the component unmounts.
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const accept = (file) => {
    if (!file) return;
    if (!ACCEPTED.includes(file.type)) {
      setError('Use a PNG, JPG, WEBP or SVG file');
      return;
    }
    if (file.size > MAX_SIZE) {
      setError('Image must be under 5MB');
      return;
    }
    setError('');
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(file));
    onChange?.(file);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragging(false);
    if (disabled) return;
    accept(event.dataTransfer.files?.[0]);
  };

  const clear = () => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setError('');
    if (inputRef.current) inputRef.current.value = '';
    onRemove?.();
    onChange?.(null);
  };

  const source = preview || value;
  const aspectClass = aspect === 'square' ? 'aspect-square' : aspect === 'tall' ? 'aspect-[3/4]' : 'aspect-[16/7]';

  return (
    <div className={cn('w-full', className)}>
      {label && <p className="mb-1.5 text-sm font-medium text-ink-700">{label}</p>}

      <div
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={cn(
          'group relative flex w-full items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed bg-ink-50/60 transition-all duration-200 ease-smooth',
          aspectClass,
          dragging ? 'border-brand-400 bg-brand-50/70' : 'border-ink-200 hover:border-ink-300',
          error && 'border-danger-300 bg-danger-50/40',
          disabled && 'pointer-events-none opacity-60',
        )}
      >
        {source ? (
          <>
            {/* Checkerboard reveals transparency in logos and signatures. */}
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  'linear-gradient(45deg, #F0EFED 25%, transparent 25%), linear-gradient(-45deg, #F0EFED 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #F0EFED 75%), linear-gradient(-45deg, transparent 75%, #F0EFED 75%)',
                backgroundSize: '16px 16px',
                backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
              }}
              aria-hidden="true"
            />
            <img
              src={source}
              alt={label ? `${label} preview` : 'Preview'}
              className="relative h-full w-full object-contain p-4"
            />
            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-ink-950/45 opacity-0 backdrop-blur-[1px] transition-opacity duration-200 group-hover:opacity-100">
              <Button
                variant="secondary"
                size="sm"
                icon={UploadCloud}
                onClick={() => inputRef.current?.click()}
              >
                Replace
              </Button>
              <Button variant="danger" size="sm" icon={Trash2} onClick={clear}>
                Remove
              </Button>
            </div>
          </>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex h-full w-full flex-col items-center justify-center gap-2 px-4 text-center"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-ink-400 shadow-xs">
              <ImageIcon className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="text-sm font-medium text-ink-700">
              Drop an image or <span className="text-brand-600">browse</span>
            </span>
            <span className="text-xs text-ink-400">PNG, JPG, WEBP or SVG · up to 5MB</span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(',')}
        className="sr-only"
        onChange={(event) => accept(event.target.files?.[0])}
      />

      {error ? (
        <p className="mt-1.5 text-xs text-danger-600">{error}</p>
      ) : (
        hint && <p className="mt-1.5 text-xs text-ink-500">{hint}</p>
      )}
    </div>
  );
};
