/**
 * Two built-in themes designed from the reference posters. All art is
 * original vector work written here (no copyrighted images).
 *
 * SHARED FILE — identical copy lives in client/src/wedding-quote/utils/engine/.
 * The server seeds these into wq_themes (isBuiltIn: true); the client uses
 * them as an offline fallback and for previews.
 */
const svgUri = (svg) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.replace(/\s+/g, ' ').trim())}`;

// ---------------------------------------------------------------- Ivory Gold
const GOLD = '#B8862E';
const GOLD_DARK = '#8B5A1B';

const ivoryBg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1920" preserveAspectRatio="none">
<defs><radialGradient id="g" cx="50%" cy="38%" r="75%"><stop offset="0" stop-color="#FFFDF7"/><stop offset="1" stop-color="#F4EAD5"/></radialGradient>
<pattern id="p" width="90" height="90" patternUnits="userSpaceOnUse"><circle cx="45" cy="45" r="2.2" fill="#E6D6B0" opacity=".55"/><circle cx="0" cy="0" r="1.6" fill="#E6D6B0" opacity=".45"/><circle cx="90" cy="90" r="1.6" fill="#E6D6B0" opacity=".45"/></pattern></defs>
<rect width="1080" height="1920" fill="url(#g)"/><rect width="1080" height="1920" fill="url(#p)"/></svg>`;

const ivoryFrame = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" preserveAspectRatio="none">
<rect x="4" y="4" width="992" height="992" fill="none" stroke="${GOLD}" stroke-width="3" vector-effect="non-scaling-stroke"/>
<rect x="14" y="14" width="972" height="972" fill="none" stroke="${GOLD}" stroke-width="1.2" vector-effect="non-scaling-stroke"/></svg>`;

const leaf = (x, y, r, s = 1) =>
  `<path transform="translate(${x} ${y}) rotate(${r}) scale(${s})" d="M0 0 C 18 -22 52 -24 74 -6 C 52 6 22 12 0 0 Z" fill="#A9B47A" stroke="#7E8A52" stroke-width="1.4"/>`;
const rose = (x, y, s = 1, c = '#E8B7A6') =>
  `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 -31 C 19 -33 33 -16 31 3 C 29 22 11 33 -7 31 C -25 29 -34 12 -31 -5 C -28 -22 -14 -30 0 -31 Z" fill="${c}" stroke="#B5705C" stroke-width="1.4"/><path d="M-3 -22 C 14 -25 25 -9 22 6 C 19 20 3 27 -10 22 C -23 17 -26 2 -20 -9 C -16 -17 -9 -21 -3 -22 Z" fill="#E2A593" stroke="#B5705C" stroke-width="1.2"/><path d="M-2 -13 C 9 -15 16 -5 14 5 C 12 13 2 17 -6 13 C -14 9 -15 -1 -10 -7 C -8 -11 -5 -13 -2 -13 Z" fill="#CE806C" stroke="#9E5645" stroke-width="1.1"/><path d="M-2 -5 C 4 -7 8 -2 6 2 C 4 6 -3 6 -5 2" fill="none" stroke="#8E4A3B" stroke-width="1.4" stroke-linecap="round"/><path d="M-27 -8 C -20 -17 -10 -25 3 -28" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="2.2" stroke-linecap="round"/></g>`;

