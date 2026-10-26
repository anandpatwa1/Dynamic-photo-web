/**
 * Theme definition schema v1 (Master Spec A9).
 *
 * SHARED FILE — identical copy lives in client/src/wedding-quote/utils/engine/.
 *
 * The zod schema is the single source of truth: the JSON-Schema export, the
 * example theme and the "Copy basic AI prompt" text are all generated from it
 * so they can never drift apart.
 */
import { z } from 'zod';
import { FONT_FAMILIES } from './fontWhitelist.js';
import { THEME_LIMITS } from './themeLimits.js';
import { isColor } from './contrast.js';

export const THEME_SCHEMA_VERSION = 2;

const color = z.string().trim().refine(isColor, 'Use a hex (#RRGGBB) or rgba() colour');
const imageRef = z.string().trim().min(1).max(THEME_LIMITS.maxThemeJsonBytes).describe('asset file name from the zip (e.g. "bg.webp") or an inline data:image URI');
const px = (min, max) => z.number().min(min).max(max);

const blockStyle = z
  .object({
    align: z.enum(['left', 'center', 'right']).optional(),
    bg: color.optional(),
    borderColor: color.optional(),
    borderWidth: px(0, 12).optional(),
    radius: px(0, 999).optional().describe("corner radius in px; 999 = pill"),
    paddingX: px(0, 200).optional(),
    paddingY: px(0, 200).optional(),
    widthPct: px(20, 100).optional().describe('block width as % of the safe area'),
    uppercase: z.boolean().optional(),
    letterSpacing: px(-2, 20).optional(),
    font: z.enum(['title', 'body', 'number', 'script']).optional(),
    color: color.optional(),
  })
  .strict();

