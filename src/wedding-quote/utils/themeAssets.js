/** Resolves an image reference (asset key or inline data URI) to a URL. */
export const resolveAsset = (theme, ref) => {
  if (!ref) return null;
  if (ref.startsWith('data:')) return ref;
  return theme?.assets?.find((a) => a.key === ref)?.url ?? null;
};

/** CSS url() value; quotes are escaped so data URIs survive serialisation. */
export const cssUrl = (url) => (url ? `url("${String(url).replace(/"/g, '%22')}")` : 'none');