const ivoryFloralLeft = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 1920" preserveAspectRatio="xMinYMid slice">
<path d="M70 0 C 150 160 20 300 90 470 C 160 640 30 780 100 960 C 170 1140 40 1290 95 1460 C 150 1630 50 1780 80 1920" fill="none" stroke="#7E8A52" stroke-width="5"/>
${[120, 330, 560, 770, 1010, 1230, 1480, 1700].map((y, i) => `${leaf(i % 2 ? 60 : 100, y, i % 2 ? -150 : -20, 1.15)}${leaf(i % 2 ? 110 : 60, y + 70, i % 2 ? 20 : 170, 0.95)}`).join('')}
${rose(130, 250, 1.25)}${rose(70, 640, 1, '#F1CFC2')}${rose(140, 900, 1.4)}${rose(80, 1330, 1.1, '#F1CFC2')}${rose(130, 1600, 1.3)}
${[200, 470, 1110, 1790].map((y) => `<g fill="#F7E6B5" stroke="${GOLD}" stroke-width="1.2"><circle cx="40" cy="${y}" r="7"/><circle cx="56" cy="${y + 14}" r="5"/><circle cx="30" cy="${y + 20}" r="4"/></g>`).join('')}
</svg>`;

const ivoryGazebo = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 520">
<g fill="none" stroke="${GOLD}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
<path d="M200 20 L200 60"/><circle cx="200" cy="16" r="8" fill="#F3E9D2"/>
<path d="M200 60 C 140 90 80 120 40 170 L360 170 C 320 120 260 90 200 60 Z" fill="#F7EEDB"/>
<path d="M40 170 C 70 200 110 200 140 170 C 170 200 230 200 260 170 C 290 200 330 200 360 170"/>
<path d="M60 175 L60 440 M140 182 L140 440 M260 182 L260 440 M340 175 L340 440"/>
<path d="M60 250 C 90 220 110 220 140 250 M260 250 C 290 220 310 220 340 250"/>
<path d="M20 440 L380 440 L380 470 L20 470 Z" fill="#F7EEDB"/><path d="M0 470 L400 470 L400 500 L0 500 Z" fill="#F3E9D2"/>
</g>
<g opacity=".85">${leaf(30, 430, -40, 1)}${leaf(350, 430, -140, 1)}${rose(48, 410, 0.7, '#F1CFC2')}${rose(352, 410, 0.7)}</g></svg>`;

const ivoryDivider = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 40">
<g fill="none" stroke="${GOLD}" stroke-width="2" stroke-linecap="round"><path d="M20 20 L250 20 M350 20 L580 20"/>
<path d="M250 20 C 270 4 290 4 300 20 C 310 36 330 36 350 20"/><path d="M250 20 C 270 36 290 36 300 20 C 310 4 330 4 350 20"/></g>
<circle cx="300" cy="20" r="5" fill="${GOLD}"/></svg>`;

// ---------------------------------------------------------------- Royal Frame
const MAROON = '#6E1423';
const ROYAL_GOLD = '#C89B3C';

const royalBg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1920" preserveAspectRatio="none">
<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF8EC"/><stop offset="1" stop-color="#F3E3C6"/></linearGradient>
<pattern id="p" width="120" height="120" patternUnits="userSpaceOnUse"><path d="M60 20 C 80 40 80 80 60 100 C 40 80 40 40 60 20 Z" fill="none" stroke="#E5CFA0" stroke-width="1.2" opacity=".6"/><circle cx="0" cy="0" r="3" fill="#E5CFA0" opacity=".5"/><circle cx="120" cy="120" r="3" fill="#E5CFA0" opacity=".5"/></pattern></defs>
<rect width="1080" height="1920" fill="url(#g)"/><rect width="1080" height="1920" fill="url(#p)"/></svg>`;

const royalFrame = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" preserveAspectRatio="none">
<rect x="3" y="3" width="994" height="994" fill="none" stroke="${MAROON}" stroke-width="10" vector-effect="non-scaling-stroke"/>
<rect x="12" y="12" width="976" height="976" fill="none" stroke="${ROYAL_GOLD}" stroke-width="3" vector-effect="non-scaling-stroke"/>
<rect x="18" y="18" width="964" height="964" fill="none" stroke="${ROYAL_GOLD}" stroke-width="1" stroke-dasharray="6 5" vector-effect="non-scaling-stroke"/></svg>`;

const royalCorner = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 220">
<g fill="none" stroke="${ROYAL_GOLD}" stroke-width="3" stroke-linecap="round">
<path d="M10 210 L10 60 C 10 30 30 10 60 10 L210 10"/><path d="M30 210 L30 70 C 30 46 46 30 70 30 L210 30" stroke-width="1.5"/>
<path d="M60 10 C 60 60 100 100 150 100 M10 60 C 60 60 100 100 100 150"/>
</g>
<circle cx="62" cy="62" r="26" fill="${MAROON}" stroke="${ROYAL_GOLD}" stroke-width="3"/>
<path d="M62 44 L68 58 L82 62 L68 66 L62 80 L56 66 L42 62 L56 58 Z" fill="${ROYAL_GOLD}"/></svg>`;