export const themeDefinitionSchema = z
  .object({
    schemaVersion: z.number().int().min(1).max(THEME_SCHEMA_VERSION),
    name: z.string().trim().min(2).max(80),
    forDays: z.array(z.number().int().min(1).max(10)).min(1).max(10),
    canvas: z
      .object({
        bg: color,
        backgroundImage: imageRef.optional(),
        backgroundSize: z.enum(['cover', 'contain', 'repeat']).optional(),
        overlay: color.optional().describe('colour laid over the background image, e.g. rgba(255,250,240,0.55)'),
        frame: z.object({ image: imageRef, inset: px(0, 200) }).strict().optional(),
      })
      .strict(),
    safeArea: z
      .object({ top: px(0, 40), right: px(0, 40), bottom: px(0, 40), left: px(0, 40) })
      .strict()
      .describe('percent of canvas width kept clear of text on each side'),
    fonts: z
      .object({
        title: z.string(),
        body: z.string(),
        number: z.string(),
        script: z.string(),
      })
      .strict(),
    fontFiles: z
      .array(z.object({ family: z.string().min(2).max(60), file: imageRef, weight: z.number().int().min(100).max(900).optional() }).strict())
      .max(6)
      .optional(),
    colors: z
      .object({
        title: color,
        text: color,
        accent: color,
        muted: color,
        priceMain: color,
        priceStrike: color,
        badgeBg: color,
        badgeBorder: color,
        dateTileBg: color.optional(),
        dateTileText: color.optional(),
        boxBg: color.optional(),
        boxBorder: color.optional(),
      })
      .strict(),
    typography: z
      .object({
        titleSize: px(24, 220),
        subtitleSize: px(14, 120),
        dateSize: px(14, 120),
        itemSize: px(12, 100),
        deliverableSize: px(12, 100),
        priceSize: px(30, 260),
        mrpSize: px(14, 120),
        noteSize: px(10, 80).optional(),
        footerSize: px(10, 80).optional(),
      })
      .strict()
      .describe('pixel sizes at a 1080px-wide canvas'),
    layout: z.object({
      order: z.array(z.enum(['title', 'subtitle', 'dates', 'deliverables', 'addOn', 'price', 'notes', 'footer'])).max(8).optional(),
      dateStructure: z.enum(['auto', 'stacked', 'columns']).optional(),
      dateColumnPct: px(12, 45).optional(),
      columnGap: px(0, 100).optional(),
      rowGap: px(0, 100).optional(),
      sectionGap: px(0, 120).optional(),
      minHeight: px(1080, 12000).optional(),
      autoGrow: z.boolean().optional(),
      blockOverrides: z.record(z.object({ x: px(-2000,2000).optional(), y: px(-4000,4000).optional(), w: px(80,1080).optional(), h: px(0,6000).optional(), fontScale: px(.3,3).optional() }).strict()).optional(),
    }).strict().optional(),
    elements: z.array(z.object({
      id: z.string().regex(/^[a-zA-Z0-9_-]+$/).max(80),
      type: z.enum(['text', 'image', 'shape']),
      name: z.string().max(80).optional(),
      text: z.string().max(4000).optional(),
      binding: z.enum(['title', 'subtitle', 'footer', 'selling', 'mrp']).optional(),
      image: imageRef.optional(),
      x: px(0, 1080), y: px(0, 12000), width: px(1, 1080), height: px(1, 12000),
      rotation: px(-360, 360).optional(), opacity: px(0, 1).optional(),
      hidden: z.boolean().optional(), locked: z.boolean().optional(),
      group: z.string().max(80).optional(),
      font: z.enum(['title', 'body', 'number', 'script']).optional(),
      fontSize: px(10, 240).optional(), fontWeight: z.number().int().min(100).max(900).optional(),
      lineHeight: px(0.8, 3).optional(), letterSpacing: px(-5, 30).optional(),
      align: z.enum(['left', 'center', 'right']).optional(),
      color: color.optional(), fill: color.optional(), borderColor: color.optional(),
      borderWidth: px(0, 30).optional(), radius: px(0, 999).optional(),
      fit: z.enum(['cover', 'contain']).optional(),
      cropX: px(0, 100).optional(), cropY: px(0, 100).optional(),
    }).strict()).max(100).optional(),
    dateStyle: z.enum(['plain', 'tile', 'pill']),
    dividers: z.object({ image: imageRef.optional() }).strict().optional(),
    ornaments: z
      .array(
        z
          .object({
            image: imageRef,
            anchor: z.enum(['left', 'right', 'top', 'bottom', 'top-left', 'top-right', 'bottom-left', 'bottom-right']),
            widthPct: px(2, 100),
            opacity: px(0, 1).optional(),
            offsetXPct: px(-50, 50).optional(),
            offsetYPct: px(-50, 50).optional(),
          })
          .strict(),
      )
      .max(12)
      .default([]),
    blocks: z
      .object({
        title: blockStyle.optional(),
        subtitle: blockStyle.optional(),
        dateRow: blockStyle.optional(),
        deliverablesBox: blockStyle.optional(),
        addOnBadge: blockStyle.optional(),
        priceBox: blockStyle.optional(),
        notes: blockStyle.optional(),
        footer: blockStyle.optional(),
      })
      .strict()
      .default({}),
    density: z
      .object({
        gapScale: px(0.3, 3),
        minFontScale: px(0.3, 1),
        maxFontScale: px(1, 2).optional(),
      })
      .strict(),
  })
  .strict()
  .superRefine((def, ctx) => {
    if (def.schemaVersion === 1 && (def.layout || def.elements)) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['schemaVersion'], message: 'Layout and elements require schemaVersion 2' });
    const ids = (def.elements ?? []).map(e => e.id);
    if (new Set(ids).size !== ids.length) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['elements'], message: 'Element IDs must be unique' });
    if (def.layout?.order && new Set(def.layout.order).size !== def.layout.order.length) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['layout', 'order'], message: 'Each dynamic section can appear only once' });
    for (const [i, element] of (def.elements ?? []).entries()) {
      if (element.type === 'image' && !element.image) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['elements', i, 'image'], message: 'Image layer needs an asset reference' });
    }
    const shipped = new Set((def.fontFiles ?? []).map((f) => f.family));
    for (const [slot, family] of Object.entries(def.fonts)) {
      if (!FONT_FAMILIES.includes(family) && !shipped.has(family)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['fonts', slot],
          message: `"${family}" is not a bundled font. Use one of: ${FONT_FAMILIES.join(', ')} — or ship it in fontFiles`,
        });
      }
    }
  });

/** Migration hook: upgrade older definitions before validating. */
export const migrateThemeDefinition = (raw) => {
  if (!raw || typeof raw !== 'object') return raw;
  const def = { ...raw };
  if (def.schemaVersion === undefined) def.schemaVersion = 1;
  // Future: if (def.schemaVersion === 1) { …transform…; def.schemaVersion = 2; }
  // Accept "plain | tile | pill" copied literally from documentation.
  if (typeof def.dateStyle === 'string' && def.dateStyle.includes('|')) def.dateStyle = def.dateStyle.split('|')[0].trim();
  return def;
};

/** Human-readable zod issues: [{ path: 'colors.text', message }]. */
export const formatIssues = (error) =>
  (error?.issues ?? []).map((issue) => ({
    path: issue.path.join('.') || '(root)',
    message: issue.message,
  }));

export const parseThemeDefinition = (raw) => {
  const result = themeDefinitionSchema.safeParse(migrateThemeDefinition(raw));
  return result.success ? { ok: true, value: result.data, errors: [] } : { ok: false, value: null, errors: formatIssues(result.error) };
};

