import { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useForm, useWatch, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, Save, Send } from 'lucide-react';
import toast from 'react-hot-toast';

import {
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  FormError,
  Input,
  NumberInput,
  PageHeader,
  PageLoader,
  SegmentedControl,
  Select,
  Switch,
  Textarea,
} from '@/components/ui';
import { FieldGrid } from '@/components/forms/FormSection';
import { TermsEditor, fieldsToTerms } from '@/components/forms/TermsEditor';
import { LineItemsEditor } from './LineItemsEditor';
import {
  documentSchema,
  documentDefaults,
  computeDocumentTotals,
} from '@/validations/document.schema';
import {
  createDocument,
  updateDocument,
  fetchDocument,
  selectCurrentDocument,
  selectDocumentSaving,
  selectDocumentError,
  selectDocumentFieldErrors,
  selectDocumentLoading,
  clearCurrentDocument,
} from '@/redux/document/documentSlice';
import { fetchClientOptions, selectClientOptions } from '@/redux/client/clientSlice';
import { fetchPackageOptions, selectPackageOptions } from '@/redux/package/packageSlice';
import { fetchPublicSettings, selectSettings, selectNextNumbers } from '@/redux/setting/settingsSlice';
import { useServerErrors } from '@/hooks/useServerErrors';
import { DOCUMENT_TYPE_OPTIONS, DISCOUNT_TYPES, PDF_THEMES } from '@/constants';
import { formatCurrency } from '@/utils/format';
import { cn } from '@/utils/cn';

/**
 * The sticky investment summary — styled as a dark hero panel, the same
 * surface the PDF uses for its own total. What you see composing the
 * document is what prints.
 */
const InvestmentHero = ({ totals, taxLabel, isInvoice }) => (
  <div className="overflow-hidden rounded-2xl bg-ink-950 text-white shadow-card">
    <div className="p-5">
      <p className="text-2xs font-semibold uppercase tracking-[0.2em] text-brand-300">
        {isInvoice ? 'Amount Due' : 'Total Investment'}
      </p>
      <p className="tabular mt-2 font-display text-4xl font-semibold leading-none">
        {formatCurrency(totals.total)}
      </p>
    </div>

    <dl className="space-y-2 border-t border-white/10 px-5 py-4 text-sm">
      <div className="flex items-center justify-between gap-3">
        <dt className="text-white/55">Subtotal</dt>
        <dd className="tabular text-white/90">{formatCurrency(totals.subtotal)}</dd>
      </div>
      {totals.discountTotal > 0 && (
        <div className="flex items-center justify-between gap-3">
          <dt className="text-white/55">Discount</dt>
          <dd className="tabular text-brand-300">− {formatCurrency(totals.discountTotal)}</dd>
        </div>
      )}
      {totals.taxTotal > 0 && (
        <div className="flex items-center justify-between gap-3">
          <dt className="text-white/55">{taxLabel || 'Tax'}</dt>
          <dd className="tabular text-white/90">{formatCurrency(totals.taxTotal)}</dd>
        </div>
      )}
      {Math.abs(totals.roundOffAmount) > 0.004 && (
        <div className="flex items-center justify-between gap-3">
          <dt className="text-white/55">Round off</dt>
          <dd className="tabular text-white/90">{formatCurrency(totals.roundOffAmount)}</dd>
        </div>
      )}
    </dl>
  </div>
);

