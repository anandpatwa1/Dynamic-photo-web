/**
 * Theme ↔ day-count assignment rules (Phase 3.8).
 * SHARED FILE — identical copy lives in client/src/wedding-quote/utils/engine/.
 */
export const MAX_THEMES_PER_DAY = 5;

/** Returns { ok, value, error }; dedupes and guarantees exactly one default. */
export const normalizeAssignment = ({ dayCount, themeIds = [], defaultThemeId = null }) => {
  if (!Number.isInteger(dayCount) || dayCount < 1 || dayCount > 10) return { ok: false, error: 'Day count must be 1–10' };
  const ids = [...new Set(themeIds.map(String))];
  if (ids.length > MAX_THEMES_PER_DAY) return { ok: false, error: `At most ${MAX_THEMES_PER_DAY} themes per day count` };
  let def = defaultThemeId ? String(defaultThemeId) : null;
  if (!ids.length) def = null;
  else if (!def || !ids.includes(def)) def = ids[0];
  return { ok: true, value: { dayCount, themeIds: ids, defaultThemeId: def } };
};

/**
 * Themes offered for a day count: its own assignment, else the nearest lower
 * assigned day count, else built-ins whose forDays include it, else all built-ins.
 */
export const resolveThemes = (assignments = [], dayCount, themes = []) => {
  const byId = new Map(themes.map((t) => [String(t._id ?? t.key), t]));
  const usable = (a) => a && a.themeIds?.some((id) => byId.get(String(id))?.isActive !== false && byId.has(String(id)));
  const sorted = [...assignments].sort((a, b) => b.dayCount - a.dayCount);
  const hit = assignments.find((a) => a.dayCount === dayCount && usable(a)) ?? sorted.find((a) => a.dayCount < dayCount && usable(a));
  if (hit) {
    const list = hit.themeIds.map((id) => byId.get(String(id))).filter((t) => t && t.isActive !== false);
    const def = byId.get(String(hit.defaultThemeId)) && list.includes(byId.get(String(hit.defaultThemeId)))
      ? byId.get(String(hit.defaultThemeId)) : list[0];
    return { themes: list, defaultTheme: def, source: hit.dayCount === dayCount ? 'assigned' : 'fallback-lower' };
  }
  const builtIns = themes.filter((t) => t.isBuiltIn && t.isActive !== false);
  const matching = builtIns.filter((t) => (t.forDays ?? t.definition?.forDays ?? []).includes(dayCount));
  const list = matching.length ? matching : builtIns;
  return { themes: list, defaultTheme: list[0] ?? themes[0] ?? null, source: 'builtin' };
};
