/**
 * Permission matrix (Master Spec A13).
 * SHARED FILE — identical copy lives in client/src/wedding-quote/utils/engine/.
 */
export const WQ_ACTIONS = [
  'viewQuotes', 'createQuote', 'editQuote', 'deleteQuote', 'manageMasters',
  'manageThemes', 'viewCosting', 'exportJpg', 'managePermissions',
];
export const WQ_ROLES = ['admin', 'manager', 'staff'];

const all = (value) => Object.fromEntries(WQ_ACTIONS.map((a) => [a, value]));

export const DEFAULT_PERMISSIONS = {
  admin: all(true),
  manager: { ...all(true), managePermissions: false },
  staff: { ...all(false), viewQuotes: true, createQuote: true, exportJpg: true },
};

/** Fills gaps with defaults; admin always keeps managePermissions (no lock-out). */
export const normalizeMatrix = (matrix = {}) => {
  const out = {};
  for (const role of WQ_ROLES) {
    const source = matrix?.[role] ?? {};
    out[role] = {};
    for (const action of WQ_ACTIONS) {
      out[role][action] = typeof source[action] === 'boolean' ? source[action] : DEFAULT_PERMISSIONS[role][action];
    }
  }
  out.admin.managePermissions = true;
  return out;
};

export const can = (matrix, role, action) => Boolean(normalizeMatrix(matrix)?.[role]?.[action]);

export const permissionsFor = (matrix, role) => normalizeMatrix(matrix)[role] ?? all(false);
