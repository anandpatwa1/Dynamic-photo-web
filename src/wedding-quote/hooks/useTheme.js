import { useEffect, useState } from 'react';
import { wqThemeApi } from '../api/wqApi';

/** Asset bodies are fetched only for a displayed design, never by list APIs. */
export const useTheme = (theme, enabled = true) => {
  const [loaded, setLoaded] = useState(null);
  const [error, setError] = useState(null);
  const id = theme?._id;
  useEffect(() => {
    if (!enabled) { setLoaded(null); return undefined; }
    if (theme?.definition || !id) return undefined;
    let active = true;
    setError(null);
    wqThemeApi.get(id).then(r => { if (active) setLoaded(r.theme); }).catch(e => { if (active) setError(e?.response?.data?.message ?? 'Could not load theme'); });
    return () => { active = false; };
  }, [id, enabled, theme?.definition]);
  return { theme: theme?.definition ? theme : String(loaded?._id) === String(id) ? loaded : null, error };
};
