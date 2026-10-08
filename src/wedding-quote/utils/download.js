/** Triggers a browser download for a Blob. */
export const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
};

/**
 * Opens the device share sheet with a real file attachment. On iOS this keeps
 * the quotation out of Downloads and lets the user send it through WhatsApp.
 * Returns false when the browser only supports text sharing (or no sharing).
 */
export const shareBlob = (blob, filename, { title, text } = {}) => {
  if (typeof navigator === 'undefined' || typeof navigator.share !== 'function' || typeof File !== 'function') {
    return false;
  }

  const file = new File([blob], filename, {
    type: blob.type || 'image/jpeg',
    lastModified: Date.now(),
  });
  const data = { files: [file], title, text };

  try {
    if (typeof navigator.canShare === 'function' && !navigator.canShare({ files: data.files })) return false;
  } catch {
    return false;
  }

  return navigator.share(data);
};

const slug = (s) => String(s ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50);

/** quote-<label|package>-<yyyy-mm-dd>.jpg (A12 / Phase 5.3). */
export const quoteFileName = (quote, now = new Date()) => {
  const name = slug(quote?.label) || slug(quote?.packageSnapshot?.name) || 'wedding';
  const d = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  return `quote-${name}-${d}.jpg`;
};

export const copyText = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  }
};
