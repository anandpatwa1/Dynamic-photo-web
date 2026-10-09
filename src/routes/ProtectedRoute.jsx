import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { PageLoader } from '@/components/ui';

/** Gate for signed-in routes; remembers where the user was heading. */
export const ProtectedRoute = ({ adminOnly = false, platformOnly = false, permission, feature }) => {
  const { isAuthenticated, initialising, isAdmin, isPlatformAdmin, can, hasFeature } = useAuth();
  const location = useLocation();

  // Wait for the boot-time session check before deciding anything.
  if (initialising) return <PageLoader label="Preparing your workspace" />;

  if (!isAuthenticated) {
    return <Navigate to="/CRM/login" replace state={{ from: location.pathname }} />;
  }

  if (adminOnly && !isAdmin) return <Navigate to="/CRM/dashboard" replace />;
  if (platformOnly && !isPlatformAdmin) return <Navigate to="/CRM/dashboard" replace />;
  if (permission && !can(permission)) return <Navigate to="/CRM/dashboard" replace />;
  if (feature && !hasFeature(feature)) return <Navigate to="/CRM/dashboard" replace />;

  return <Outlet />;
};

/** Keeps signed-in users away from the login/register screens. */
export const PublicOnlyRoute = () => {
  const { isAuthenticated, initialising } = useAuth();

  if (initialising) return <PageLoader label="Loading" />;
  if (isAuthenticated) return <Navigate to="/CRM/dashboard" replace />;

  return <Outlet />;
};