/** Mirrors a 220×220 corner piece by wrapping its body in a flipped group. */
const mirror = (svg, sx, sy) =>
  svg
    .replace(/(<svg[^>]*>)/, `$1<g transform="translate(${sx < 0 ? 220 : 0} ${sy < 0 ? 220 : 0}) scale(${sx} ${sy})">`)
    .replace(/<\/svg>\s*$/, '</g></svg>');

const royalDivider = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 40">
<g stroke="${ROYAL_GOLD}" stroke-width="2" fill="none"><path d="M10 20 L240 20 M360 20 L590 20"/></g>
<path d="M300 4 L316 20 L300 36 L284 20 Z" fill="${MAROON}" stroke="${ROYAL_GOLD}" stroke-width="2"/>
<circle cx="258" cy="20" r="4" fill="${ROYAL_GOLD}"/><circle cx="342" cy="20" r="4" fill="${ROYAL_GOLD}"/></svg>`;

const royalTopCrest = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 90">
<g fill="none" stroke="${ROYAL_GOLD}" stroke-width="2.5" stroke-linecap="round"><path d="M20 70 C 80 70 120 40 160 40 M380 70 C 320 70 280 40 240 40"/>
<path d="M160 40 C 175 20 190 12 200 8 C 210 12 225 20 240 40"/></g>
<circle cx="200" cy="44" r="16" fill="${MAROON}" stroke="${ROYAL_GOLD}" stroke-width="2.5"/><circle cx="200" cy="44" r="5" fill="${ROYAL_GOLD}"/></svg>`;

// ---------------------------------------------------------------- Emerald Regal
const EMERALD_DARK = '#0F382C';
const EMERALD_GOLD = '#C59B27';

const emeraldBg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1920" preserveAspectRatio="none">
<defs><radialGradient id="eg" cx="50%" cy="30%" r="80%"><stop offset="0" stop-color="#FCFDFB"/><stop offset="60%" stop-color="#F2F7F4"/><stop offset="100%" stop-color="#E5EFE9"/></radialGradient>
<pattern id="ep" width="100" height="100" patternUnits="userSpaceOnUse"><path d="M50 20 C65 35 65 65 50 80 C35 65 35 35 50 20 Z" fill="none" stroke="${EMERALD_GOLD}" stroke-width="0.8" opacity="0.35"/><circle cx="50" cy="50" r="2.5" fill="${EMERALD_GOLD}" opacity="0.4"/></pattern></defs>
<rect width="1080" height="1920" fill="url(#eg)"/><rect width="1080" height="1920" fill="url(#ep)"/></svg>`;

const emeraldFrame = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" preserveAspectRatio="none">
<rect x="4" y="4" width="992" height="992" fill="none" stroke="${EMERALD_DARK}" stroke-width="6" vector-effect="non-scaling-stroke"/>
<rect x="14" y="14" width="972" height="972" fill="none" stroke="${EMERALD_GOLD}" stroke-width="2.5" vector-effect="non-scaling-stroke"/>
<rect x="22" y="22" width="956" height="956" fill="none" stroke="${EMERALD_GOLD}" stroke-width="1" stroke-dasharray="8 6" vector-effect="non-scaling-stroke"/></svg>`;

const emeraldCrest = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 100">
<g fill="none" stroke="${EMERALD_GOLD}" stroke-width="2.5" stroke-linecap="round"><path d="M40 75 C100 75 140 45 170 45 M360 75 C300 75 260 45 230 45"/><path d="M170 45 C185 25 195 15 200 10 C205 15 215 25 230 45"/><path d="M185 55 C192 40 200 35 200 35 C200 35 208 40 215 55"/></g>
<circle cx="200" cy="55" r="14" fill="${EMERALD_DARK}" stroke="${EMERALD_GOLD}" stroke-width="2.5"/><circle cx="200" cy="55" r="4.5" fill="${EMERALD_GOLD}"/></svg>`;

const emeraldDivider = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 40">
<g fill="none" stroke="${EMERALD_GOLD}" stroke-width="2" stroke-linecap="round"><path d="M20 20 L240 20 M360 20 L580 20"/><path d="M260 20 C275 8 285 8 300 20 C315 32 325 32 340 20"/><path d="M260 20 C275 32 285 32 300 20 C315 8 325 8 340 20"/></g>
<circle cx="300" cy="20" r="5" fill="${EMERALD_DARK}" stroke="${EMERALD_GOLD}" stroke-width="2"/></svg>`;

