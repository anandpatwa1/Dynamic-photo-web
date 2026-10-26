/**
 * Self-hosted font registry (A9: no external font requests at runtime).
 * Bundled woff2 files are imported as asset URLs by Vite; theme-shipped fonts
 * arrive as data: URIs inside the theme's assets.
 */
import cg400 from '../themes/fonts/cormorant-garamond-latin-400-normal.woff2';
import cg500 from '../themes/fonts/cormorant-garamond-latin-500-normal.woff2';
import cg600 from '../themes/fonts/cormorant-garamond-latin-600-normal.woff2';
import cg700 from '../themes/fonts/cormorant-garamond-latin-700-normal.woff2';
import pf400 from '../themes/fonts/playfair-display-latin-400-normal.woff2';
import pf700 from '../themes/fonts/playfair-display-latin-700-normal.woff2';
import gv400 from '../themes/fonts/great-vibes-latin-400-normal.woff2';
import mc400 from '../themes/fonts/marcellus-latin-400-normal.woff2';
import ms400 from '../themes/fonts/montserrat-latin-400-normal.woff2';
import ms600 from '../themes/fonts/montserrat-latin-600-normal.woff2';
import cz400 from '../themes/fonts/cinzel-latin-400-normal.woff2';
import cz700 from '../themes/fonts/cinzel-latin-700-normal.woff2';
import rp400 from '../themes/fonts/wq-rupee-400.woff2';
import rp700 from '../themes/fonts/wq-rupee-700.woff2';
import { FONT_FAMILIES, RUPEE_FONT } from './engine/fontWhitelist';

export const FONT_SOURCES = [
  { family: 'Cormorant Garamond', weight: 400, url: cg400 },
  { family: 'Cormorant Garamond', weight: 500, url: cg500 },
  { family: 'Cormorant Garamond', weight: 600, url: cg600 },
  { family: 'Cormorant Garamond', weight: 700, url: cg700 },
  { family: 'Playfair Display', weight: 400, url: pf400 },
  { family: 'Playfair Display', weight: 700, url: pf700 },
  { family: 'Great Vibes', weight: 400, url: gv400 },
  { family: 'Marcellus', weight: 400, url: mc400 },
  { family: 'Montserrat', weight: 400, url: ms400 },
  { family: 'Montserrat', weight: 600, url: ms600 },
  { family: 'Cinzel', weight: 400, url: cz400 },
  { family: 'Cinzel', weight: 700, url: cz700 },
  { family: RUPEE_FONT, weight: 400, url: rp400, unicodeRange: 'U+20B9' },
  { family: RUPEE_FONT, weight: 700, url: rp700, unicodeRange: 'U+20B9' },
];

const registered = new Map();

const addFace = (family, url, { weight = 400, unicodeRange } = {}) => {
  const id = `${family}|${weight}|${url.slice(0, 64)}`;
  if (registered.has(id) || typeof FontFace === 'undefined') return registered.get(id);
  const face = new FontFace(family, `url(${url}) format('woff2')`, { weight: String(weight), style: 'normal', ...(unicodeRange ? { unicodeRange } : {}) });
  document.fonts.add(face);
  const promise = face.load().catch(() => null);
  registered.set(id, promise);
  return promise;
};

export const registerBundledFonts = () => Promise.all(FONT_SOURCES.map((f) => addFace(f.family, f.url, f)));

/** Scoped family name for a font a theme ships itself. */
export const themeFontFamily = (theme, family) => `wqt-${theme?.key ?? 'x'}-${family}`.replace(/[^a-zA-Z0-9-]/g, '-');

export const registerThemeFonts = (theme) => {
  const files = theme?.definition?.fontFiles ?? [];
  return Promise.all(
    files.map((f) => {
      const url = theme.assets?.find((a) => a.key === f.file)?.url;
      return url ? addFace(themeFontFamily(theme, f.family), url, { weight: f.weight ?? 400 }) : null;
    }),
  );
};

/** CSS font-family stack for a slot (title/body/number/script). */
export const fontStack = (theme, slot) => {
  const family = theme?.definition?.fonts?.[slot] ?? 'Cormorant Garamond';
  const shipped = (theme?.definition?.fontFiles ?? []).some((f) => f.family === family);
  const name = shipped ? themeFontFamily(theme, family) : FONT_FAMILIES.includes(family) ? family : 'Cormorant Garamond';
  const generic = slot === 'script' ? 'cursive' : 'serif';
  return `"${name}", "${RUPEE_FONT}", ${generic}`;
};

// ---- Export: inline fonts as data URIs inside the SVG snapshot -----------
const dataUrlCache = new Map();
const toDataUrl = async (url) => {
  if (url.startsWith('data:')) return url;
  if (!dataUrlCache.has(url)) {
    dataUrlCache.set(
      url,
      fetch(url)
        .then((r) => r.blob())
        .then((blob) => new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        })),
    );
  }
  return dataUrlCache.get(url);
};

/** @font-face CSS for every bundled font + the theme's own fonts. */
export const embeddedFontCss = async (theme) => {
  const faces = [
    ...FONT_SOURCES.map((f) => ({ ...f })),
    ...(theme?.definition?.fontFiles ?? []).map((f) => ({
      family: themeFontFamily(theme, f.family),
      weight: f.weight ?? 400,
      url: theme.assets?.find((a) => a.key === f.file)?.url,
    })),
  ].filter((f) => f.url);
  const rules = await Promise.all(
    faces.map(async (f) => `@font-face{font-family:"${f.family}";font-weight:${f.weight};font-style:normal;src:url(${await toDataUrl(f.url)}) format("woff2");${f.unicodeRange ? `unicode-range:${f.unicodeRange};` : ''}}`),
  );
  return rules.join('\n');
};
