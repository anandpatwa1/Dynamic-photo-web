/**
 * Client-side DOM → SVG(foreignObject) → canvas → JPG (A12). The node passed
 * in is a QuoteCanvas rendered in export mode — the same renderer the editor
 * shows. Fonts are inlined as data URIs and every theme image already is one,
 * so nothing cross-origin can taint the canvas.
 */
import { embeddedFontCss, registerBundledFonts, registerThemeFonts } from './fonts';

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('The quote could not be rendered to an image'));
    img.src = src;
  });

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/** Keep layout in design pixels; only the final canvas scales the image. */
export const nodeToSvgDataUrl = async (node, { width, height, theme }) => {
  if (!node) throw new Error('quote-not-ready');
  const fontResults = await Promise.all([registerBundledFonts(), registerThemeFonts(theme)]);
  if (fontResults.flat().some(face => face === null)) throw new Error('A required font failed to load. Check the theme font files before export.');
  await document.fonts.ready;
  const css = await embeddedFontCss(theme);
  const clone = node.cloneNode(true);
  const sources = [node, ...node.querySelectorAll('*')];
  const targets = [clone, ...clone.querySelectorAll('*')];
  // The standalone SVG cannot inherit the page's reset or typography. Preserve
  // these metrics so text wrapping and block heights match the measured plan.
  const properties = ['box-sizing', 'font-family', 'font-size', 'font-weight',
    'font-style', 'line-height', 'letter-spacing', 'word-spacing', 'white-space',
    'overflow-wrap', 'word-break', 'text-transform', 'color'];
  sources.forEach((source, index) => {
    const computed = getComputedStyle(source);
    for (const property of properties) {
      targets[index].style.setProperty(property, computed.getPropertyValue(property));
    }
    targets[index].style.setProperty('-webkit-text-size-adjust', 'none');
    targets[index].style.setProperty('text-size-adjust', 'none');
  });
  const xml = new XMLSerializer().serializeToString(clone);
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
    `<foreignObject x="0" y="0" width="${width}" height="${height}">` +
    `<div xmlns="http://www.w3.org/1999/xhtml" style="width:${width}px;height:${height}px;margin:0;padding:0">` +
    `<style>${css}</style>${xml}</div></foreignObject></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

/** Rasterises once; re-encode the returned canvas for each quality setting. */
export const rasterize = async (node, { width, height, outW, outH, theme, background = '#ffffff' }) => {
  const url = await nodeToSvgDataUrl(node, { width, height, outW, outH, theme });
  const img = await loadImage(url);
  // Some engines finish laying out @font-face inside SVG images a tick later.
  await wait(60);
  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas-unavailable');
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, outW, outH);
  ctx.drawImage(img, 0, 0, outW, outH);
  // Touching pixels surfaces a tainted / failed canvas now rather than at toBlob.
  ctx.getImageData(0, 0, 1, 1);
  return canvas;
};

export const encodeJpeg = (canvas, quality) =>
  new Promise((resolve, reject) => {
    try {
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('canvas-unavailable'))), 'image/jpeg', quality);
    } catch (error) {
      reject(error);
    }
  });
