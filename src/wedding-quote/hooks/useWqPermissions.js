import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchWqMe } from '../redux/wqSlices';
import { WQ_ACTIONS } from '../utils/engine/permissions';
import { useAuth } from '@/hooks/useAuth';
import { BUSINESS_FEATURES } from '@/constants';

/** The caller's Wedding Quote permission map (UI hiding only — server enforces). */
export const useWqPermissions = () => {
  const dispatch = useDispatch();
  const { me, meLoaded } = useSelector((s) => s.wqMeta);
  const { hasFeature } = useAuth();
  const enabled = hasFeature(BUSINESS_FEATURES.WEDDING_QUOTES);
  useEffect(() => {
    if (enabled && !meLoaded) dispatch(fetchWqMe());
  }, [dispatch, enabled, meLoaded]);
  const perms = Object.fromEntries(WQ_ACTIONS.map((a) => [a, Boolean(me?.[a])]));
  return enabled ? { ...perms, loaded: meLoaded } : {
    ...Object.fromEntries(WQ_ACTIONS.map((action) => [action, false])),
    loaded: true,
  };
};
