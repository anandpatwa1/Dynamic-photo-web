import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Hash, ScrollText, Settings2 } from 'lucide-react';
import toast from 'react-hot-toast';

import { Input, NumberInput, Textarea, Switch, SegmentedControl, Badge } from '@/components/ui';
import { FormSection, FieldGrid, FieldSpan } from '@/components/forms/FormSection';
import { TermsEditor, termsToFields, fieldsToTerms } from '@/components/forms/TermsEditor';
import {documentSettingsSchema} from '@/validations/settings.schema';
import { keepCleared } from '@/utils/pruneEmpty';
import { saveSettings } from '@/redux/setting/settingsSlice';
import { DOCUMENT_TYPE_OPTIONS } from '@/constants';

const typeDefaults = (config = {}, fallbackPrefix, fallbackValidity) => ({
  prefix: config.prefix ?? fallbackPrefix,
  validityDays: config.validityDays ?? fallbackValidity,
  notes: config.notes ?? '',
  terms: termsToFields(config.terms ?? []),
});

const toDefaults = (documents = {}) => ({
  currencySymbol: documents.currencySymbol ?? '₹',
  taxLabel: documents.taxLabel ?? 'GST',
  taxPercent: documents.taxPercent ?? 0,
  numberPadding: documents.numberPadding ?? 3,
  resetNumberingYearly: documents.resetNumberingYearly ?? true,
  showHsn: documents.showHsn ?? true,
  footerNote: documents.footerNote ?? '',
  thankYouNote: documents.thankYouNote ?? '',
  quotation: typeDefaults(documents.quotation, 'QT', 15),
  estimate: typeDefaults(documents.estimate, 'ES', 15),
  invoice: typeDefaults(documents.invoice, 'INV', 7),
});

export const DocumentsTab = ({ settings, saving, nextNumbers }) => {
  const dispatch = useDispatch();
  const [activeType, setActiveType] = useState('quotation');

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(documentSettingsSchema),
    defaultValues: toDefaults(settings?.documents),
  });

  useEffect(() => {
    if (settings?.documents) reset(toDefaults(settings.documents));
  }, [settings?.documents, reset]);

  const onSubmit = async (values) => {
    // Terms travel as `[{value}]` in the form; the API expects `[string]`.
    const payload = {
      ...values,
      quotation: { ...values.quotation, terms: fieldsToTerms(values.quotation.terms) },
      estimate: { ...values.estimate, terms: fieldsToTerms(values.estimate.terms) },
      invoice: { ...values.invoice, terms: fieldsToTerms(values.invoice.terms) },
    };

    const result = await dispatch(saveSettings({ documents: keepCleared(payload) }));
    if (saveSettings.fulfilled.match(result)) toast.success('Document defaults saved');
  };

  const activeLabel = DOCUMENT_TYPE_OPTIONS.find((option) => option.value === activeType)?.label;

  return (
    <div className="space-y-6">
      <FormSection
        title="Pricing defaults"
        description="Applied to new documents. You can still override them per document."
        icon={Settings2}
        onSubmit={handleSubmit(onSubmit)}
        saving={saving}
        dirty={isDirty}
      >
        <FieldGrid columns={3}>
          <Input
            label="Currency symbol"
            error={errors.currencySymbol?.message}
            {...register('currencySymbol')}
          />
          <Input
            label="Tax label"
            placeholder="GST"
            error={errors.taxLabel?.message}
            {...register('taxLabel')}
          />
          <NumberInput
            label="Default tax %"
            suffix="%"
            error={errors.taxPercent?.message}
            {...register('taxPercent')}
          />
        </FieldGrid>

        <div className="space-y-4 border-t border-ink-200/70 pt-5">
          <Switch
            label="Show the HSN / SAC column"
            description="Turn this off if you do not report service codes."
            {...register('showHsn')}
          />
        </div>
      </FormSection>

      <FormSection
        title="Numbering"
        description="How document numbers are generated. Existing documents keep their number."
        icon={Hash}
        onSubmit={handleSubmit(onSubmit)}
        saving={saving}
        dirty={isDirty}
      >
        <FieldGrid columns={3}>
          <NumberInput
            label="Digits in the sequence"
            step="1"
            hint="3 gives 001, 4 gives 0001"
            error={errors.numberPadding?.message}
            {...register('numberPadding')}
          />
          <FieldSpan className="sm:col-span-2">
            <Switch
              label="Restart numbering each financial year"
              description="Adds the financial year to the number, e.g. QT-2627-001."
              {...register('resetNumberingYearly')}
            />
          </FieldSpan>
        </FieldGrid>

        {nextNumbers && Object.keys(nextNumbers).length > 0 && (
          <div className="flex flex-wrap items-center gap-2 rounded-xl bg-ink-50 px-4 py-3">
            <span className="text-sm text-ink-500">Next numbers:</span>
            {DOCUMENT_TYPE_OPTIONS.map((option) => (
              <Badge key={option.value} tone="neutral" className="tabular">
                {option.label}: {nextNumbers[option.value] ?? '—'}
              </Badge>
            ))}
          </div>
        )}
      </FormSection>

      <FormSection
        title="Terms & notes"
        description="Defaults pulled into each new document. Every document remains editable."
        icon={ScrollText}
        onSubmit={handleSubmit(onSubmit)}
        saving={saving}
        dirty={isDirty}
      >
        <SegmentedControl
          options={DOCUMENT_TYPE_OPTIONS.map(({ value, label }) => ({ value, label }))}
          value={activeType}
          onChange={setActiveType}
        />

        {/* All three panes stay mounted so switching tabs never drops edits. */}
        {DOCUMENT_TYPE_OPTIONS.map((option) => (
          <div
            key={option.value}
            hidden={option.value !== activeType}
            className="space-y-5 pt-1"
          >
            <FieldGrid>
              <Input
                label="Number prefix"
                className="uppercase"
                error={errors[option.value]?.prefix?.message}
                {...register(`${option.value}.prefix`)}
              />
              <NumberInput
                label={option.value === 'invoice' ? 'Payment due in (days)' : 'Valid for (days)'}
                step="1"
                error={errors[option.value]?.validityDays?.message}
                {...register(`${option.value}.validityDays`)}
              />
            </FieldGrid>

            <TermsEditor
              control={control}
              register={register}
              name={`${option.value}.terms`}
              errors={errors[option.value]?.terms}
              label={`${option.label} terms & conditions`}
              hint="Printed as a bulleted list. Drag to reorder."
            />

            <Textarea
              label="Closing note"
              rows={3}
              placeholder="We look forward to working with you…"
              hint="Shown in the highlighted note box."
              error={errors[option.value]?.notes?.message}
              {...register(`${option.value}.notes`)}
            />
          </div>
        ))}

        <div className="space-y-5 border-t border-ink-200/70 pt-5">
          <p className="text-sm font-medium text-ink-700">
            Shared across all document types
            <span className="ml-2 font-normal text-ink-400">
              (currently editing {activeLabel} above)
            </span>
          </p>
          <Textarea
            label="Thank-you note"
            rows={2}
            error={errors.thankYouNote?.message}
            {...register('thankYouNote')}
          />
          <Input
            label="Footer line"
            placeholder="Thank you for your trust in Dynamic Production"
            error={errors.footerNote?.message}
            {...register('footerNote')}
          />
        </div>
      </FormSection>
    </div>
  );
};
