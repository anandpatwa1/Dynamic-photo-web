import { z } from 'zod';

const optional = (schema) => schema.optional().or(z.literal(''));

export const PACKAGE_UNIT_OPTIONS = [
  { value: 'project', label: 'Per project' },
  { value: 'month', label: 'Per month' },
  { value: 'day', label: 'Per day' },
  { value: 'hour', label: 'Per hour' },
  { value: 'event', label: 'Per event' },
  { value: 'shoot', label: 'Per shoot' },
  { value: 'piece', label: 'Per piece' },
];

export const packageSchema = z
  .object({
    name: z.string().trim().min(1, 'Package name is required').max(160, 'Too long'),
    category: z.enum([
      'monthly_content',
      'wedding',
      'pre_wedding',
      'corporate',
      'product_shoot',
      'drone_shoot',
      'event',
      'portfolio',
      'other',
    ]),
    description: optional(z.string().trim().max(1000, 'Too long')),
    deliverables: z.array(z.object({ value: z.string().trim().max(300, 'Too long') })),
    terms: z.array(z.object({ value: z.string().trim().max(600, 'Too long') })),
    price: z.coerce.number().min(0, 'Price cannot be negative').max(100000000, 'Too large'),
    discount: z.object({
      type: z.enum(['flat', 'percent']),
      value: z.coerce.number().min(0, 'Cannot be negative'),
    }),
    unit: z.enum(['project', 'month', 'day', 'hour', 'event', 'shoot', 'piece']),
    unitLabel: optional(z.string().trim().max(40, 'Too long')),
    hsn: optional(z.string().trim().max(20, 'Too long')),
    isActive: z.boolean(),
    sortOrder: z.coerce.number().int(),
  })
  .refine((data) => data.discount.type !== 'percent' || data.discount.value <= 100, {
    message: 'A percentage discount cannot exceed 100%',
    path: ['discount', 'value'],
  })
  .refine((data) => data.discount.type !== 'flat' || data.discount.value <= data.price, {
    message: 'The discount cannot be more than the price',
    path: ['discount', 'value'],
  });

export const packageDefaults = (pkg) => ({
  name: pkg?.name ?? '',
  category: pkg?.category ?? 'monthly_content',
  description: pkg?.description ?? '',
  deliverables: (pkg?.deliverables ?? []).map((value) => ({ value })),
  terms: (pkg?.terms ?? []).map((value) => ({ value })),
  price: pkg?.price ?? 0,
  discount: {
    type: pkg?.discount?.type ?? 'flat',
    value: pkg?.discount?.value ?? 0,
  },
  unit: pkg?.unit ?? 'project',
  unitLabel: pkg?.unitLabel ?? '',
  hsn: pkg?.hsn ?? '',
  isActive: pkg?.isActive ?? true,
  sortOrder: pkg?.sortOrder ?? 0,
});

/** Mirrors the server's money maths so the form can preview the total live. */
export const computePackageTotals = ({ price = 0, discount = {} } = {}) => {
  const base = Number(price) || 0;
  const raw =
    discount.type === 'percent'
      ? (base * (Number(discount.value) || 0)) / 100
      : Number(discount.value) || 0;

  const discountAmount = Math.round(Math.min(Math.max(raw, 0), base) * 100) / 100;

  return {
    subtotal: base,
    discountAmount,
    total: Math.round((base - discountAmount) * 100) / 100,
  };
};
