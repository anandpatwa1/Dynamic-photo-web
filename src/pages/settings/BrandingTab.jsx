import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, PenLine, Palette, Stamp } from 'lucide-react';
import toast from 'react-hot-toast';

import { Input, ImageUpload } from '@/components/ui';
import { FormSection, FieldGrid } from '@/components/forms/FormSection';
import {brandingSchema} from '@/validations/settings.schema';
import { keepCleared } from '@/utils/pruneEmpty';
import { saveSettings, uploadBrandingAsset, removeBrandingAsset } from '@/redux/setting/settingsSlice';
import { PDF_THEMES } from '@/constants';
import { cn } from '@/utils/cn';

const ASSETS = [
  {
    key: 'logo',
    label: 'Studio logo',
    hint: 'Appears top-left on every document. A transparent PNG works best.',
    aspect: 'wide',
  },
  {
    key: 'signature',
    label: 'Signature',
    hint: 'Printed above the authorised signatory line.',
    aspect: 'wide',
  },
  {
    key: 'stamp',
    label: 'Company stamp',
    hint: 'Optional. Placed beside the signature.',
    aspect: 'square',
  },
  {
    key: 'qrCode',
    label: 'Payment QR',
    hint: 'Optional. Shown with your UPI details on invoices.',
    aspect: 'square',
  },
];

/** Miniature of the document header, rendered in each theme's palette. */
const ThemePreview = ({ theme }) => {
  const isGold = theme.value === 'gold';
  const [accent, dark, tint] = theme.swatch;

  return (
    <div className="overflow-hidden rounded-lg bg-white ring-1 ring-ink-200/70">
      <div className="flex items-start justify-between px-3 pt-3">
        <div className="space-y-1">
          <div className="h-1.5 w-12 rounded-full" style={{ backgroundColor: dark }} />
          <div className="h-1 w-8 rounded-full" style={{ backgroundColor: accent }} />
        </div>
        <div
          className={cn('font-display text-[0.6875rem] leading-none', isGold ? 'font-semibold' : 'font-medium')}
          style={{ color: isGold ? '#111111' : dark, letterSpacing: isGold ? 0 : '0.08em' }}
        >
          {isGold ? 'Quotation' : 'QUOTATION'}
        </div>
      </div>

      <div className="mt-2.5 px-3">
        <div className="h-px w-full" style={{ backgroundColor: accent, opacity: 0.5 }} />
      </div>

      <div className="mt-2.5 px-3 pb-3">
        <div className="flex h-3.5 items-center gap-2 rounded-t px-1.5" style={{ backgroundColor: isGold ? '#111111' : dark }}>
          <div className="h-1 w-6 rounded-full bg-white/70" />
          <div className="ml-auto h-1 w-5 rounded-full" style={{ backgroundColor: accent }} />
        </div>
        <div className="space-y-1 border-x border-b border-ink-200/70 px-1.5 py-1.5">
          <div className="h-1 w-full rounded-full bg-ink-200" />
          <div className="h-1 w-3/4 rounded-full bg-ink-200" />
        </div>
        <div className="mt-1 flex h-3 items-center justify-end rounded px-1.5" style={{ backgroundColor: tint }}>
          <div className="h-1 w-7 rounded-full" style={{ backgroundColor: dark, opacity: 0.65 }} />
        </div>
      </div>
    </div>
  );
};

