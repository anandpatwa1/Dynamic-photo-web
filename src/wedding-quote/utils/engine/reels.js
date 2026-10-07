/**
 * "Reels" auto-count engine (Master Spec A6).
 *
 * SHARED FILE — identical copy lives in client/src/wedding-quote/utils/engine/.
 *
 * Only lines whose label contains the word reel/reels are touched. A line
 * "a-b <label>" on an item that appears n times contributes lo = a×n and
 * hi = lo + (b−a). Items are summed, then the chosen deliverable set's own
 * reel line is added on top.
 */

export const REEL_LINE_RE = /^\s*(\d+)(?:\s*[-–]\s*(\d+))?\s+(.*\breels?\b.*)$/i;

/** "2-3 Reels" → { lo: 2, hi: 3, label: 'Reels' }; non-reel lines → null. */
export const parseReelLine = (text) => {
  if (typeof text !== 'string') return null;
  const match = text.match(REEL_LINE_RE);
  if (!match) return null;
  const lo = Number(match[1]);
  const hiRaw = match[2] === undefined ? lo : Number(match[2]);
  // "5-3 Reels" is treated as "3-5 Reels" rather than a negative spread.
  return { lo: Math.min(lo, hiRaw), hi: Math.max(lo, hiRaw), label: match[3].trim() };
};

/** True when a line mentions reel/reels anywhere (used to spot reel lines). */
export const isReelText = (text) => typeof text === 'string' && /\breels?\b/i.test(text);

/** 6,6 → "6 Reels"; 6,7 → "6-7 Reels"; 1,1 → "1 Reel". */
export const formatReels = (lo, hi, label) => {
  const range = lo === hi ? String(lo) : `${lo}-${hi}`;
  let finalLabel = (label || '').trim();
  if (!finalLabel || /^reels?$/i.test(finalLabel)) finalLabel = hi === 1 ? 'Reel' : 'Reels';
  return `${range} ${finalLabel}`;
};

/** The first reel line among an item's deliverables, parsed. */
const itemReel = (deliverables = []) => {
  for (const line of deliverables) {
    const parsed = parseReelLine(typeof line === 'string' ? line : line?.text);
    if (parsed) return parsed;
  }
  return null;
};

/**
 * Sum of item contributions across every entry in the quote.
 * @param entries flat list of { itemId, itemSnapshot: { deliverables } }
 * @returns { lo, hi, contributors } — contributors > 0 when any item has reels.
 */
export const sumItemReels = (entries = []) => {
  const byItem = new Map();
  for (const entry of entries) {
    const key = String(entry.itemId ?? entry.itemSnapshot?.name ?? '');
    const current = byItem.get(key);
    const quantity = Math.max(1, Math.min(99, Math.round(Number(entry.quantity) || 1)));
    if (current) current.n += quantity;
    else byItem.set(key, { n: quantity, reel: itemReel(entry.itemSnapshot?.deliverables) });
  }
  let lo = 0;
  let hi = 0;
  let contributors = 0;
  for (const { n, reel } of byItem.values()) {
    if (!reel) continue;
    const itemLo = reel.lo * n;
    lo += itemLo;
    hi += itemLo + (reel.hi - reel.lo);
    contributors += 1;
  }
  return { lo, hi, contributors };
};

/** Flattens quote days → entries. */
export const flattenEntries = (days = []) => days.flatMap((day) => day.entries ?? []);

/**
 * Combined reel result for the item contributions plus an optional set line.
 * Returns null when neither side has any reels.
 */
export const combineReels = (entries, setReelText) => {
  const items = sumItemReels(entries);
  const base = setReelText ? parseReelLine(setReelText) : null;
  if (!items.contributors && !base) return null;
  const lo = items.lo + (base?.lo ?? 0);
  const hi = items.hi + (base?.hi ?? 0);
  return { lo, hi, text: formatReels(lo, hi, base?.label) };
};

const blankLine = () => ({ text: '', sellingPrice: 0, costPrice: 0, mrpPrice: 0, note: '' });

/**
 * Builds a quote's deliverable lines from a chosen set. The set's reel line
 * (if any) becomes the single auto line; its original text is kept in
 * `baseText` so later recalculations know the set's own contribution.
 */
export const linesFromSet = (setLines = [], entries = [], makeId = () => undefined) => {
  let autoPlaced = false;
  const lines = setLines.map((line) => {
    const copy = {
      ...blankLine(),
      _id: makeId(),
      text: line.text ?? '',
      sellingPrice: line.sellingPrice ?? 0,
      costPrice: line.costPrice ?? 0,
      mrpPrice: line.mrpPrice ?? 0,
      note: line.note ?? '',
      isAuto: false,
      isEdited: false,
      baseText: '',
    };
    if (!autoPlaced && parseReelLine(copy.text)) {
      autoPlaced = true;
      copy.isAuto = true;
      copy.baseText = copy.text;
    }
    return copy;
  });
  return recalcReels(lines, entries, makeId);
};

/**
 * Re-derives the auto reel line. Rules:
 *  - an edited auto line (isEdited) is never overwritten;
 *  - the auto line's set contribution comes from `baseText`;
 *  - when the set had no reel line but items contribute, a line is appended;
 *  - an unedited appended line disappears when items stop contributing.
 */
export const recalcReels = (lines = [], entries = [], makeId = () => undefined) => {
  const next = lines.map((line) => ({ ...line }));
  const autoIndex = next.findIndex((line) => line.isAuto);
  const auto = autoIndex === -1 ? null : next[autoIndex];

  if (auto?.isEdited) return next;

  const result = combineReels(entries, auto?.baseText || null);

  if (!result) {
    if (auto && !auto.baseText) next.splice(autoIndex, 1);
    return next;
  }

  if (auto) {
    auto.text = result.text;
    return next;
  }

  next.push({ ...blankLine(), _id: makeId(), text: result.text, isAuto: true, isEdited: false, baseText: '' });
  return next;
};

/** "Reset to auto": clears the manual flag and recalculates. */
export const resetReelsToAuto = (lines = [], entries = [], makeId) =>
  recalcReels(
    lines.map((line) => (line.isAuto ? { ...line, isEdited: false } : line)),
    entries,
    makeId,
  );

/** Marks a line as manually edited (call when the admin types into it). */
export const editLineText = (lines, lineId, text) =>
  lines.map((line) =>
    String(line._id) === String(lineId) ? { ...line, text, isEdited: line.isAuto ? true : Boolean(line.isEdited) } : line,
  );
