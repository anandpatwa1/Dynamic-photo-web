/**
 * Notes collection + duplicate collapse (Master Spec A7).
 * SHARED FILE — identical copy lives in client/src/wedding-quote/utils/engine/.
 */
export const normalizeNote = (text) =>
  String(text ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

/** Quote notes → entry notes → deliverable-line notes, deduped, one line each. */
export const collectNotes = (quote = {}) => {
  const raw = [
    ...(quote.notes ?? []),
    ...(quote.days ?? []).flatMap((day) => (day.entries ?? []).map((entry) => entry.note)),
    ...(quote.deliverables?.lines ?? []).map((line) => line.note),
  ];
  const seen = new Set();
  const out = [];
  for (const note of raw) {
    const key = normalizeNote(note);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    // Compact: render on one line, collapsing internal newlines/spacing.
    out.push(String(note).replace(/\s+/g, ' ').trim());
  }
  return out;
};