export const BrandingTab = ({ settings, saving }) => {
  const dispatch = useDispatch();

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(brandingSchema),
    defaultValues: {
      signatoryName: settings?.branding?.signatoryName ?? '',
      signatoryLabel: settings?.branding?.signatoryLabel ?? 'Authorized Signature',
      pdfTheme: settings?.branding?.pdfTheme ?? 'gold',
    },
  });

  useEffect(() => {
    if (settings?.branding) {
      reset({
        signatoryName: settings.branding.signatoryName ?? '',
        signatoryLabel: settings.branding.signatoryLabel ?? 'Authorized Signature',
        pdfTheme: settings.branding.pdfTheme ?? 'gold',
      });
    }
  }, [settings?.branding, reset]);

  const onSubmit = async (values) => {
    const result = await dispatch(saveSettings({ branding: keepCleared(values) }));
    if (saveSettings.fulfilled.match(result)) toast.success('Branding saved');
  };

  const handleUpload = async (asset, file) => {
    if (!file) return;
    const result = await dispatch(uploadBrandingAsset({ asset, file }));
    if (uploadBrandingAsset.fulfilled.match(result)) toast.success('Image uploaded');
    else toast.error(result.payload?.message ?? 'Upload failed');
  };

  const handleRemove = async (asset) => {
    const result = await dispatch(removeBrandingAsset(asset));
    if (removeBrandingAsset.fulfilled.match(result)) toast.success('Image removed');
  };

  return (
    <div className="space-y-6">
      <FormSection
        title="Brand assets"
        description="Uploads save immediately and apply to every document you generate."
        icon={Stamp}
        as="div"
      >
        <FieldGrid>
          {ASSETS.map((asset) => (
            <ImageUpload
              key={asset.key}
              label={asset.label}
              hint={asset.hint}
              aspect={asset.aspect}
              value={settings?.branding?.[asset.key]?.url}
              onChange={(file) => file && handleUpload(asset.key, file)}
              onRemove={() =>
                settings?.branding?.[asset.key]?.url ? handleRemove(asset.key) : undefined
              }
            />
          ))}
        </FieldGrid>
      </FormSection>

      <FormSection
        title="Signature block"
        description="The name and label printed beneath your signature."
        icon={PenLine}
        onSubmit={handleSubmit(onSubmit)}
        saving={saving}
        dirty={isDirty}
      >
        <FieldGrid>
          <Input
            label="Signatory name"
            placeholder="For Dynamic Production"
            error={errors.signatoryName?.message}
            {...register('signatoryName')}
          />
          <Input
            label="Signature label"
            placeholder="Authorized Signature"
            error={errors.signatoryLabel?.message}
            {...register('signatoryLabel')}
          />
        </FieldGrid>
      </FormSection>

      <FormSection
        title="Document theme"
        description="Choose how your printed documents look. Both are print-ready A4."
        icon={Palette}
        onSubmit={handleSubmit(onSubmit)}
        saving={saving}
        dirty={isDirty}
      >
        <Controller
          control={control}
          name="pdfTheme"
          render={({ field }) => (
            <div role="radiogroup" aria-label="Document theme" className="grid gap-4 sm:grid-cols-2">
              {PDF_THEMES.map((theme) => {
                const selected = field.value === theme.value;

                return (
                  <button
                    key={theme.value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => field.onChange(theme.value)}
                    className={cn(
                      'group relative rounded-2xl p-4 text-left transition-all duration-200 ease-smooth',
                      'ring-1 ring-inset',
                      selected
                        ? 'bg-brand-50/50 ring-2 ring-brand-500'
                        : 'bg-white ring-ink-200 hover:ring-ink-300',
                    )}
                  >
                    {selected && (
                      <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-white">
                        <Check className="h-3 w-3" strokeWidth={3} aria-hidden="true" />
                      </span>
                    )}

                    <ThemePreview theme={theme} />

                    <p className="mt-3.5 text-base font-semibold text-ink-900">{theme.label}</p>
                    <p className="mt-0.5 text-sm text-ink-500">{theme.description}</p>

                    <div className="mt-3 flex gap-1.5">
                      {theme.swatch.map((color) => (
                        <span
                          key={color}
                          className="h-4 w-4 rounded-full ring-1 ring-inset ring-ink-900/10"
                          style={{ backgroundColor: color }}
                          aria-hidden="true"
                        />
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        />
      </FormSection>
    </div>
  );
};
