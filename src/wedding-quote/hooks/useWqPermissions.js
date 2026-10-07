import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchWqMe } from '../redux/wqSlices';
import { WQ_ACTIONS } from '../utils/engine/permissions';

/** The caller's Wedding Quote permission map (UI hiding only — server enforces). */
export const useWqPermissions = () => {
  const dispatch = useDispatch();
  const { me, meLoaded } = useSelector((s) => s.wqMeta);
  useEffect(() => {
    if (!meLoaded) dispatch(fetchWqMe());
  }, [dispatch, meLoaded]);
  const perms = Object.fromEntries(WQ_ACTIONS.map((a) => [a, Boolean(me?.[a])]));
  return { ...perms, loaded: meLoaded };
};
