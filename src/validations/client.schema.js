import { z } from 'zod';

const optional = (schema) => schema.optional().or(z.literal(''));

export const clientSchema = z
  .object({
    name: z.string().trim().min(1, 'Client name is required').max(160, 'Too long'),
    contactPerson: optional(z.string().trim().max(120, 'Too long')),
    type: z.enum(['individual', 'business']),
    email: optional(z.string().trim().email('Enter a valid email address')),
    phone: optional(z.string().trim().regex(/^[+]?[\d\s\-()]{6,20}$/, 'Enter a valid phone number')),
    alternatePhone: optional(
      z.string().trim().regex(/^[+]?[\d\s\-()]{6,20}$/, 'Enter a valid phone number'),
    ),
    gstin: optional(z.string().trim().regex(/^[0-9A-Za-z]{15}$/, 'A GSTIN is 15 characters')),
    pan: optional(z.string().trim().regex(/^[A-Za-z]{5}[0-9]{4}[A-Za-z]$/, 'Enter a valid PAN')),
    placeOfSupply: optional(z.string().trim().max(120, 'Too long')),
    status: z.enum(['lead', 'active', 'inactive', 'archived']),
    source: z.enum(['referral', 'instagram', 'website', 'walk_in', 'repeat', 'other']),
    tags: z.array(z.string()).max(12, 'Up to 12 tags'),
    notes: optional(z.string().trim().max(2000, 'Too long')),
    address: z.object({
      line1: optional(z.string().trim().max(200)),
      line2: optional(z.string().trim().max(200)),
      city: optional(z.string().trim().max(100)),
      state: optional(z.string().trim().max(100)),
      pincode: optional(z.string().trim().max(20)),
      country: optional(z.string().trim().max(100)),
    }),
  })
  // Mirrors the server rule: a client must be reachable somehow.
  .refine((data) => Boolean(data.email || data.phone), {
    message: 'Add at least an email or a phone number',
    path: ['phone'],
  });

export const CLIENT_SOURCE_OPTIONS = [
  { value: 'referral', label: 'Referral' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'website', label: 'Website' },
  { value: 'walk_in', label: 'Walk-in' },
  { value: 'repeat', label: 'Repeat client' },
  { value: 'other', label: 'Other' },
];

export const clientDefaults = (client) => ({
  name: client?.name ?? '',
  contactPerson: client?.contactPerson ?? '',
  type: client?.type ?? 'business',
  email: client?.email ?? '',
  phone: client?.phone ?? '',
  alternatePhone: client?.alternatePhone ?? '',
  gstin: client?.gstin ?? '',
  pan: client?.pan ?? '',
  placeOfSupply: client?.placeOfSupply ?? '',
  status: client?.status ?? 'lead',
  source: client?.source ?? 'other',
  tags: client?.tags ?? [],
  notes: client?.notes ?? '',
  address: {
    line1: client?.address?.line1 ?? '',
    line2: client?.address?.line2 ?? '',
    city: client?.address?.city ?? '',
    state: client?.address?.state ?? '',
    pincode: client?.address?.pincode ?? '',
    country: client?.address?.country ?? 'India',
  },
});
