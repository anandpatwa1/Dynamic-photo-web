import { z } from 'zod';
import { PDF_THEMES } from '@/constants';

const optional = (schema) => schema.optional().or(z.literal(''));

export const companySchema = z.object({
  name: z.string().trim().min(1, 'Company name is required').max(160, 'Too long'),
  tagline: optional(z.string().trim().max(160, 'Too long')),
  email: optional(z.string().trim().email('Enter a valid email address')),
  phone: optional(z.string().trim().regex(/^[+]?[\d\s\-()]{6,20}$/, 'Enter a valid phone number')),
  alternatePhone: optional(
    z.string().trim().regex(/^[+]?[\d\s\-()]{6,20}$/, 'Enter a valid phone number'),
  ),
  website: optional(z.string().trim().url('Enter a full URL, e.g. https://studio.com')),
  gstin: optional(z.string().trim().regex(/^[0-9A-Za-z]{15}$/, 'A GSTIN is 15 characters')),
  pan: optional(z.string().trim().regex(/^[A-Za-z]{5}[0-9]{4}[A-Za-z]$/, 'Enter a valid PAN')),
  placeOfSupply: optional(z.string().trim().max(120, 'Too long')),
  address: z.object({
    line1: optional(z.string().trim().max(200)),
    line2: optional(z.string().trim().max(200)),
    city: optional(z.string().trim().max(100)),
    state: optional(z.string().trim().max(100)),
    pincode: optional(z.string().trim().max(20)),
    country: optional(z.string().trim().max(100)),
  }),
});

export const bankSchema = z.object({
  accountName: optional(z.string().trim().max(160)),
  accountNumber: optional(z.string().trim().max(40)),
  ifsc: optional(z.string().trim().regex(/^[A-Za-z]{4}0[A-Za-z0-9]{6}$/, 'Enter a valid IFSC code')),
  bankName: optional(z.string().trim().max(120)),
  branch: optional(z.string().trim().max(120)),
  upiId: optional(
    z.string().trim().regex(/^[\w.\-]{2,64}@[a-zA-Z]{2,64}$/, 'Enter a valid UPI ID, e.g. studio@upi'),
  ),
  upiName: optional(z.string().trim().max(120)),
});

export const brandingSchema = z.object({
  signatoryName: optional(z.string().trim().max(120)),
  signatoryLabel: optional(z.string().trim().max(60)),
  /*
   * Derived from the shared constant rather than restated. The list was
   * hardcoded to gold and olive, so the four themes added later rendered as
   * choices in the form and then failed validation on save — the picker
   * offered options it would not accept.
   */
  pdfTheme: z.enum(PDF_THEMES.map((theme) => theme.value)),
});

const documentTypeDefaults = z.object({
  prefix: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9]{1,8}$/, 'Use 1–8 letters or numbers'),
  validityDays: z.coerce.number().int().min(0, 'Cannot be negative').max(365, 'Too long'),
  notes: optional(z.string().trim().max(1000, 'Too long')),
  terms: z.array(z.object({ value: z.string().trim().max(600, 'This term is too long') })),
});

export const documentSettingsSchema = z.object({
  currencySymbol: z.string().trim().min(1, 'Required').max(4, 'Too long'),
  taxLabel: optional(z.string().trim().max(20)),
  taxPercent: z.coerce.number().min(0, 'Cannot be negative').max(100, 'Cannot exceed 100'),
  numberPadding: z.coerce.number().int().min(1, 'At least 1').max(8, 'At most 8'),
  resetNumberingYearly: z.boolean(),
  showHsn: z.boolean(),
  footerNote: optional(z.string().trim().max(200, 'Too long')),
  thankYouNote: optional(z.string().trim().max(500, 'Too long')),
  quotation: documentTypeDefaults,
  estimate: documentTypeDefaults,
  invoice: documentTypeDefaults,
});
