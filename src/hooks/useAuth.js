import { useSelector } from 'react-redux';
import {
  selectAuthError,
  selectAuthFieldErrors,
  selectAuthInitialising,
  selectAuthLoading,
  selectIsAuthenticated,
  selectUser,
} from '@/redux/auth/authSlice';
import { ROLES } from '@/constants';

/** Convenience accessor for the current session and derived role checks. */
export const useAuth = () => {
  const user = useSelector(selectUser);

  return {
    user,
    isAuthenticated: useSelector(selectIsAuthenticated),
    initialising: useSelector(selectAuthInitialising),
    loading: useSelector(selectAuthLoading),
    error: useSelector(selectAuthError),
    fieldErrors: useSelector(selectAuthFieldErrors),
    isAdmin: user?.role === ROLES.ADMIN,
    isManager: user?.role === ROLES.MANAGER,
    canManage: user?.role === ROLES.ADMIN || user?.role === ROLES.MANAGER,
  };
};
