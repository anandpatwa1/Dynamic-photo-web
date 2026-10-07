import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useAuth } from '@/hooks/useAuth';

/** Signed-in shell: fixed sidebar, sticky topbar, scrolling content column. */
export const AppLayout = () => {
  const { user, isAdmin } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const location = useLocation();

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-paper">
      <Sidebar isAdmin={isAdmin} mobileOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

      <div className="flex min-h-screen min-w-0 flex-col lg:pl-68">
        <Topbar user={user} onOpenNav={() => setMobileNavOpen(true)} />

        <main className="min-w-0 flex-1 px-3 py-5 min-[360px]:px-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-8xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
