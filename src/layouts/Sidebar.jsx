import { NavLink } from 'react-router-dom';
import {
  BarChart3,
  Clapperboard,
  CreditCard,
  FileText,
  FolderKanban,
  Gem,
  Globe,
  Heart,
  ListChecks,
  Palette,
  CalendarRange,
  Gift,
  Layers,
  SlidersHorizontal,
  Sparkles,
  Image,
  Inbox,
  LayoutDashboard,
  MessageSquareQuote,
  Package,
  Phone,
  Search,
  Settings,
  Sliders,
  Users,
  ContactRound,
  X,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { Logo } from '@/components/common/Logo';
import { Button } from '@/components/ui';
import { CRM } from '@/routes/paths';
import { useWqPermissions } from '@/wedding-quote/hooks/useWqPermissions';
import { T as WQ } from '@/wedding-quote/constants/strings';

/** `adminOnly` items are filtered out for non-admin roles. */
export const NAV_SECTIONS = [
  {
    label: 'Overview',
    items: [{ to: CRM.dashboard, label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'Studio',
    items: [
      { to: CRM.clients, label: 'Clients', icon: Users },
      { to: CRM.packages, label: 'Packages', icon: Package },
      { to: CRM.projects, label: 'Projects', icon: FolderKanban },
    ],
  },
  {
    label: 'Finance',
    items: [
      { to: CRM.documents, label: 'Documents', icon: FileText },
      { to: CRM.payments, label: 'Payments', icon: CreditCard },
      { to: CRM.reports, label: 'Reports', icon: BarChart3 },
    ],
  },
  {
    // Wedding Quote module: each item is gated by its module permission (A13).
    label: WQ.module,
    items: [
      { to: CRM.wqCreate, label: WQ.nav.create, icon: Sparkles, wqPerm: ['createQuote'] },
      { to: CRM.wqQuotes, label: WQ.nav.all, icon: Heart, wqPerm: ['viewQuotes'] },
      { to: CRM.wqItems, label: `${WQ.nav.mastersGroup} · ${WQ.nav.items}`, icon: ListChecks, wqPerm: ['manageMasters'] },
      { to: CRM.wqSets, label: `${WQ.nav.mastersGroup} · ${WQ.nav.sets}`, icon: Layers, wqPerm: ['manageMasters'] },
      { to: CRM.wqAddOns, label: `${WQ.nav.mastersGroup} · ${WQ.nav.addOns}`, icon: Gift, wqPerm: ['manageMasters'] },
      { to: CRM.wqPresets, label: `${WQ.nav.mastersGroup} · ${WQ.nav.presets}`, icon: Gem, wqPerm: ['manageMasters'] },
      { to: CRM.wqThemes, label: `${WQ.nav.themesGroup} · ${WQ.nav.themes}`, icon: Palette, wqPerm: ['manageThemes'] },
      { to: CRM.wqThemeAssignment, label: `${WQ.nav.themesGroup} · ${WQ.nav.dayAssignment}`, icon: CalendarRange, wqPerm: ['manageThemes'] },
      { to: CRM.wqSettings, label: WQ.nav.settings, icon: SlidersHorizontal, wqPerm: ['manageMasters', 'managePermissions'] },
    ],
  },
  {
    label: 'Website',
    items: [
      { to: CRM.websiteProfiles, label: 'Public Profiles', icon: ContactRound, adminOnly: true },
      { to: CRM.websiteHomepage, label: 'Homepage', icon: Globe, adminOnly: true },
      { to: CRM.websitePortfolio, label: 'Portfolio', icon: Image, adminOnly: true },
      { to: CRM.websiteSections, label: 'Sections & Videos', icon: Clapperboard, adminOnly: true },
      { to: CRM.websitePackages, label: 'Packages', icon: Package, adminOnly: true },
      { to: CRM.websiteTestimonials, label: 'Testimonials', icon: MessageSquareQuote, adminOnly: true },
      { to: CRM.websiteInquiries, label: 'Inquiries', icon: Inbox, adminOnly: true },
      { to: CRM.websiteContact, label: 'Contact', icon: Phone, adminOnly: true },
      { to: CRM.websiteSeo, label: 'SEO', icon: Search, adminOnly: true },
      { to: CRM.websiteSettings, label: 'Website Settings', icon: Sliders, adminOnly: true },
    ],
  },
  {
    label: 'Workspace',
    items: [{ to: CRM.settings, label: 'Settings', icon: Settings, adminOnly: true }],
  },
];

const NavItem = ({ item, onNavigate }) => (
  <NavLink
    to={item.to}
    onClick={onNavigate}
    className={({ isActive }) =>
      cn(
        'group relative flex items-center gap-3 rounded-xl px-3 py-2 text-base font-medium transition-all duration-150 ease-smooth',
        isActive
          ? 'bg-ink-900 text-white shadow-xs'
          : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900',
      )
    }
  >
    {({ isActive }) => (
      <>
        <item.icon
          className={cn('h-4.5 w-4.5 shrink-0', isActive ? 'text-brand-300' : 'text-ink-400 group-hover:text-ink-600')}
          aria-hidden="true"
        />
        <span className="truncate">{item.label}</span>
      </>
    )}
  </NavLink>
);

export const Sidebar = ({ isAdmin, mobileOpen, onClose }) => {
  const wqPerms = useWqPermissions();
  const sections = NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter(
      (item) => (!item.adminOnly || isAdmin) && (!item.wqPerm || item.wqPerm.some((p) => wqPerms[p])),
    ),
  })).filter((section) => section.items.length > 0);

  return (
    <>
      {/* Mobile scrim */}
      <div
        onClick={onClose}
        className={cn(
          'fixed inset-0 z-40 bg-ink-950/30 backdrop-blur-[2px] transition-opacity lg:hidden',
          mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        aria-hidden="true"
      />

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-68 flex-col border-r border-ink-200/80 bg-white',
          'transition-transform duration-300 ease-smooth lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-ink-200/70 px-5">
          <Logo size="sm" />
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            icon={X}
            onClick={onClose}
            aria-label="Close navigation"
            className="lg:hidden"
          />
        </div>

        <nav className="scrollbar-slim flex-1 space-y-6 overflow-y-auto px-3 py-5">
          {sections.map((section) => (
            <div key={section.label}>
              <p className="px-3 pb-2 text-2xs font-semibold uppercase tracking-wider text-ink-400">
                {section.label}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <NavItem key={item.to} item={item} onNavigate={onClose} />
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="shrink-0 border-t border-ink-200/70 p-3">
          <div className="rounded-xl bg-gradient-to-br from-brand-50 to-brand-100/50 p-3.5 ring-1 ring-inset ring-brand-200/50">
            <p className="text-sm font-semibold text-brand-900">Dynamic Production</p>
            <p className="mt-0.5 text-xs leading-relaxed text-brand-700/70">
              Capturing moments, creating impact.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
