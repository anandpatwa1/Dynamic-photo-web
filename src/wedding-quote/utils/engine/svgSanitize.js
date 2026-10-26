/**
 * Conservative SVG sanitiser (no DOM needed, runs on Node and in browsers).
 * Removes scripts, event handlers, foreignObject, external references,
 * DOCTYPE/ENTITY declarations and CSS imports. References that are kept:
 * same-document fragments (#id) and data:image/png|jpeg|webp URIs.
 *
 * SHARED FILE — identical copy lives in client/src/wedding-quote/utils/engine/.
 */
const SAFE_DATA = /^data:image\/(png|jpe?g|webp);base64,[a-z0-9+/=\s]+$/i;

const safeRef = (value) => {
  const v = String(value).trim().replace(/^['"]|['"]$/g, '');
  return v.startsWith('#') || SAFE_DATA.test(v);
};

export const sanitizeSvg = (input) => {
  const removed = [];
  let svg = String(input ?? '');

  const strip = (re, label) => {
    svg = svg.replace(re, () => {
      removed.push(label);
      return '';
    });
  };

  strip(/<\?xml-stylesheet[\s\S]*?\?>/gi, 'xml-stylesheet');
  strip(/<!DOCTYPE[\s\S]*?(\[[\s\S]*?\])?\s*>/gi, 'doctype');
  strip(/<!ENTITY[\s\S]*?>/gi, 'entity');
  strip(/<script[\s\S]*?<\/script\s*>/gi, 'script');
  strip(/<script[^>]*\/>/gi, 'script');
  strip(/<foreignObject[\s\S]*?<\/foreignObject\s*>/gi, 'foreignObject');
  strip(/<foreignObject[^>]*\/>/gi, 'foreignObject');
  strip(/<(iframe|embed|object|audio|video|handler|listener)[\s\S]*?(<\/\1\s*>|\/>)/gi, 'embedded content');
  // Event handler attributes: onload="…", onclick='…', onfoo=bar
  strip(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, 'event handler');

  // href / xlink:href / src: keep only safe references.
  svg = svg.replace(/\s+((?:xlink:)?href|src)\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/gi, (match, _attr, _q, a, b, c) => {
    const value = a ?? b ?? c ?? '';
    if (safeRef(value)) return match;
    removed.push('external reference');
    return '';
  });

  // CSS: @import and url(...) pointing anywhere unsafe.
  strip(/@import[^;]*;?/gi, 'css import');
  svg = svg.replace(/url\(\s*(['"]?)([^'")]*)\1\s*\)/gi, (match, _q, value) => {
    if (safeRef(value)) return match;
    removed.push('external url()');
    return 'none';
  });
  strip(/javascript\s*:/gi, 'javascript: URI');
  strip(/expression\s*\(/gi, 'css expression');

  const isSvg = /<svg[\s>]/i.test(svg);
  return { svg: svg.trim(), removed: [...new Set(removed)], isSvg };
};
