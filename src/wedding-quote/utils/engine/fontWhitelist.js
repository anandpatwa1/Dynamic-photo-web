/**
 * Bundled, self-hosted fonts (client/src/wedding-quote/themes/fonts/*.woff2).
 * Themes may only use these families, or families they ship in fontFiles.
 * SHARED FILE — identical copy lives in client/src/wedding-quote/utils/engine/.
 */
export const FONT_WHITELIST = {
  'Cormorant Garamond': [400, 500, 600, 700],
  'Playfair Display': [400, 700],
  'Great Vibes': [400],
  Marcellus: [400],
  Montserrat: [400, 600],
  Cinzel: [400, 700],
};
export const FONT_FAMILIES = Object.keys(FONT_WHITELIST);
/** Glyph-only fallback for ₹ (most latin subsets lack U+20B9). */
export const RUPEE_FONT = 'WQ Rupee';
