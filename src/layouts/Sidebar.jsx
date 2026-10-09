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
  CalendarDays,
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
  ReceiptText,
  ShieldCheck,
  History,
  Building2,
  X,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { Logo } from '@/components/common/Logo';
import { Button } from '@/components/ui';
import { CRM } from '@/routes/paths';
import { useWqPermissions } from '@/wedding-quote/hooks/useWqPermissions';
import { T as WQ } from '@/wedding-quote/constants/strings';
import { BUSINESS_FEATURES, PERMISSIONS } from '@/constants';
import { useAuth } from '@/hooks/useAuth';

/** Navigation is filtered from the signed-in user's live permissions. */
export const NAV_SECTIONS = [
  {
    label: 'Platform',
    items: [
      { to: CRM.businesses, label: 'Businesses', icon: Building2, platformOnly: true },
    ],
  },
  {
    label: 'Overview',
    items: [{ to: CRM.dashboard, label: 'Dashboard', icon: LayoutDashboard, permission: PERMISSIONS.DASHBOARD_VIEW }],
  },
  {
    label: 'Studio',
    items: [
      { to: CRM.clients, label: 'Clients', icon: Users, permission: PERMISSIONS.CLIENTS_VIEW, feature: BUSINESS_FEATURES.CRM_CLIENTS },
      { to: CRM.packages, label: 'Packages', icon: Package, permission: PERMISSIONS.PACKAGES_VIEW, feature: BUSINESS_FEATURES.CRM_PACKAGES },
      { to: CRM.projects, label: 'Projects', icon: FolderKanban, permission: PERMISSIONS.PROJECTS_VIEW, feature: BUSINESS_FEATURES.PROJECTS },
    ],
  },
  {
    label: 'Finance',
    items: [
      { to: CRM.quotations, label: 'Quotations', icon: MessageSquareQuote, permission: PERMISSIONS.DOCUMENTS_VIEW, feature: BUSINESS_FEATURES.DOCUMENTS },
      { to: CRM.estimates, label: 'Estimates', icon: FileText, permission: PERMISSIONS.DOCUMENTS_VIEW, feature: BUSINESS_FEATURES.DOCUMENTS },
      { to: CRM.bills, label: 'Bills / Invoices', icon: ReceiptText, permission: PERMISSIONS.DOCUMENTS_VIEW, feature: BUSINESS_FEATURES.DOCUMENTS },
      { to: CRM.payments, label: 'Payments', icon: CreditCard, permission: PERMISSIONS.PAYMENTS_VIEW, feature: BUSINESS_FEATURES.PAYMENTS },
      { to: CRM.reports, label: 'Reports', icon: BarChart3, permission: PERMISSIONS.REPORTS_VIEW, feature: BUSINESS_FEATURES.REPORTS },
    ],
  },
  {
    // Wedding Quote module: each item is gated by its module permission (A13).
    label: WQ.module,
    items: [
      { to: CRM.wqCreate, label: WQ.nav.create, icon: Sparkles, wqPerm: ['createQuote'], feature: BUSINESS_FEATURES.WEDDING_QUOTES },
      { to: CRM.wqQuotes, label: WQ.nav.all, icon: Heart, wqPerm: ['viewQuotes'], feature: BUSINESS_FEATURES.WEDDING_QUOTES },
      { to: CRM.wqBookings, label: WQ.nav.bookings, icon: CalendarDays, wqPerm: ['viewQuotes', 'createQuote', 'editQuote', 'manageMasters'], feature: BUSINESS_FEATURES.BOOKING_CALENDAR },
      { to: CRM.wqItems, label: `${WQ.nav.mastersGroup} · ${WQ.nav.items}`, icon: ListChecks, wqPerm: ['manageMasters'], feature: BUSINESS_FEATURES.WEDDING_QUOTES },
      { to: CRM.wqSets, label: `${WQ.nav.mastersGroup} · ${WQ.nav.sets}`, icon: Layers, wqPerm: ['manageMasters'], feature: BUSINESS_FEATURES.WEDDING_QUOTES },
      { to: CRM.wqAddOns, label: `${WQ.nav.mastersGroup} · ${WQ.nav.addOns}`, icon: Gift, wqPerm: ['manageMasters'], feature: BUSINESS_FEATURES.WEDDING_QUOTES },
      { to: CRM.wqPresets, label: `${WQ.nav.mastersGroup} · ${WQ.nav.presets}`, icon: Gem, wqPerm: ['manageMasters'], feature: BUSINESS_FEATURES.WEDDING_QUOTES },
      { to: CRM.wqThemes, label: `${WQ.nav.themesGroup} · ${WQ.nav.themes}`, icon: Palette, wqPerm: ['manageThemes'], feature: BUSINESS_FEATURES.THEME_LIBRARY },
      { to: CRM.wqThemeAssignment, label: `${WQ.nav.themesGroup} · ${WQ.nav.dayAssignment}`, icon: CalendarRange, wqPerm: ['manageThemes'], feature: BUSINESS_FEATURES.THEME_LIBRARY },
      { to: CRM.wqSettings, label: WQ.nav.settings, icon: SlidersHorizontal, wqPerm: ['manageMasters', 'managePermissions'], feature: BUSINESS_FEATURES.WEDDING_QUOTES },
    ],
  },
  {
    label: 'Website',
    items: [
      { to: CRM.websiteProfiles, label: 'Public Profiles', icon: ContactRound, permission: PERMISSIONS.WEBSITE_MANAGE, feature: BUSINESS_FEATURES.PUBLIC_PROFILES },
      { to: CRM.websiteHomepage, label: 'Homepage', icon: Globe, permission: PERMISSIONS.WEBSITE_MANAGE },
      { to: CRM.websitePortfolio, label: 'Portfolio', icon: Image, permission: PERMISSIONS.WEBSITE_MANAGE, feature: BUSINESS_FEATURES.PORTFOLIO },
      { to: CRM.websiteSections, label: 'Sections & Videos', icon: Clapperboard, permission: PERMISSIONS.WEBSITE_MANAGE, feature: BUSINESS_FEATURES.PORTFOLIO },
      { to: CRM.websitePackages, label: 'Packages', icon: Package, permission: PERMISSIONS.WEBSITE_MANAGE, feature: BUSINESS_FEATURES.WEBSITE_PACKAGES },
      { to: CRM.websiteTestimonials, label: 'Testimonials', icon: MessageSquareQuote, permission: PERMISSIONS.WEBSITE_MANAGE, feature: BUSINESS_FEATURES.TESTIMONIALS },
      { to: CRM.websiteInquiries, label: 'Inquiries', icon: Inbox, permission: PERMISSIONS.WEBSITE_MANAGE, feature: BUSINESS_FEATURES.INQUIRIES },
      { to: CRM.websiteContact, label: 'Contact', icon: Phone, permission: PERMISSIONS.WEBSITE_MANAGE },
      { to: CRM.websiteSeo, label: 'SEO', icon: Search, permission: PERMISSIONS.WEBSITE_MANAGE },
      { to: CRM.websiteSettings, label: 'Website Settings', icon: Sliders, permission: PERMISSIONS.WEBSITE_MANAGE },
    ],
  },
  {
    label: 'Workspace',
    items: [
      { to: CRM.team, label: 'Team & Permissions', icon: ShieldCheck, permission: PERMISSIONS.TEAM_MANAGE },
      { to: CRM.activity, label: 'Activity Logs', icon: History, permission: PERMISSIONS.ACTIVITY_VIEW },
      { to: CRM.settings, label: 'Settings', icon: Settings, permission: PERMISSIONS.SETTINGS_MANAGE },
    ],
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

export const Sidebar = ({ mobileOpen, onClose }) => {
  const wqPerms = useWqPermissions();
  const { can, hasFeature, isPlatformAdmin } = useAuth();
  const sections = NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter(
      (item) => (!item.platformOnly || isPlatformAdmin)
        && (!item.permission || can(item.permission))
        && (!item.feature || hasFeature(item.feature))
        && (!item.wqPerm || item.wqPerm.some((p) => wqPerms[p])),
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