/** Image references used by a definition (for asset-existence checks). */
export const collectAssetRefs = (def) => {
  const refs = [];
  if (def?.canvas?.backgroundImage) refs.push({ path: 'canvas.backgroundImage', ref: def.canvas.backgroundImage });
  if (def?.canvas?.frame?.image) refs.push({ path: 'canvas.frame.image', ref: def.canvas.frame.image });
  if (def?.dividers?.image) refs.push({ path: 'dividers.image', ref: def.dividers.image });
  (def?.ornaments ?? []).forEach((o, i) => refs.push({ path: `ornaments.${i}.image`, ref: o.image }));
  (def?.fontFiles ?? []).forEach((f, i) => refs.push({ path: `fontFiles.${i}.file`, ref: f.file, font: true }));
  (def?.elements ?? []).forEach((e, i) => { if (e.image) refs.push({ path: `elements.${i}.image`, ref: e.image }); });
  return refs;
};

// ---------------------------------------------------------------------------
// JSON-Schema export (subset converter for the zod types used above)
// ---------------------------------------------------------------------------
const unwrap = (schema) => {
  let s = schema;
  let optional = false;
  let description = s.description;
  for (;;) {
    const t = s?._def?.typeName;
    if (t === 'ZodOptional' || t === 'ZodNullable') { optional = true; s = s._def.innerType; }
    else if (t === 'ZodDefault') { optional = true; s = s._def.innerType; }
    else if (t === 'ZodEffects') { s = s._def.schema; }
    else break;
    description = description ?? s.description;
  }
  return { schema: s, optional, description };
};

export const zodToJsonSchema = (input) => {
  const { schema, description } = unwrap(input);
  const def = schema._def;
  const withDesc = (o) => (description ? { ...o, description } : o);
  switch (def.typeName) {
    case 'ZodObject': {
      const shape = def.shape();
      const properties = {};
      const required = [];
      for (const [key, value] of Object.entries(shape)) {
        const inner = unwrap(value);
        properties[key] = zodToJsonSchema(value);
        if (!inner.optional) required.push(key);
      }
      return withDesc({ type: 'object', properties, required, additionalProperties: false });
    }
    case 'ZodRecord': return withDesc({ type: 'object', additionalProperties: zodToJsonSchema(def.valueType) });
    case 'ZodArray': {
      const out = { type: 'array', items: zodToJsonSchema(def.type) };
      if (def.minLength) out.minItems = def.minLength.value;
      if (def.maxLength) out.maxItems = def.maxLength.value;
      return withDesc(out);
    }
    case 'ZodEnum': return withDesc({ type: 'string', enum: def.values });
    case 'ZodLiteral': return withDesc({ const: def.value });
    case 'ZodBoolean': return withDesc({ type: 'boolean' });
    case 'ZodNumber': {
      const out = { type: def.checks?.some((c) => c.kind === 'int') ? 'integer' : 'number' };
      for (const c of def.checks ?? []) {
        if (c.kind === 'min') out.minimum = c.value;
        if (c.kind === 'max') out.maximum = c.value;
      }
      return withDesc(out);
    }
    case 'ZodString': {
      const out = { type: 'string' };
      for (const c of def.checks ?? []) {
        if (c.kind === 'min') out.minLength = c.value;
        if (c.kind === 'max') out.maxLength = c.value;
      }
      return withDesc(out);
    }
    default: return withDesc({});
  }
};

export const themeJsonSchema = () => ({
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  title: `Wedding Quote Theme v${THEME_SCHEMA_VERSION}`,
  ...zodToJsonSchema(themeDefinitionSchema),
});

/** A complete, valid example (also used as "Download example"). */
export const EXAMPLE_THEME = {
  schemaVersion: 1,
  name: 'Example Blush Classic',
  forDays: [1, 2, 3, 4, 5],
  canvas: { bg: '#FBF4EF', frame: { image: 'frame.svg', inset: 28 } },
  safeArea: { top: 9, right: 9, bottom: 8, left: 9 },
  fonts: { title: 'Playfair Display', body: 'Cormorant Garamond', number: 'Playfair Display', script: 'Great Vibes' },
  colors: {
    title: '#7A3E48', text: '#3F2A2E', accent: '#B76E79', muted: '#8C7377',
    priceMain: '#7A3E48', priceStrike: '#A23B3B', badgeBg: '#F6E3E3', badgeBorder: '#D9A9AE',
  },
  typography: { titleSize: 88, subtitleSize: 38, dateSize: 38, itemSize: 33, deliverableSize: 31, priceSize: 140, mrpSize: 48 },
  dateStyle: 'plain',
  dividers: { image: 'divider.svg' },
  ornaments: [{ image: 'corner.svg', anchor: 'top-left', widthPct: 18, opacity: 0.9 }],
  blocks: { deliverablesBox: { borderColor: '#D9A9AE', borderWidth: 2, radius: 24 } },
  density: { gapScale: 1, minFontScale: 0.6 },
};

