import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useForm, useWatch, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';

import {
  Button,
  FormError,
  Input,
  Modal,
  NumberInput,
  SegmentedControl,
  Select,
  Switch,
  Textarea,
} from '@/components/ui';
import { FieldGrid } from '@/components/forms/FormSection';
import { TermsEditor, fieldsToTerms } from '@/components/forms/TermsEditor';
import {
  packageSchema,
  packageDefaults,
  computePackageTotals,
  PACKAGE_UNIT_OPTIONS,
} from '@/validations/package.schema';
import {
  createPackage,
  updatePackage,
  selectPackageSaving,
  selectPackageError,
  selectPackageFieldErrors,
} from '@/redux/package/packageSlice';
import { useServerErrors } from '@/hooks/useServerErrors';
import { PACKAGE_CATEGORIES, DISCOUNT_TYPES } from '@/constants';
import { formatCurrency } from '@/utils/format';

/** Live mirror of the price block that will be printed on the document. */
const PricePreview = ({ price, discount }) => {
  const { subtotal, discountAmount, total } = computePackageTotals({ price, discount });

  return (
    <div className="overflow-hidden rounded-xl ring-1 ring-inset ring-ink-200">
      <div className="bg-ink-900 px-4 py-2.5">
        <p className="text-2xs font-semibold uppercase tracking-wider text-brand-300">
          Price Summary
        </p>
      </div>
      <dl className="divide-y divide-ink-200/70 bg-white">
        <div className="flex items-center justify-between px-4 py-2.5">
          <dt className="text-sm text-ink-600">Subtotal</dt>
          <dd className="tabular text-sm font-medium text-ink-900">{formatCurrency(subtotal)}</dd>
        </div>
        <div className="flex items-center justify-between px-4 py-2.5">
          <dt className="text-sm text-ink-600">Discount</dt>
          <dd className="tabular text-sm font-medium text-danger-600">
            {discountAmount > 0 ? `- ${formatCurrency(discountAmount)}` : formatCurrency(0)}
          </dd>
        </div>
        <div className="flex items-center justify-between bg-cream px-4 py-3">
          <dt className="text-base font-semibold text-ink-900">Total</dt>
          <dd className="tabular text-base font-semibold text-ink-900">{formatCurrency(total)}</dd>
        </div>
      </dl>
    </div>
  );
};

export const PackageFormModal = ({ open, onClose, package: pkg, onSaved }) => {
  const dispatch = useDispatch();
  const saving = useSelector(selectPackageSaving);
  const error = useSelector(selectPackageError);
  const fieldErrors = useSelector(selectPackageFieldErrors);

  const isEdit = Boolean(pkg?._id);

  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(packageSchema),
    defaultValues: packageDefaults(pkg),
  });

  useServerErrors(fieldErrors, setError);

  useEffect(() => {
    if (open) reset(packageDefaults(pkg));
  }, [open, pkg, reset]);

  const price = useWatch({ control, name: 'price' });
  const discount = useWatch({ control, name: 'discount' });

  const onSubmit = async (values) => {
    const payload = {
      ...values,
      deliverables: fieldsToTerms(values.deliverables),
      terms: fieldsToTerms(values.terms),
    };

    const result = isEdit
      ? await dispatch(updatePackage({ id: pkg._id, payload }))
      : await dispatch(createPackage(payload));

    const thunk = isEdit ? updatePackage : createPackage;
    if (thunk.fulfilled.match(result)) {
      toast.success(isEdit ? 'Package updated' : 'Package created');
      onSaved?.(result.payload.package);
      onClose();
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="2xl"
      title={isEdit ? 'Edit package' : 'New package'}
      description="Everything here pre-fills a document the moment this package is selected."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(onSubmit)} loading={saving}>
            {isEdit ? 'Save package' : 'Create package'}
          </Button>
        </>
      }
    >
      <FormError error={error} fieldErrors={fieldErrors} className="mb-5" />

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-8 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          <FieldGrid columns={1}>
            <Input
              label="Package name"
              required
              placeholder="Monthly Content Creation Package (Up to 15 Reels)"
              error={errors.name?.message}
              {...register('name')}
            />
            <Textarea
              label="Description"
              rows={3}
              placeholder="Includes professional shooting, editing and delivery of up to 15 high-quality iPhone reels."
              hint="Becomes the line-item description on the document."
              error={errors.description?.message}
              {...register('description')}
            />
          </FieldGrid>

          <FieldGrid>
            <Select
              label="Category"
              options={PACKAGE_CATEGORIES}
              error={errors.category?.message}
              {...register('category')}
            />
            <Select
              label="Billing unit"
              options={PACKAGE_UNIT_OPTIONS}
              error={errors.unit?.message}
              {...register('unit')}
            />
            <Input
              label="Quantity label"
              placeholder="1 Month"
              hint="Printed in the QTY column"
              error={errors.unitLabel?.message}
              {...register('unitLabel')}
            />
            <Input
              label="HSN / SAC"
              optional
              placeholder="998383"
              error={errors.hsn?.message}
              {...register('hsn')}
            />
          </FieldGrid>

          <div className="border-t border-ink-200/70 pt-6">
            <TermsEditor
              control={control}
              register={register}
              name="deliverables"
              errors={errors.deliverables}
              label="Package includes"
              hint="Printed as the checklist on the document. Drag to reorder."
              max={30}
              rows={1}
              placeholder="Up to 15 professionally shot and edited iPhone reels"
              emptyText="No deliverables yet — list what the client actually receives."
              addLabel="Add deliverable"
            />
          </div>

          <div className="border-t border-ink-200/70 pt-6">
            <TermsEditor
              control={control}
              register={register}
              name="terms"
              errors={errors.terms}
              label="Package-specific terms"
              hint="Added to your default terms for this package only."
              emptyText="No extra terms — the document defaults will be used."
              addLabel="Add term"
            />
          </div>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-2xl bg-ink-50/70 p-5">
            <p className="mb-4 text-sm font-medium text-ink-700">Pricing</p>

            <div className="space-y-4">
              <NumberInput
                label="Price"
                required
                prefix="₹"
                error={errors.price?.message}
                {...register('price')}
              />

              <div>
                <p className="mb-1.5 text-sm font-medium text-ink-700">Discount</p>
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
                    aria-label="Discount value"
                    error={errors.discount?.value?.message}
                    wrapperClassName="flex-1"
                    {...register('discount.value')}
                  />
                </div>
                {errors.discount?.value?.message && (
                  <p className="mt-1.5 text-xs text-danger-600">{errors.discount.value.message}</p>
                )}
              </div>
            </div>

            <div className="mt-5">
              <PricePreview price={price} discount={discount} />
            </div>
          </div>

          <div className="space-y-4 rounded-2xl bg-ink-50/70 p-5">
            <p className="text-sm font-medium text-ink-700">Availability</p>
            <Switch
              label="Available for new documents"
              description="Inactive packages stay on past documents but leave the picker."
              {...register('isActive')}
            />
            <NumberInput
              label="Sort order"
              step="1"
              hint="Lower numbers appear first"
              error={errors.sortOrder?.message}
              {...register('sortOrder')}
            />
          </div>
        </div>
      </form>
    </Modal>
  );
};
