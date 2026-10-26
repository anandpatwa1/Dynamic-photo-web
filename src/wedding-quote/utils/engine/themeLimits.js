/** Resource budgets shared with the prompt, schema and importer. Bytes, not decimal MB. */
export const THEME_LIMITS = {
  maxAssets: 100,
  maxAssetBytes: 8 * 1024 * 1024,
  maxSvgBytes: 2 * 1024 * 1024,
  maxTotalBytes: 32 * 1024 * 1024,
  maxThemeJsonBytes: 2 * 1024 * 1024,
  maxZipBytes: 12 * 1024 * 1024,
  maxExpandedBytes: 40 * 1024 * 1024,
  maxImagePixels: 40_000_000,
};
