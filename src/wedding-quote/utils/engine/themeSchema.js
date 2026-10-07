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
import { isColor } from './contrast.js';

export const THEME_SCHEMA_VERSION = 1;

const color = z.string().trim().refine(isColor, 'Use a hex (#RRGGBB) or rgba() colour');
const imageRef = z.string().trim().min(1).max(300).describe('asset file name from the zip (e.g. "bg.webp") or an inline data:image URI');
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
    schemaVersion: z.literal(THEME_SCHEMA_VERSION),
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
  if (def.schemaVersion === undefined) def.schemaVersion = THEME_SCHEMA_VERSION;
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

/** Prompt text for ChatGPT / Gemini / Claude, generated from the live schema. */
export const buildAiPrompt = () => `You are designing a THEME for a wedding photography quotation poster generator.
Output a ZIP-ready theme package: one file named theme.json plus optional asset files (SVG, PNG or WEBP).

STRICT RULES
1. theme.json must validate against the JSON Schema below (schemaVersion ${THEME_SCHEMA_VERSION}). Do not add any other keys.
2. Every image field ("backgroundImage", "frame.image", "dividers.image", "ornaments[].image") is EITHER a file name you also provide (e.g. "frame.svg") OR an inline "data:image/svg+xml;base64,..." URI.
3. Fonts: only use ${FONT_FAMILIES.map((f) => `"${f}"`).join(', ')}. (A custom .woff2 may be shipped via "fontFiles", but prefer the bundled list.)
4. SVG assets must be self-contained: no <script>, no event handlers (onload…), no <foreignObject>, no external links or web fonts, no <image href="http…">. Use only shapes, paths, gradients and fills.
5. Sizes in "typography" are pixels for a 1080px-wide canvas. "safeArea" values are % of width kept free of text — make them large enough that text never overlaps the frame or ornaments.
6. Do NOT draw any text, prices, dates or names in the artwork — the app prints all text. Do not use copyrighted images.
7. Keep text colours readable on the background (contrast ≥ 4.5:1 for "text", ≥ 3:1 for "title" and "priceMain").
8. Each asset file ≤ 2 MB (SVG ≤ 512 KB), at most 30 assets.

LAYOUT FACTS (do not change, design around them)
- Blocks are printed top to bottom: title, subtitle, one row per wedding date (date label + item lines), a "Deliverables" box, an optional add-on badge, the price (small struck-through MRP + large selling price), notes, footer.
- The canvas is 1080px wide, at least square, up to ~1:1.78 portrait. The art must look right when stretched taller (use "cover" backgrounds, corner/edge ornaments and a frame with "inset").
- "dateStyle": "plain" (13 December), "tile" (big day number + small month in a coloured tile using colors.dateTileBg/dateTileText) or "pill" (13 DEC in a rounded pill).

JSON SCHEMA
${JSON.stringify(themeJsonSchema(), null, 2)}

EXAMPLE theme.json
${JSON.stringify(EXAMPLE_THEME, null, 2)}

TASK
Create a theme that matches this description / reference image: <<DESCRIBE THE LOOK OR ATTACH THE REFERENCE POSTER HERE>>
Reply with: (a) theme.json in a code block, (b) each asset file in its own code block titled with its file name, (c) a short checklist of what the user should review (colours, safe area vs. ornaments, font choices).`;