export const DocumentForm = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const isEdit = Boolean(id);

  const current = useSelector(selectCurrentDocument);
  const loading = useSelector(selectDocumentLoading);
  const saving = useSelector(selectDocumentSaving);
  const error = useSelector(selectDocumentError);
  const fieldErrors = useSelector(selectDocumentFieldErrors);
  const clients = useSelector(selectClientOptions);
  const packages = useSelector(selectPackageOptions);
  const settings = useSelector(selectSettings);
  const nextNumbers = useSelector(selectNextNumbers);

  const initialType = searchParams.get('type') ?? 'quotation';

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(documentSchema),
    defaultValues: documentDefaults(null, { type: initialType }),
  });

  useServerErrors(fieldErrors, setError);

  useEffect(() => {
    dispatch(fetchClientOptions());
    dispatch(fetchPackageOptions());
    dispatch(fetchPublicSettings());
  }, [dispatch]);

  useEffect(() => {
    if (isEdit) dispatch(fetchDocument(id));
    return () => {
      if (isEdit) dispatch(clearCurrentDocument());
    };
  }, [dispatch, id, isEdit]);

  const type = useWatch({ control, name: 'type' });

  // Seed the form: an existing document, or settings defaults for a new one.
  useEffect(() => {
    if (isEdit && current?._id === id) {
      reset(documentDefaults(current));
    } else if (!isEdit && settings?.documents) {
      reset(
        documentDefaults(null, {
          type: initialType,
          theme: settings.branding?.pdfTheme ?? 'gold',
          terms: settings.documents?.[initialType]?.terms ?? [],
        }),
      );
    }
  }, [isEdit, current, id, settings, initialType, reset]);

  // Swapping the document type swaps in that type's default terms.
  useEffect(() => {
    if (isEdit || !settings?.documents || !type) return;
    const defaults = settings.documents[type]?.terms ?? [];
    setValue('terms', defaults.map((value) => ({ value })), { shouldDirty: false });
  }, [type, isEdit, settings, setValue]);

  const items = useWatch({ control, name: 'items' });
  const discount = useWatch({ control, name: 'discount' });
  const roundOff = useWatch({ control, name: 'roundOff' });

  const totals = useMemo(
    () => computeDocumentTotals({ items, discount, roundOff }),
    [items, discount, roundOff],
  );

  const submit = async (values, { send = false } = {}) => {
    const payload = {
      ...values,
      items: values.items.map((item) => ({
        ...item,
        package: item.package || undefined,
      })),
      terms: fieldsToTerms(values.terms),
      ...(send ? { status: 'sent' } : {}),
    };

    const result = isEdit
      ? await dispatch(updateDocument({ id, payload }))
      : await dispatch(createDocument(payload));

    const thunk = isEdit ? updateDocument : createDocument;
    if (thunk.fulfilled.match(result)) {
      const saved = result.payload.document;
      toast.success(isEdit ? 'Document saved' : `${saved.number} created`);
      navigate(`/CRM/documents/${saved._id}`);
    }
  };

  if (isEdit && loading && !current) return <PageLoader label="Loading document" />;

  const typeLabel = DOCUMENT_TYPE_OPTIONS.find((option) => option.value === type)?.label ?? 'Document';

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: 'Documents', to: '/documents' }, { label: isEdit ? current?.number ?? 'Edit' : 'New' }]}
        title={isEdit ? `Edit ${current?.number ?? typeLabel}` : `Compose a ${typeLabel}`}
        description={
          isEdit
            ? 'Totals are recalculated when you save.'
            : `This will be numbered ${nextNumbers?.[type] ?? '—'}.`
        }
        actions={
          <>
            <Button variant="secondary" onClick={() => navigate(-1)} disabled={saving}>
              Cancel
            </Button>
            <Button
              variant="secondary"
              icon={Save}
              onClick={handleSubmit((values) => submit(values))}
              loading={saving}
            >
              Save draft
            </Button>
            <Button
              icon={Send}
              onClick={handleSubmit((values) => submit(values, { send: true }))}
              loading={saving}
            >
              Save &amp; mark sent
            </Button>
          </>
        }
      />

      <FormError error={error} fieldErrors={fieldErrors} className="mb-6" />

      <form onSubmit={handleSubmit((values) => submit(values))} noValidate>
        <div className="grid gap-6 xl:grid-cols-3">
          <div className="space-y-6 xl:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="font-display">Who it's for</CardTitle>
              </CardHeader>
              <CardBody className="space-y-5">
                {!isEdit && (
                  <div>
                    <p className="mb-2 text-sm font-medium text-ink-700">Document type</p>
                    <Controller
                      control={control}
                      name="type"
                      render={({ field }) => (
                        <SegmentedControl
                          options={DOCUMENT_TYPE_OPTIONS.map(({ value, label }) => ({ value, label }))}
                          value={field.value}
                          onChange={field.onChange}
                        />
                      )}
                    />
                    <p className="mt-2 text-xs text-ink-500">
                      {DOCUMENT_TYPE_OPTIONS.find((option) => option.value === type)?.description}
                    </p>
                  </div>
                )}

                <FieldGrid>
                  <Select
                    label="Client"
                    required
                    disabled={isEdit}
                    placeholder="Choose a client…"
                    hint={isEdit ? 'The client cannot change after creation' : undefined}
                    options={clients.map((client) => ({ value: client._id, label: client.name }))}
                    error={errors.client?.message}
                    {...register('client')}
                  />
                  <Input
                    label="Subject"
                    placeholder="Monthly content retainer — August"
                    error={errors.subject?.message}
                    {...register('subject')}
                  />
                  <Input
                    label="Date"
                    type="date"
                    required
                    error={errors.date?.message}
                    {...register('date')}
                  />
                  <Input
                    label={type === 'invoice' ? 'Payment due by' : 'Valid until'}
                    type="date"
                    hint="Defaults from your settings if left blank"
                    error={errors.validUntil?.message}
                    {...register('validUntil')}
                  />
                  <Input
                    label="Place of supply"
                    placeholder="Indore, Madhya Pradesh"
                    error={errors.placeOfSupply?.message}
                    {...register('placeOfSupply')}
                  />
                </FieldGrid>
              </CardBody>
            </Card>

            <LineItemsEditor
              control={control}
              register={register}
              errors={errors}
              setValue={setValue}
              packages={packages}
            />

            <Card>
              <CardHeader>
                <CardTitle className="font-display">Terms &amp; notes</CardTitle>
              </CardHeader>
              <CardBody className="space-y-6">
                <TermsEditor
                  control={control}
                  register={register}
                  name="terms"
                  errors={errors.terms}
                  label="Terms & conditions"
                  hint="Pre-filled from your settings. Prints in two numbered columns."
                />

                <Textarea
                  label="Closing note"
                  rows={3}
                  placeholder="We look forward to working with you…"
                  hint="Printed in the highlighted note panel."
                  error={errors.notes?.message}
                  {...register('notes')}
                />

                <Textarea
                  label="Internal notes"
                  rows={2}
                  optional
                  hint="Never printed — visible only to your team."
                  error={errors.internalNotes?.message}
                  {...register('internalNotes')}
                />
              </CardBody>
            </Card>
          </div>

          <div className="space-y-6">
            <div className="xl:sticky xl:top-24 space-y-6">
              <InvestmentHero totals={totals} taxLabel={settings?.documents?.taxLabel} isInvoice={type === 'invoice'} />

              <Card>
                <CardHeader>
                  <CardTitle className="text-md">Document discount</CardTitle>
                </CardHeader>
                <CardBody className="space-y-4">
                  <div className="flex gap-2">
                    <Controller
                      control={control}
                      name="discount.type"
                      render={({ field }) => (
                        <SegmentedControl
                          options={DISCOUNT_TYPES}
                          value={field.value}
                          onChange={field.onChange}
                          className="shrink-0"
                        />
                      )}
                    />
                    <NumberInput
                      aria-label="Document discount value"
                      wrapperClassName="flex-1"
                      error={errors.discount?.value?.message}
                      {...register('discount.value')}
                    />
                  </div>

                  <Switch
                    label="Round off the total"
                    description="Rounds the grand total to the nearest rupee."
                    {...register('roundOff')}
                  />
                </CardBody>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-md">Proposal theme</CardTitle>
                </CardHeader>
                <CardBody>
                  <Controller
                    control={control}
                    name="theme"
                    render={({ field }) => (
                      <div role="radiogroup" aria-label="Proposal theme" className="space-y-2">
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
                                'relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left ring-1 ring-inset transition-all duration-150',
                                selected
                                  ? 'bg-brand-50/60 text-ink-900 ring-2 ring-brand-500'
                                  : 'bg-white text-ink-600 ring-ink-200 hover:ring-ink-300',
                              )}
                            >
                              <span className="flex gap-1">
                                {theme.swatch.map((color) => (
                                  <span
                                    key={color}
                                    className="h-4 w-4 rounded-full ring-1 ring-inset ring-ink-900/10"
                                    style={{ backgroundColor: color }}
                                    aria-hidden="true"
                                  />
                                ))}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block text-sm font-medium">{theme.label}</span>
                                {theme.description && (
                                  <span className="block truncate text-xs text-ink-400">
                                    {theme.description}
                                  </span>
                                )}
                              </span>
                              {selected && (
                                <Check className="h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  />
                </CardBody>
              </Card>
            </div>
          </div>
        </div>
      </form>
    </>
  );
};

export default DocumentForm;
