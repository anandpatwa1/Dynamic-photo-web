import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { ChevronDown, LogOut, Menu, Settings, Sparkles, User as UserIcon } from 'lucide-react';
import toast from 'react-hot-toast';

import { Avatar, Badge, Button, Dropdown, DropdownDivider, DropdownItem } from '@/components/ui';
import { logout } from '@/redux/auth/authSlice';
import { humanize } from '@/utils/format';
import { CRM } from '@/routes/paths';
import { useWqPermissions } from '@/wedding-quote/hooks/useWqPermissions';
import { T as WQ } from '@/wedding-quote/constants/strings';

export const Topbar = ({ user, onOpenNav }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const wqPerms = useWqPermissions();

  const handleLogout = async () => {
    await dispatch(logout());
    toast.success('Signed out');
    navigate('/CRM/login', { replace: true });
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

      <div className="flex-1" />

      {/* Wedding Quote: always visible (icon-only on small screens) for users who can create. */}
      {wqPerms.createQuote && (
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
