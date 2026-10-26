import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  Building2,
  ChevronDown,
  LogOut,
  Menu,
  Settings,
  Sparkles,
  User as UserIcon,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { Avatar, Badge, Button, Dropdown, DropdownDivider, DropdownItem } from '@/components/ui';
import { logout } from '@/redux/auth/authSlice';
import { humanize } from '@/utils/format';
import { CRM } from '@/routes/paths';
import { useWqPermissions } from '@/wedding-quote/hooks/useWqPermissions';
import { T as WQ } from '@/wedding-quote/constants/strings';
import { tokenStore } from '@/api/axios';
import { BUSINESS_FEATURES } from '@/constants';
import { useAuth } from '@/hooks/useAuth';

export const Topbar = ({ user, business, isPlatformAdmin, onOpenNav }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const wqPerms = useWqPermissions();
  const { hasFeature } = useAuth();

  const handleLogout = async () => {
    await dispatch(logout());
    toast.success('Signed out');
    navigate('/CRM/login', { replace: true });
  };

  const exitSupportWorkspace = () => {
    tokenStore.clearBusinessContext();
    window.location.assign(CRM.businesses);
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-ink-200/70 bg-white/85 px-4 backdrop-blur-md sm:px-6">
      <Button
        variant="ghost"
        size="sm"
        iconOnly
        icon={Menu}
        onClick={onOpenNav}
        aria-label="Open navigation"
        className="lg:hidden"
      />

      {isPlatformAdmin && business && (
        <div className="flex min-w-0 items-center gap-2 rounded-xl bg-info-50 px-2.5 py-1.5 text-info-700 ring-1 ring-inset ring-info-100 sm:px-3">
          <Building2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="hidden min-w-0 text-xs font-medium min-[480px]:block sm:text-sm">
            <span className="hidden md:inline">Supporting </span>
            <span className="block max-w-24 truncate sm:max-w-48 md:inline">{business.name}</span>
          </span>
          <button
            type="button"
            onClick={exitSupportWorkspace}
            className="rounded-md p-0.5 transition-colors hover:bg-info-100"
            aria-label={`Exit ${business.name} support workspace`}
            title="Exit support workspace"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      )}

      <div className="flex-1" />

      {/* Wedding Quote: always visible (icon-only on small screens) for users who can create. */}
      {hasFeature(BUSINESS_FEATURES.WEDDING_QUOTES) && wqPerms.createQuote && (
        <>
          <Button as={Link} to={CRM.wqCreate} size="sm" icon={Sparkles} className="hidden sm:inline-flex">
            {WQ.nav.create}
          </Button>
          <Button as={Link} to={CRM.wqCreate} size="sm" iconOnly icon={Sparkles} aria-label={WQ.nav.create} className="sm:hidden" />
        </>
      )}

      <Dropdown
        trigger={({ toggle }) => (
          <button
            type="button"
            onClick={toggle}
            className="flex items-center gap-2.5 rounded-xl py-1.5 pl-1.5 pr-2.5 transition-colors hover:bg-ink-100"
          >
            <Avatar src={user?.avatar?.url} name={user?.name} size="sm" />
            <span className="hidden text-left sm:block">
              <span className="block text-sm font-medium leading-tight text-ink-900">
                {user?.name}
              </span>
              <span className="block text-xs leading-tight text-ink-500">
                {humanize(user?.role)}
              </span>
            </span>
            <ChevronDown className="h-4 w-4 text-ink-400" aria-hidden="true" />
          </button>
        )}
      >
        <div className="flex items-center gap-3 px-2.5 py-2">
          <Avatar src={user?.avatar?.url} name={user?.name} size="md" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink-900">{user?.name}</p>
            <p className="truncate text-xs text-ink-500">{user?.email}</p>
            <Badge tone="brand" size="sm" className="mt-1.5">
              {humanize(user?.role)}
            </Badge>
          </div>
        </div>

        <DropdownDivider />

        <DropdownItem as={Link} to="/CRM/profile" icon={UserIcon}>
          Your profile
        </DropdownItem>
        <DropdownItem as={Link} to="/CRM/settings" icon={Settings}>
          Studio settings
        </DropdownItem>

        <DropdownDivider />

        <DropdownItem icon={LogOut} danger onClick={handleLogout}>
          Sign out
        </DropdownItem>
      </Dropdown>
    </header>
  );
};
