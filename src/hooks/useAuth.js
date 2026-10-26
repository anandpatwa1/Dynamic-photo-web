import { useSelector } from 'react-redux';
import {
  selectAuthError,
  selectAuthFieldErrors,
  selectAuthInitialising,
  selectAuthLoading,
  selectBusiness,
  selectIsAuthenticated,
  selectUser,
} from '@/redux/auth/authSlice';
import { ACCOUNT_SCOPES, ROLES } from '@/constants';

/** Convenience accessor for the current session and derived role checks. */
export const useAuth = () => {
  const user = useSelector(selectUser);
  const business = useSelector(selectBusiness);
  const permissions = user?.effectivePermissions ?? [];
  const can = (permission) => permissions.includes(permission);
  const isPlatformAdmin = user?.accountScope === ACCOUNT_SCOPES.PLATFORM && user?.role === ROLES.SUPER_ADMIN;
  const hasFeature = (feature) => isPlatformAdmin || Boolean(business?.enabledFeatures?.includes(feature));

  return {
    user,
    business,
    isAuthenticated: useSelector(selectIsAuthenticated),
    initialising: useSelector(selectAuthInitialising),
    loading: useSelector(selectAuthLoading),
    error: useSelector(selectAuthError),
    fieldErrors: useSelector(selectAuthFieldErrors),
    permissions,
    can,
    hasFeature,
    isAdmin: user?.role === ROLES.SUPER_ADMIN || user?.role === ROLES.ADMIN,
    isSuperAdmin: user?.role === ROLES.SUPER_ADMIN,
    isPlatformAdmin,
    isManager: user?.role === ROLES.MANAGER,
    canManage: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.SUB_ADMIN, ROLES.MANAGER].includes(user?.role),
  };
};
