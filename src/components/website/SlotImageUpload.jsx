import { ImageCropModal } from '@/components/profile/ImageCropModal';
import { useCallback, useId, useRef, useState } from 'react';
import { AlertTriangle, ImageUp, Loader2, Trash2 } from 'lucide-react';
import { IMAGE_SLOTS, formatBytes, validateImage } from '@/constants/imageSlots';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/Button';

/**
 * Reads the real pixel dimensions of a chosen file.
 *
 * `createObjectURL` rather than a FileReader data URL: a 15 MB photograph
 * base64-encodes to ~20 MB of string, which is a noticeable stall on a laptop
 * and can fail outright on a phone.
 */
const readDimensions = (file) =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('That file could not be read as an image.'));
    };

    img.src = url;
  });

/**
 * Upload control bound to the client's image-slot rules.
 *
 * Validates in the browser first — not as security, but as courtesy. The server
 * is the authority and re-checks everything; doing it here means an admin on a
 * slow connection learns their crop is wrong immediately instead of after a
 * two-minute upload. The requirements are shown up front for the same reason.
 */
export const SlotImageUpload = ({
  slot: slotId,
  value,
  onUpload,
  onRemove,
  label,
  className,
  disabled = false,
}) => {
  const slot = IMAGE_SLOTS[slotId];
  const editableCrop = (slotId.startsWith('portfolioCover') || ['galleryPortrait','galleryLandscape'].includes(slotId));
  const [cropFile,setCropFile] = useState(null);
  const inputId = useId();
  const inputRef = useRef(null);
  const [errors, setErrors] = useState([]);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [alt, setAlt] = useState(value?.alt ?? '');

  const handleFile = useCallback(
    async (file, cropped = false) => {
      if (!file || !slot) return;
      setErrors([]);

      if (editableCrop && !cropped) { setCropFile(file); return; }
      let dimensions;
      try {
        dimensions = await readDimensions(file);
      } catch (error) {
        setErrors([error.message]);
        return;
      }

      const { valid, errors: problems } = validateImage({
        slotId,
        width: dimensions.width,
        height: dimensions.height,
        bytes: file.size,
      });

      if (!valid) {
        setErrors(problems);
        return false;
      }

      // Alt text is schema-required server-side; catching it here avoids a
      // round trip that fails on something the admin can fix in a second.
      if (!editableCrop && !alt.trim()) {
        setErrors(['Please describe this image for screen readers before uploading.']);
        return;
      }

      setBusy(true);
      try {
        await onUpload({ file, slot: slotId, alt: alt.trim() });
        return true;
      } catch (error) {
        const message =
          error?.response?.data?.message ?? error.message ?? 'That upload did not go through.';
        setErrors([message]);
        if (cropped) throw new Error(message);
      } finally {
        setBusy(false);
        if (inputRef.current) inputRef.current.value = '';
      }
    },
    [alt, onUpload, slot, slotId, editableCrop],
  );

  if (!slot) return <p className="text-sm text-danger-600">Unknown image slot “{slotId}”.</p>;

  const requirement = editableCrop ? 'Choose crop and zoom before upload · optimized for the web' : slot.autoCrop
    ? `Any aspect ratio · automatically cropped to ${slot.width}×${slot.height}px · max ${formatBytes(slot.maxBytes)}`
    : `${slot.width}×${slot.height}px · ${slot.orientation} · max ${formatBytes(slot.maxBytes)}`;

  return (
    <div className={cn('space-y-3', className)}>
      <ImageCropModal file={cropFile} kind="portfolio" aspect={slot.aspect} outputWidth={slot.width} onClose={()=>{setCropFile(null);if(inputRef.current)inputRef.current.value=''}} onConfirm={async file=>{const uploaded = await handleFile(file,true);if (!uploaded) throw new Error('Could not upload this image. Check its dimensions and try again.');setCropFile(null)}}/>
      {label && <p className="text-sm font-medium text-ink-800">{label}</p>}

      <div
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          if (!disabled) handleFile(event.dataTransfer.files?.[0]);
        }}
        className={cn(
          'relative overflow-hidden rounded-2xl border-2 border-dashed transition-colors',
          dragging ? 'border-brand-500 bg-brand-50/50' : 'border-ink-300 bg-ink-50/60',
          disabled && 'opacity-60',
        )}
      >
        {value?.url ? (
          <div className="relative">
            <img
              src={value.thumbnail || value.url}
              alt={value.alt || ''}
              className={cn("w-full object-cover", !slotId.startsWith('portfolioCover') && "h-44")}
              style={slotId.startsWith('portfolioCover') ? {aspectRatio: slot.aspect, maxWidth: 360} : undefined}
            />
            {onRemove && (
              <Button
                variant="secondary"
                size="sm"
                iconOnly
                icon={Trash2}
                onClick={onRemove}
                disabled={disabled || busy}
                aria-label="Remove this image"
                className="absolute right-2 top-2"
              />
            )}
          </div>
        ) : (
          <label
            htmlFor={inputId}
            className="flex h-44 cursor-pointer flex-col items-center justify-center gap-2 px-4 text-center"
          >
            {busy ? (
              <Loader2 className="h-6 w-6 animate-spin text-brand-500" aria-hidden="true" />
            ) : (
              <ImageUp className="h-6 w-6 text-ink-400" aria-hidden="true" strokeWidth={1.5} />
            )}
            <span className="text-sm font-medium text-ink-700">
              {busy ? 'Processing…' : 'Drop an image or browse'}
            </span>
            <span className="text-xs text-ink-500">{requirement}</span>
          </label>
        )}

        <input
          id={inputId}
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={disabled || busy}
          onChange={(event) => handleFile(event.target.files?.[0])}
          className="sr-only"
        />
      </div>

      <div>
        <label
          htmlFor={`${inputId}-alt`}
          className="text-xs font-medium uppercase tracking-wider text-ink-500"
        >
          Alt text ({editableCrop ? 'optional' : 'required'})
        </label>
        <input
          id={`${inputId}-alt`}
          value={alt}
          onChange={(event) => setAlt(event.target.value)}
          placeholder="Describe what the photograph shows"
          disabled={disabled}
          className="mt-1 w-full rounded-lg border border-ink-300 px-3 py-2 text-base focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        />
      </div>

      {value?.url && editableCrop && !busy && <Button variant="secondary" size="sm" disabled={disabled} onClick={async () => {
        setBusy(true); setErrors([]);
        try {
          const response = await fetch(value.url);
          if (!response.ok) throw new Error('Could not open the image. Please choose it with Replace image.');
          const blob = await response.blob();
          setCropFile(new File([blob], 'cover.jpg', {type: blob.type}));
        } catch(error) { setErrors([error.message]); }
        finally { setBusy(false); }
      }}>Crop current image</Button>}
      {value?.url && !busy && (
        <Button
          variant="secondary"
          size="sm"
          icon={ImageUp}
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
        >
          Replace image
        </Button>
      )}

      {errors.length > 0 && (
        // `role="alert"` so a screen reader announces the rejection rather than
        // leaving the admin waiting for an upload that never started.
        <ul role="alert" className="space-y-1.5 rounded-lg bg-danger-50 p-3">
          {errors.map((message) => (
            <li key={message} className="flex items-start gap-2 text-sm text-danger-700">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>{message}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
