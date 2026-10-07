import { useFieldArray, useWatch } from 'react-hook-form';
import { Check, ChevronDown, GripVertical, Package as PackageIcon, Plus, Trash2, X } from 'lucide-react';

import { Button, Input, NumberInput, Textarea, Dropdown, DropdownItem, DropdownLabel } from '@/components/ui';
import { emptyItem, itemFromPackage } from '@/validations/document.schema';
import { formatCurrency, humanize } from '@/utils/format';

/** Live per-line total, mirroring the server's line maths. */
const lineTotal = (item) => {
  const gross = (Number(item?.quantity) || 0) * (Number(item?.rate) || 0);
  const discount =
    item?.discount?.type === 'percent'
      ? (gross * (Number(item?.discount?.value) || 0)) / 100
      : Number(item?.discount?.value) || 0;
  return Math.max(gross - Math.min(Math.max(discount, 0), gross), 0);
};

/**
 * One package card — deliberately styled to echo what actually prints: a
 * numbered card with the name as a headline, the price top-right, and the
 * deliverables as a checked "Included" panel. Editing here should feel like
 * editing the proposal itself, not filling out a spreadsheet row.
 */
const PackageCard = ({ index, control, register, errors, remove, move, total, canRemove, setValue }) => {
  const item = useWatch({ control, name: `items.${index}` });
  const deliverables = item?.deliverables ?? [];

  return (
    <div className="group relative rounded-2xl bg-white shadow-card">
      <div className="flex items-start gap-3 p-4 sm:p-5">
        <div className="flex flex-col items-center gap-1.5 pt-1.5">
          <span className="font-display text-xl font-semibold leading-none text-brand-500">
            {index + 1}
          </span>
          <button
            type="button"
            onClick={() => index > 0 && move(index, index - 1)}
            disabled={index === 0}
            aria-label="Move package up"
            className="cursor-grab text-ink-300 transition-colors hover:text-ink-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <GripVertical className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <Input
            placeholder="Monthly Content Creation Package (Up to 15 Reels)"
            aria-label={`Package ${index + 1} name`}
            className="font-display text-lg font-semibold"
            error={errors?.items?.[index]?.name?.message}
            {...register(`items.${index}.name`)}
          />

          <Textarea
            rows={2}
            placeholder="What this covers — printed under the package name."
            aria-label={`Package ${index + 1} description`}
            error={errors?.items?.[index]?.description?.message}
            {...register(`items.${index}.description`)}
          />
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="tabular font-display text-xl font-semibold text-ink-900">
            {formatCurrency(total)}
          </span>
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            icon={Trash2}
            onClick={() => remove(index)}
            disabled={!canRemove}
            aria-label={`Remove package ${index + 1}`}
            className="text-ink-400 hover:text-danger-600"
          />
        </div>
      </div>

      <div className="grid gap-3 border-t border-ink-200/70 px-4 py-4 sm:grid-cols-12 sm:px-5">
        <NumberInput
          label="Qty"
          step="1"
          wrapperClassName="sm:col-span-2"
          error={errors?.items?.[index]?.quantity?.message}
          {...register(`items.${index}.quantity`)}
        />
        <Input
          label="Unit"
          placeholder="Month"
          wrapperClassName="sm:col-span-2"
          error={errors?.items?.[index]?.unitLabel?.message}
          {...register(`items.${index}.unitLabel`)}
        />
        <NumberInput
          label="Rate"
          prefix="₹"
          wrapperClassName="sm:col-span-3"
          error={errors?.items?.[index]?.rate?.message}
          {...register(`items.${index}.rate`)}
        />

        <div className="sm:col-span-3">
          <p className="mb-1.5 text-sm font-medium text-ink-700">Discount</p>
          <div className="flex gap-1.5">
            <select
              {...register(`items.${index}.discount.type`)}
              aria-label={`Package ${index + 1} discount type`}
              className="h-10 w-16 shrink-0 cursor-pointer rounded-xl bg-white px-2 text-base text-ink-700 shadow-xs ring-1 ring-inset ring-ink-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="flat">₹</option>
              <option value="percent">%</option>
            </select>
            <NumberInput
              aria-label={`Package ${index + 1} discount value`}
              wrapperClassName="flex-1"
              error={errors?.items?.[index]?.discount?.value?.message}
              {...register(`items.${index}.discount.value`)}
            />
          </div>
        </div>

        <Input
          label="HSN / SAC"
          optional
          wrapperClassName="sm:col-span-2"
          error={errors?.items?.[index]?.hsn?.message}
          {...register(`items.${index}.hsn`)}
        />
      </div>

      <div className="border-t border-dashed border-ink-200/70 bg-ink-50/50 px-4 py-4 sm:px-5">
        <div className="mb-2.5 flex items-center justify-between gap-3">
          <p className="text-2xs font-semibold uppercase tracking-wider text-ink-500">Included</p>
          {deliverables.length > 0 && (
            <button
              type="button"
              onClick={() => setValue(`items.${index}.deliverables`, [], { shouldDirty: true })}
              className="inline-flex items-center gap-1 text-xs text-ink-400 transition-colors hover:text-danger-600"
            >
              <X className="h-3 w-3" aria-hidden="true" />
              Clear
            </button>
          )}
        </div>

        {deliverables.length > 0 ? (
          <div className="grid gap-1.5 sm:grid-cols-2">
            {deliverables.map((deliverable, deliverableIndex) => (
              <span
                key={`${deliverable}-${deliverableIndex}`}
                className="group/chip flex items-start gap-2 rounded-lg py-1 pl-0.5 pr-1 text-sm text-ink-700"
              >
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                  <Check className="h-2.5 w-2.5" strokeWidth={3} aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">{deliverable}</span>
                <button
                  type="button"
                  aria-label={`Remove ${deliverable}`}
                  onClick={() =>
                    setValue(
                      `items.${index}.deliverables`,
                      deliverables.filter((_, i) => i !== deliverableIndex),
                      { shouldDirty: true },
                    )
                  }
                  className="shrink-0 rounded p-0.5 text-ink-300 opacity-0 transition-opacity hover:bg-ink-100 hover:text-danger-600 group-hover/chip:opacity-100"
                >
                  <X className="h-3 w-3" aria-hidden="true" />
                </button>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-ink-400">
            Pick a package to fill this in, or leave it empty for a plain line.
          </p>
        )}
      </div>
    </div>
  );
};

/**
 * The proposal's packages.
 *
 * Choosing a package fills a whole card — name, description, deliverables,
 * rate, discount and HSN — and every field stays editable afterwards. Each
 * card here is what prints as its own numbered package on the PDF.
 */
export const LineItemsEditor = ({ control, register, errors, setValue, packages = [] }) => {
  const { fields, append, remove, move, update } = useFieldArray({ control, name: 'items' });
  const items = useWatch({ control, name: 'items' }) ?? [];

  /**
   * The form always starts with one blank card so there's somewhere to type.
   * Adding the first package should fill that card rather than leaving an
   * empty, required "name" field stranded above it — which fails validation
   * silently (the button click never surfaces why "Save" did nothing).
   */
  const addBlock = (block) => {
    const onlyCardIsUntouched =
      items.length === 1 && !items[0]?.name?.trim() && !Number(items[0]?.rate);

    if (onlyCardIsUntouched) update(0, block);
    else append(block);
  };

  const addFromPackage = (pkg) => addBlock(itemFromPackage(pkg));

  const grouped = packages.reduce((accumulator, pkg) => {
    const key = pkg.category ?? 'other';
    (accumulator[key] ??= []).push(pkg);
    return accumulator;
  }, {});

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold text-ink-900">The Investment</h2>
          <p className="mt-0.5 text-sm text-ink-500">
            Pick a package to fill everything in, or write a custom line.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Dropdown
            align="right"
            menuClassName="max-h-96 w-80 overflow-y-auto scrollbar-slim"
            trigger={({ toggle }) => (
              <Button variant="secondary" icon={PackageIcon} iconRight={ChevronDown} onClick={toggle}>
                Add package
              </Button>
            )}
          >
            {packages.length === 0 ? (
              <p className="px-2.5 py-3 text-sm text-ink-500">
                No active packages yet. Create one under Packages.
              </p>
            ) : (
              Object.entries(grouped).map(([category, list]) => (
                <div key={category}>
                  <DropdownLabel>{humanize(category)}</DropdownLabel>
                  {list.map((pkg) => (
                    <DropdownItem key={pkg._id} onClick={() => addFromPackage(pkg)}>
                      <span className="flex w-full items-center justify-between gap-3">
                        <span className="min-w-0 truncate">{pkg.name}</span>
                        <span className="tabular shrink-0 text-xs text-ink-500">
                          {formatCurrency(pkg.netPrice ?? pkg.price)}
                        </span>
                      </span>
                    </DropdownItem>
                  ))}
                </div>
              ))
            )}
          </Dropdown>

          <Button variant="secondary" icon={Plus} onClick={() => addBlock(emptyItem())}>
            Custom line
          </Button>
        </div>
      </div>

      {typeof errors?.items?.message === 'string' && (
        <p className="mb-3 text-sm text-danger-600">{errors.items.message}</p>
      )}

      <div className="space-y-3">
        {fields.map((field, index) => (
          <PackageCard
            key={field.id}
            index={index}
            control={control}
            register={register}
            errors={errors}
            remove={remove}
            move={move}
            setValue={setValue}
            canRemove={fields.length > 1}
            total={lineTotal(items[index])}
          />
        ))}
      </div>
    </section>
  );
};