/** Complete JSON-only example: no missing external artwork. */
export const SIMPLE_THEME = {
  ...EXAMPLE_THEME, schemaVersion: 2, name: 'Clean Studio',
  canvas: { bg: '#FBF4EF' }, dividers: {}, ornaments: [],
  fonts: { ...EXAMPLE_THEME.fonts, body: 'Montserrat', number: 'Montserrat' },
  layout: { dateStructure: 'columns', dateColumnPct: 22, columnGap: 24, rowGap: 12, sectionGap: 16, autoGrow: true },
  typography: { ...EXAMPLE_THEME.typography, titleSize: 64, dateSize: 28, itemSize: 30, priceSize: 120 },
  elements: [],
};

/** Generated from live schema and budgets; options contain design preferences only. */
export const buildAiPrompt = ({ mode = 'simple', style = '', palette = '', language = 'English', days = '1, 3, 5, 7, 10', density = 'comfortable', reference = true } = {}) => `Create a wedding quotation theme, schemaVersion ${THEME_SCHEMA_VERSION}.
Output mode: ${mode}. Style: ${style || 'refined studio'}. Palette: ${palette || 'choose a readable palette'}. Language: ${language}. Intended days: ${days}. Density: ${density}.
${reference ? 'Analyse the attached reference palette, typography, hierarchy and artwork. Preserve its visual identity. If no image is attached, follow the style description.' : 'Create an original design from the preferences.'}

CONTRACT
- Simple: output one complete theme.json with no external assets; use the complete simple example below.
- Advanced: supply an actual ZIP containing theme.json and every referenced image/font. If file creation is unavailable, give exact filenames and COMPLETE SVG/JSON text for the text-only packaging flow. Never claim a ZIP exists when it does not.
- Text-only: give theme.json and a JSON object mapping filenames to complete SVG text. Do not fabricate binary/base64 images or fonts.
- Strict valid JSON: no comments, trailing commas, placeholders or unknown properties. Use the exact schema below. Layout/elements require version 2; legacy version 1 remains supported.
- Keep services, names, dates, prices, notes and studio data dynamic; do not bake them into artwork. Layer bindings: title, subtitle, footer, selling, mrp. Never include internal cost/profit or private customer data.
- Canvas width is 1080 design px. Safe-area percentages use this width, including top/bottom. Frame inset is pixels from canvas edge; block widths are percentages of the remaining safe width. Padding is inside blocks. Do not compensate for incorrect geometry with arbitrary huge margins.
- Default flow order is title/subtitle/dates/deliverables/addOn/price/notes/footer. layout.order chooses order and visible sections. dateStyle controls appearance; layout.dateStructure=columns places date left and wrapping services right. Row and section gaps are design pixels.
- Canvas is at least square; natural content can grow beyond 1:1.78. autoGrow=true keeps fonts readable rather than shrinking. Free elements have x/y/width/height, rotation and array layer order; they extend the canvas and may intentionally overlap. Keep variable-content flow and fixed artwork clear of each other.
- Frame and corner ornaments may duplicate decorations: use explicit visual roles, inspect them together, and avoid doubling the same corner. Do not remove intentional layers blindly.
- Bundled fonts: ${FONT_FAMILIES.join(', ')}. Prefer Montserrat for body/numbers. Custom fontFiles must contain real WOFF2 files with matching family/weight, needed language glyphs, ₹, punctuation and digits. Do not claim unsupported script coverage.
- SVG must be self-contained: no scripts, event handlers, foreignObject or external references. Only real supported PNG/JPEG/WEBP/SVG/WOFF2 assets.
- Budgets in bytes: ${JSON.stringify(THEME_LIMITS)}. No minimum package size. Images must remain within maxImagePixels. Large assets belong in ZIP files, not inline JSON.
- Body text contrast target 4.5:1; title/price 3:1. Inspect actual block backgrounds and images. Warn when contrast cannot be established.
- Self-check long titles/service lines, sparse/dense 1/3/5/7/10-date content, multiple deliverables, optional add-on, notes, footer and large prices. Do not claim to have run this app validator.

SCHEMA
${JSON.stringify(themeJsonSchema(), null, 2)}
COMPLETE SIMPLE EXAMPLE
${JSON.stringify(SIMPLE_THEME, null, 2)}
Return the complete files and concise review notes. For advanced artwork you may use the app's downloadable verified ZIP example as a starting point.`;