// ---------------------------------------------------------------- Celestial Midnight
const CELESTIAL_DARK = '#0F172A';
const CELESTIAL_GOLD = '#D4AF37';

const celestialBg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1920" preserveAspectRatio="none">
<defs><radialGradient id="cg" cx="50%" cy="35%" r="75%"><stop offset="0" stop-color="#FFFFFF"/><stop offset="55%" stop-color="#F4F6FB"/><stop offset="100%" stop-color="#E2E7F3"/></radialGradient>
<pattern id="cp" width="120" height="120" patternUnits="userSpaceOnUse"><circle cx="60" cy="60" r="1.8" fill="${CELESTIAL_GOLD}" opacity="0.45"/><circle cx="10" cy="20" r="1.2" fill="${CELESTIAL_GOLD}" opacity="0.35"/><circle cx="100" cy="90" r="1.4" fill="${CELESTIAL_GOLD}" opacity="0.35"/><polygon points="60,52 62,58 68,60 62,62 60,68 58,62 52,60 58,58" fill="${CELESTIAL_GOLD}" opacity="0.5"/></pattern></defs>
<rect width="1080" height="1920" fill="url(#cg)"/><rect width="1080" height="1920" fill="url(#cp)"/></svg>`;

const celestialFrame = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" preserveAspectRatio="none">
<rect x="4" y="4" width="992" height="992" fill="none" stroke="${CELESTIAL_DARK}" stroke-width="8" vector-effect="non-scaling-stroke"/>
<rect x="14" y="14" width="972" height="972" fill="none" stroke="${CELESTIAL_GOLD}" stroke-width="2" vector-effect="non-scaling-stroke"/>
<rect x="22" y="22" width="956" height="956" fill="none" stroke="${CELESTIAL_GOLD}" stroke-width="1.2" stroke-dasharray="4 4" vector-effect="non-scaling-stroke"/></svg>`;

const celestialCrest = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 90">
<g fill="none" stroke="${CELESTIAL_GOLD}" stroke-width="2" stroke-linecap="round"><path d="M30 65 L160 65 M240 65 L370 65"/><polygon points="200,15 205,32 222,35 207,45 212,62 200,50 188,62 193,45 178,35 195,32" fill="${CELESTIAL_DARK}" stroke="${CELESTIAL_GOLD}" stroke-width="2"/><circle cx="160" cy="65" r="4" fill="${CELESTIAL_GOLD}"/><circle cx="240" cy="65" r="4" fill="${CELESTIAL_GOLD}"/></g></svg>`;

const celestialDivider = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 40">
<g fill="none" stroke="${CELESTIAL_GOLD}" stroke-width="2" stroke-linecap="round"><path d="M20 20 L240 20 M360 20 L580 20"/></g>
<polygon points="300,8 308,20 300,32 292,20" fill="${CELESTIAL_DARK}" stroke="${CELESTIAL_GOLD}" stroke-width="2"/><circle cx="260" cy="20" r="4" fill="${CELESTIAL_GOLD}"/><circle cx="340" cy="20" r="4" fill="${CELESTIAL_GOLD}"/></svg>`;

