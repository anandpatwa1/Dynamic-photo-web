import { z } from 'zod';

const optional = (schema) => schema.optional().or(z.literal(''));

const discountSchema = z.object({
  type: z.enum(['flat', 'percent']),
  value: z.coerce.number().min(0, 'Cannot be negative'),
});

export const documentItemSchema = z
  .object({
    package: z.string().optional().nullable(),
    name: z.string().trim().min(1, 'Describe this line item').max(200, 'Too long'),
    description: optional(z.string().trim().max(1000, 'Too long')),
    deliverables: z.array(z.string()).default([]),
    hsn: optional(z.string().trim().max(20, 'Too long')),
    quantity: z.coerce.number().min(0, 'Cannot be negative').max(100000, 'Too large'),
    unitLabel: optional(z.string().trim().max(40, 'Too long')),
    rate: z.coerce.number().min(0, 'Cannot be negative').max(100000000, 'Too large'),
    discount: discountSchema,
    taxPercent: z.coerce.number().min(0, 'Cannot be negative').max(100, 'Cannot exceed 100'),
  })
  .refine((item) => item.discount.type !== 'percent' || item.discount.value <= 100, {
    message: 'Cannot exceed 100%',
    path: ['discount', 'value'],
  })
  .refine(
    (item) => item.discount.type !== 'flat' || item.discount.value <= item.quantity * item.rate,
    { message: 'More than the line total', path: ['discount', 'value'] },
  );

export const documentSchema = z
  .object({
    type: z.enum(['quotation', 'estimate', 'invoice']),
    client: z.string().min(1, 'Choose a client'),
    date: z.string().min(1, 'Pick a date'),
    validUntil: optional(z.string()),
    subject: optional(z.string().trim().max(200, 'Too long')),
    placeOfSupply: optional(z.string().trim().max(120, 'Too long')),
    items: z.array(documentItemSchema).min(1, 'Add at least one line item'),
    discount: discountSchema,
    roundOff: z.boolean(),
    terms: z.array(z.object({ value: z.string().trim().max(600, 'Too long') })),
    notes: optional(z.string().trim().max(1000, 'Too long')),
    internalNotes: optional(z.string().trim().max(2000, 'Too long')),
    theme: z.enum(['gold', 'olive']),
  })
  .refine(
    (data) => data.discount.type !== 'percent' || data.discount.value <= 100,
    { message: 'A percentage discount cannot exceed 100%', path: ['discount', 'value'] },
  );

export const emptyItem = () => ({
  package: null,
  name: '',
  description: '',
  deliverables: [],
  hsn: '',
  quantity: 1,
  unitLabel: '',
  rate: 0,
  discount: { type: 'flat', value: 0 },
  taxPercent: 0,
});

/** Maps a package from the picker onto a line item, filling everything at once. */
export const itemFromPackage = (pkg) => ({
  package: pkg._id,
  name: pkg.name,
  description: pkg.description ?? '',
  deliverables: pkg.deliverables ?? [],
  hsn: pkg.hsn ?? '',
  quantity: 1,
  unitLabel: pkg.unitLabel ?? '',
  rate: pkg.price ?? 0,
  discount: {
    type: pkg.discount?.type ?? 'flat',
    value: pkg.discount?.value ?? 0,
  },
  taxPercent: pkg.taxPercent ?? 0,
});

const toDateInput = (value) => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
};

export const documentDefaults = (doc, { type = 'quotation', theme = 'gold', terms = [] } = {}) => ({
  type: doc?.type ?? type,
  client: doc?.client?._id ?? doc?.client ?? '',
  date: toDateInput(doc?.date) || new Date().toISOString().slice(0, 10),
  validUntil: toDateInput(doc?.validUntil),
  subject: doc?.subject ?? '',
  placeOfSupply: doc?.placeOfSupply ?? '',
  items: doc?.items?.length
    ? doc.items.map((item) => ({
        package: item.package ?? null,
        name: item.name ?? '',
        description: item.description ?? '',
        deliverables: item.deliverables ?? [],
        hsn: item.hsn ?? '',
        quantity: item.quantity ?? 1,
        unitLabel: item.unitLabel ?? '',
        rate: item.rate ?? 0,
        discount: { type: item.discount?.type ?? 'flat', value: item.discount?.value ?? 0 },
        taxPercent: item.taxPercent ?? 0,
      }))
    : [emptyItem()],
  discount: {
    type: doc?.discount?.type ?? 'flat',
    value: doc?.discount?.value ?? 0,
  },
  roundOff: doc?.roundOff ?? false,
  terms: (doc?.terms ?? terms).map((value) => ({ value })),
  notes: doc?.notes ?? '',
  internalNotes: doc?.internalNotes ?? '',
  theme: doc?.theme ?? theme,
});

const round2 = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

const applyDiscount = (base, discount = {}) => {
  const raw =
    discount.type === 'percent'
      ? (base * (Number(discount.value) || 0)) / 100
      : Number(discount.value) || 0;
  return round2(Math.min(Math.max(raw, 0), base));
};

/**
 * Mirrors the server's totals service exactly, so the form previews the same
 * numbers the API will compute and store. The server remains authoritative.
 */
export const computeDocumentTotals = ({ items = [], discount, roundOff = false } = {}) => {
  const lines = items.map((item) => {
    const gross = round2(Math.max(Number(item.quantity) || 0, 0) * Math.max(Number(item.rate) || 0, 0));
    const lineDiscount = applyDiscount(gross, item.discount);
    return { gross, discountAmount: lineDiscount, net: round2(gross - lineDiscount), taxPercent: Number(item.taxPercent) || 0 };
  });

  const subtotal = round2(lines.reduce((sum, line) => sum + line.gross, 0));
  const itemDiscountTotal = round2(lines.reduce((sum, line) => sum + line.discountAmount, 0));
  const netAfterItems = round2(subtotal - itemDiscountTotal);
  const documentDiscount = applyDiscount(netAfterItems, discount);

  let allocated = 0;
  lines.forEach((line, index) => {
    const isLast = index === lines.length - 1;
    const share = netAfterItems > 0 ? round2((documentDiscount * line.net) / netAfterItems) : 0;
    line.allocated = isLast ? round2(documentDiscount - allocated) : share;
    allocated = round2(allocated + line.allocated);
    line.taxable = round2(Math.max(line.net - line.allocated, 0));
    line.tax = round2((line.taxable * line.taxPercent) / 100);
  });

  const taxableAmount = round2(lines.reduce((sum, line) => sum + line.taxable, 0));
  const taxTotal = round2(lines.reduce((sum, line) => sum + line.tax, 0));
  const grand = round2(taxableAmount + taxTotal);
  const total = roundOff ? Math.round(grand) : grand;

  return {
    subtotal,
    discountTotal: round2(itemDiscountTotal + documentDiscount),
    taxableAmount,
    taxTotal,
    roundOffAmount: round2(total - grand),
    total,
  };
};
