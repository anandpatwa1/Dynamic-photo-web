/**
 * Recursively strips empty strings from an object.
 *
 * Use this only on a payload that *creates* a record. On a PATCH it is actively
 * harmful: the server's partial update reads an omitted field as "leave
 * unchanged", so pruning a field the user just cleared leaves the old value in
 * the database — and it reappears the moment the form re-seeds. That is exactly
 * how "clearing a Settings field does nothing" happened.
 *
 * Arrays are returned untouched — an empty array is a meaningful value (it
 * means "no terms"), not an absent one.
 */
export const pruneEmpty = (value) => {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .map(([key, item]) => [key, pruneEmpty(item)])
        .filter(([, item]) => item !== '' && item !== undefined),
    );
  }
  return value;
};

/**
 * Normalises a form's values for a PATCH.
 *
 * Empty strings are kept, so the server can tell "the user cleared this" apart
 * from "this was not part of the form" and turn the former into a removal.
 * `undefined` is still dropped, because that genuinely does mean absent.
 */
export const keepCleared = (value) => {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .map(([key, item]) => [key, keepCleared(item)])
        .filter(([, item]) => item !== undefined),
    );
  }
  return typeof value === 'string' ? value.trim() : value;
};