export const BUILTIN_THEMES = [
  {
    key: 'ivory-gold-floral',
    name: 'Ivory Gold Floral',
    forDays: [1, 2, 3, 4, 5],
    isBuiltIn: true,
    isActive: true,
    schemaVersion: 1,
    assets: [
      { key: 'bg.svg', url: svgUri(ivoryBg) },
      { key: 'frame.svg', url: svgUri(ivoryFrame) },
      { key: 'floral-left.svg', url: svgUri(ivoryFloralLeft) },
      { key: 'gazebo-right.svg', url: svgUri(ivoryGazebo) },
      { key: 'divider.svg', url: svgUri(ivoryDivider) },
    ],
    definition: {
      schemaVersion: 1,
      name: 'Ivory Gold Floral',
      forDays: [1, 2, 3, 4, 5],
      canvas: { bg: '#FBF6EC', backgroundImage: 'bg.svg', backgroundSize: 'cover', frame: { image: 'frame.svg', inset: 26 } },
      safeArea: { top: 8, right: 9, bottom: 7, left: 19 },
      fonts: { title: 'Cormorant Garamond', body: 'Cormorant Garamond', number: 'Playfair Display', script: 'Great Vibes' },
      colors: {
        title: GOLD_DARK, text: '#4A2F12', accent: GOLD, muted: '#7A6A52',
        priceMain: GOLD_DARK, priceStrike: '#B4442F', badgeBg: '#F3E9D2', badgeBorder: '#D9C79A',
        boxBg: 'rgba(255,252,244,0.75)', boxBorder: '#D9C79A',
      },
      typography: { titleSize: 92, subtitleSize: 44, dateSize: 40, itemSize: 34, deliverableSize: 32, priceSize: 140, mrpSize: 50, noteSize: 24, footerSize: 24 },
      dateStyle: 'plain',
      dividers: { image: 'divider.svg' },
      ornaments: [
        { image: 'floral-left.svg', anchor: 'left', widthPct: 17, opacity: 1 },
        { image: 'gazebo-right.svg', anchor: 'bottom-right', widthPct: 22, opacity: 0.9, offsetXPct: -3, offsetYPct: -2 },
      ],
      blocks: {
        title: { align: 'center', font: 'title', letterSpacing: 1 },
        subtitle: { align: 'center', font: 'script' },
        dateRow: { align: 'center' },
        deliverablesBox: { borderWidth: 2, radius: 28, paddingX: 36, paddingY: 24, widthPct: 88 },
        addOnBadge: { radius: 999, borderWidth: 2, paddingX: 36, paddingY: 14 },
        priceBox: { align: 'center' },
        // Narrower so the footer clears the gazebo ornament bottom-right.
        footer: { align: 'center', uppercase: true, letterSpacing: 2, widthPct: 74 },
      },
      density: { gapScale: 1, minFontScale: 0.6, maxFontScale: 1.25 },
    },
  },
  {
    key: 'royal-frame',
    name: 'Royal Frame',
    forDays: [3, 4, 5, 6, 7, 8, 9, 10],
    isBuiltIn: true,
    isActive: true,
    schemaVersion: 1,
    assets: [
      { key: 'bg.svg', url: svgUri(royalBg) },
      { key: 'frame.svg', url: svgUri(royalFrame) },
      { key: 'corner-tl.svg', url: svgUri(royalCorner) },
      { key: 'corner-tr.svg', url: svgUri(mirror(royalCorner, -1, 1)) },
      { key: 'corner-bl.svg', url: svgUri(mirror(royalCorner, 1, -1)) },
      { key: 'corner-br.svg', url: svgUri(mirror(royalCorner, -1, -1)) },
      { key: 'crest.svg', url: svgUri(royalTopCrest) },
      { key: 'divider.svg', url: svgUri(royalDivider) },
    ],
    definition: {
      schemaVersion: 1,
      name: 'Royal Frame',
      forDays: [3, 4, 5, 6, 7, 8, 9, 10],
      canvas: { bg: '#FFF8EC', backgroundImage: 'bg.svg', backgroundSize: 'cover', frame: { image: 'frame.svg', inset: 22 } },
      safeArea: { top: 11, right: 9, bottom: 8, left: 9 },
      fonts: { title: 'Cinzel', body: 'Cormorant Garamond', number: 'Cinzel', script: 'Great Vibes' },
      colors: {
        title: MAROON, text: '#3A1A12', accent: ROYAL_GOLD, muted: '#7C5F4A',
        priceMain: MAROON, priceStrike: '#9A2A2A', badgeBg: '#6E1423', badgeBorder: ROYAL_GOLD,
        dateTileBg: MAROON, dateTileText: '#FFF3DC', boxBg: 'rgba(255,250,240,0.85)', boxBorder: ROYAL_GOLD,
      },
      typography: { titleSize: 76, subtitleSize: 42, dateSize: 36, itemSize: 31, deliverableSize: 30, priceSize: 128, mrpSize: 46, noteSize: 23, footerSize: 23 },
      dateStyle: 'tile',
      dividers: { image: 'divider.svg' },
      ornaments: [
        { image: 'corner-tl.svg', anchor: 'top-left', widthPct: 16, opacity: 1, offsetXPct: 2.5, offsetYPct: 2.5 },
        { image: 'corner-tr.svg', anchor: 'top-right', widthPct: 16, opacity: 1, offsetXPct: -2.5, offsetYPct: 2.5 },
        { image: 'corner-bl.svg', anchor: 'bottom-left', widthPct: 16, opacity: 1, offsetXPct: 2.5, offsetYPct: -2.5 },
        { image: 'corner-br.svg', anchor: 'bottom-right', widthPct: 16, opacity: 1, offsetXPct: -2.5, offsetYPct: -2.5 },
        { image: 'crest.svg', anchor: 'top', widthPct: 30, opacity: 1, offsetYPct: 3.2 },
      ],
      blocks: {
        title: { align: 'center', font: 'title', uppercase: true, letterSpacing: 3 },
        subtitle: { align: 'center', font: 'script' },
        dateRow: { align: 'left', bg: 'rgba(255,250,240,0.9)', borderColor: ROYAL_GOLD, borderWidth: 2, radius: 22, paddingX: 22, paddingY: 14, widthPct: 94 },
        deliverablesBox: { borderWidth: 2, radius: 22, paddingX: 34, paddingY: 22, widthPct: 94 },
        addOnBadge: { radius: 999, borderWidth: 3, paddingX: 34, paddingY: 14, color: '#FFF3DC' },
        priceBox: { align: 'center' },
        footer: { align: 'center', uppercase: true, letterSpacing: 2 },
      },
      density: { gapScale: 0.9, minFontScale: 0.58, maxFontScale: 1.2 },
    },
  },
  {
    key: 'emerald-regal',
    name: 'Emerald Regal',
    forDays: [1, 2, 3, 4, 5, 6, 7],
    isBuiltIn: true,
    isActive: true,
    schemaVersion: 1,
    assets: [
      { key: 'bg.svg', url: svgUri(emeraldBg) },
      { key: 'frame.svg', url: svgUri(emeraldFrame) },
      { key: 'crest.svg', url: svgUri(emeraldCrest) },
      { key: 'divider.svg', url: svgUri(emeraldDivider) },
    ],
    definition: {
      schemaVersion: 1,
      name: 'Emerald Regal',
      forDays: [1, 2, 3, 4, 5, 6, 7],
      canvas: { bg: '#FCFDFB', backgroundImage: 'bg.svg', backgroundSize: 'cover', frame: { image: 'frame.svg', inset: 24 } },
      safeArea: { top: 10, right: 9, bottom: 8, left: 9 },
      fonts: { title: 'Cinzel', body: 'Cormorant Garamond', number: 'Cinzel', script: 'Great Vibes' },
      colors: {
        title: EMERALD_DARK, text: '#1A2E24', accent: EMERALD_GOLD, muted: '#4D6659',
        priceMain: EMERALD_DARK, priceStrike: '#8F2D2D', badgeBg: EMERALD_DARK, badgeBorder: EMERALD_GOLD,
        dateTileBg: EMERALD_DARK, dateTileText: '#FFF9E6', boxBg: 'rgba(252,253,251,0.92)', boxBorder: EMERALD_GOLD,
      },
      typography: { titleSize: 84, subtitleSize: 42, dateSize: 36, itemSize: 31, deliverableSize: 30, priceSize: 130, mrpSize: 48, noteSize: 24, footerSize: 24 },
      dateStyle: 'tile',
      dividers: { image: 'divider.svg' },
      ornaments: [{ image: 'crest.svg', anchor: 'top', widthPct: 30, opacity: 1, offsetYPct: 3 }],
      blocks: {
        title: { align: 'center', font: 'title', uppercase: true, letterSpacing: 2 },
        subtitle: { align: 'center', font: 'script' },
        dateRow: { align: 'left', bg: 'rgba(252,253,251,0.9)', borderColor: EMERALD_GOLD, borderWidth: 2, radius: 20, paddingX: 24, paddingY: 14, widthPct: 94 },
        deliverablesBox: { borderWidth: 2, radius: 22, paddingX: 34, paddingY: 22, widthPct: 94 },
        addOnBadge: { radius: 999, borderWidth: 2, paddingX: 34, paddingY: 14, color: '#FFF9E6' },
        priceBox: { align: 'center' },
        footer: { align: 'center', uppercase: true, letterSpacing: 2 },
      },
      density: { gapScale: 0.95, minFontScale: 0.6, maxFontScale: 1.2 },
    },
  },
  {
    key: 'celestial-midnight',
    name: 'Celestial Midnight',
    forDays: [1, 2, 3, 4, 5, 6, 7],
    isBuiltIn: true,
    isActive: true,
    schemaVersion: 1,
    assets: [
      { key: 'bg.svg', url: svgUri(celestialBg) },
      { key: 'frame.svg', url: svgUri(celestialFrame) },
      { key: 'crest.svg', url: svgUri(celestialCrest) },
      { key: 'divider.svg', url: svgUri(celestialDivider) },
    ],
    definition: {
      schemaVersion: 1,
      name: 'Celestial Midnight',
      forDays: [1, 2, 3, 4, 5, 6, 7],
      canvas: { bg: '#FFFFFF', backgroundImage: 'bg.svg', backgroundSize: 'cover', frame: { image: 'frame.svg', inset: 20 } },
      safeArea: { top: 9, right: 9, bottom: 8, left: 9 },
      fonts: { title: 'Cinzel', body: 'Montserrat', number: 'Cinzel', script: 'Great Vibes' },
      colors: {
        title: CELESTIAL_DARK, text: '#1E293B', accent: CELESTIAL_GOLD, muted: '#64748B',
        priceMain: CELESTIAL_DARK, priceStrike: '#991B1B', badgeBg: CELESTIAL_DARK, badgeBorder: CELESTIAL_GOLD,
        dateTileBg: CELESTIAL_DARK, dateTileText: '#FFFFFF', boxBg: 'rgba(255,255,255,0.94)', boxBorder: CELESTIAL_GOLD,
      },
      typography: { titleSize: 84, subtitleSize: 42, dateSize: 34, itemSize: 30, deliverableSize: 28, priceSize: 130, mrpSize: 46, noteSize: 23, footerSize: 23 },
      dateStyle: 'tile',
      dividers: { image: 'divider.svg' },
      ornaments: [{ image: 'crest.svg', anchor: 'top', widthPct: 26, opacity: 1, offsetYPct: 2.8 }],
      blocks: {
        title: { align: 'center', font: 'title', uppercase: true, letterSpacing: 3 },
        subtitle: { align: 'center', font: 'script' },
        dateRow: { align: 'left', bg: 'rgba(255,255,255,0.92)', borderColor: CELESTIAL_GOLD, borderWidth: 2, radius: 20, paddingX: 24, paddingY: 14, widthPct: 94 },
        deliverablesBox: { borderWidth: 2, radius: 20, paddingX: 32, paddingY: 20, widthPct: 94 },
        addOnBadge: { radius: 999, borderWidth: 2, paddingX: 34, paddingY: 14, color: '#FFFFFF' },
        priceBox: { align: 'center' },
        footer: { align: 'center', uppercase: true, letterSpacing: 2 },
      },
      density: { gapScale: 0.95, minFontScale: 0.6, maxFontScale: 1.2 },
    },
  },
];

export const BUILTIN_KEYS = BUILTIN_THEMES.map((t) => t.key);
