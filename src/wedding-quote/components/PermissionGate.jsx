import { ShieldOff } from 'lucide-react';
import { EmptyState, PageLoader } from '@/components/ui';
import { useWqPermissions } from '../hooks/useWqPermissions';
import { T } from '../constants/strings';

/** Hides a page unless the user has one of `anyOf` (UI only — the API enforces too). */
export const PermissionGate = ({ anyOf = [], children }) => {
  const perms = useWqPermissions();
  if (!perms.loaded) return <PageLoader />;
  if (!anyOf.some((a) => perms[a])) return <EmptyState icon={ShieldOff} title={T.module} description={T.common.noPermission} />;
  return typeof children === 'function' ? children(perms) : children;
};
