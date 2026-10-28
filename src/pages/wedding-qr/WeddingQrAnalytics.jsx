import { useCallback, useEffect, useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  Clock,
  Eye,
  Filter,
  HardDrive,
  HelpCircle,
  Image as ImageIcon,
  Info,
  Instagram,
  Layers,
  Mail,
  MessageSquare,
  Minus,
  RefreshCw,
  Send,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  Users,
  XCircle,
} from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  EmptyState,
  PageHeader,
  Select,
} from '@/components/ui';
import { CRM } from '@/routes/paths';
import { weddingQrApi } from '@/api/weddingQrApi';

// Recharts theme tokens consistent with CRM palette
const CHART_COLORS = {
  visits: '#3B82F6', // Blue
  instagram: '#E1306C', // Instagram Rose/Magenta
  confirmations: '#D97706', // Warm Amber
  registrations: '#10B981', // Emerald
  galleries: '#8B5CF6', // Purple
  notifications: '#0284C7', // Sky
  grid: '#E2E8F0',
  axis: '#64748B',
};

export const WeddingQrAnalytics = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Filters from query params
  const initialProjectId = searchParams.get('projectId') || 'all';
  const initialCycle = searchParams.get('cycle') || 'all';

  const [projectsList, setProjectsList] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(initialProjectId);
  const [selectedCycle, setSelectedCycle] = useState(initialCycle);
  const [dateRange, setDateRange] = useState('30d'); // 7d, 30d, 90d, all
  const [timelineInterval, setTimelineInterval] = useState('auto'); // auto, hourly, daily

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Analytics states
  const [summaryData, setSummaryData] = useState(null);
  const [funnelData, setFunnelData] = useState(null);
  const [timelineData, setTimelineData] = useState([]);
  const [galleryData, setGalleryData] = useState(null);
  const [notificationData, setNotificationData] = useState(null);
  const [comparisonData, setComparisonData] = useState([]);

  // Calculate start/end dates from dateRange filter
  const dateFilterParams = useMemo(() => {
    if (dateRange === 'all') return {};
    const end = new Date();
    const start = new Date();
    if (dateRange === '7d') start.setDate(start.getDate() - 7);
    else if (dateRange === '30d') start.setDate(start.getDate() - 30);
    else if (dateRange === '90d') start.setDate(start.getDate() - 90);

    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    };
  }, [dateRange]);

  // Load project list for dropdown filter
  useEffect(() => {
    weddingQrApi.list({ limit: 100 }).then((res) => {
      const items = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.data?.projects)
        ? res.data.projects
        : Array.isArray(res?.projects)
        ? res.projects
        : [];
      setProjectsList(items);
    }).catch(() => {});
  }, []);

  // Selected project details
  const currentProject = useMemo(() => {
    if (selectedProjectId === 'all') return null;
    return projectsList.find((p) => String(p._id) === String(selectedProjectId));
  }, [projectsList, selectedProjectId]);

  // Available cycles for current project
  const availableCycles = useMemo(() => {
    if (!currentProject) return [];
    const maxCycle = currentProject.eventCycle || 1;
    const cycles = [];
    for (let c = 1; c <= maxCycle; c++) {
      cycles.push(c);
    }
    return cycles;
  }, [currentProject]);

  // Fetch all analytics datasets
  const fetchAnalytics = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    const params = {
      ...dateFilterParams,
      projectId: selectedProjectId !== 'all' ? selectedProjectId : undefined,
      eventCycle: selectedCycle !== 'all' ? selectedCycle : undefined,
    };

    try {
      const [sumRes, funRes, timeRes, galRes, notifRes, compRes] = await Promise.allSettled([
        weddingQrApi.getAnalyticsSummary(params),
        weddingQrApi.getAnalyticsFunnel(params),
        weddingQrApi.getAnalyticsTimeline({ ...params, interval: timelineInterval }),
        weddingQrApi.getAnalyticsGalleries(params),
        weddingQrApi.getAnalyticsNotifications(params),
        weddingQrApi.getAnalyticsComparison(),
      ]);

      if (sumRes.status === 'fulfilled') setSummaryData(sumRes.value?.data || sumRes.value);
      if (funRes.status === 'fulfilled') setFunnelData(funRes.value?.data || funRes.value);
      if (timeRes.status === 'fulfilled') setTimelineData(timeRes.value?.data?.timeline || timeRes.value?.timeline || []);
      if (galRes.status === 'fulfilled') setGalleryData(galRes.value?.data || galRes.value);
      if (notifRes.status === 'fulfilled') setNotificationData(notifRes.value?.data || notifRes.value);
      if (compRes.status === 'fulfilled') setComparisonData(compRes.value?.data || compRes.value || []);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedProjectId, selectedCycle, dateFilterParams, timelineInterval]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Update query params when project or cycle changes
  const handleProjectChange = (projId) => {
    setSelectedProjectId(projId);
    setSelectedCycle('all');
    const newParams = new URLSearchParams(searchParams);
    if (projId === 'all') newParams.delete('projectId');
    else newParams.set('projectId', projId);
    newParams.delete('cycle');
    setSearchParams(newParams);
  };

  const handleCycleChange = (cyc) => {
    setSelectedCycle(cyc);
    const newParams = new URLSearchParams(searchParams);
    if (cyc === 'all') newParams.delete('cycle');
    else newParams.set('cycle', cyc);
    setSearchParams(newParams);
  };

  // KPI helper to format numbers and percentage tags
  const renderKpiChange = (metricKey) => {
    if (!summaryData?.hasHistoricalComparison) {
      return (
        <span className="text-3xs text-ink-400 italic">
          Not enough historical data
        </span>
      );
    }
    const val = summaryData?.changes?.[metricKey];
    if (val === null || val === undefined) {
      return <span className="text-3xs text-ink-400">No prior baseline</span>;
    }
    if (val > 0) {
      return (
        <span className="inline-flex items-center gap-0.5 text-2xs font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
          <ArrowUpRight className="w-3 h-3" /> +{val}%
        </span>
      );
    }
    if (val < 0) {
      return (
        <span className="inline-flex items-center gap-0.5 text-2xs font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
          <ArrowDownRight className="w-3 h-3" /> {val}%
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-0.5 text-2xs font-semibold text-ink-500 bg-ink-100 px-1.5 py-0.5 rounded">
        <Minus className="w-3 h-3" /> 0%
      </span>
    );
  };

  const metrics = summaryData?.metrics || {};

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Wedding QR Analytics"
        description="Comprehensive analytics tracking the full guest journey: QR scans, Instagram clicks, Continue navigation, contact registrations, notification dispatches, and external gallery views."
        actions={
          <div className="flex items-center gap-2">
            <Button
              as={Link}
              to={CRM.driveGalleries}
              variant="outline"
              icon={HardDrive}
            >
              Google Drive Galleries
            </Button>
            <Button
              as={Link}
              to={CRM.weddingQr}
              variant="outline"
              icon={ArrowLeft}
            >
              Back to Projects
            </Button>
            <Button
              variant="outline"
              icon={RefreshCw}
              onClick={() => fetchAnalytics(true)}
              disabled={refreshing || loading}
            >
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        }
      />

      {/* Filter Toolbar */}
      <Card className="p-4 bg-white shadow-sm border border-ink-100">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-ink-600">
              <Filter className="w-4 h-4 text-brand-600" />
              <span>Filters:</span>
            </div>

            {/* Project Selector */}
            <div className="w-56">
              <Select
                value={selectedProjectId}
                onChange={(e) => handleProjectChange(e.target.value)}
                options={[
                  { value: 'all', label: 'All Projects (Global)' },
                  ...projectsList.map((p) => ({
                    value: p._id,
                    label: `${p.name} (${p.slug})`,
                  })),
                ]}
                className="text-xs"
              />
            </div>

            {/* Event Cycle Selector (when specific project selected) */}
            {selectedProjectId !== 'all' && (
              <div className="w-44">
                <Select
                  value={selectedCycle}
                  onChange={(e) => handleCycleChange(e.target.value)}
                  options={[
                    { value: 'all', label: 'All Event Cycles' },
                    ...availableCycles.map((c) => ({
                      value: String(c),
                      label: `Cycle #${c} ${c === currentProject?.eventCycle ? '(Current)' : '(Archived)'}`,
                    })),
                  ]}
                  className="text-xs"
                />
              </div>
            )}

            {/* Date Range Selector */}
            <div className="w-36">
              <Select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                options={[
                  { value: '7d', label: 'Last 7 Days' },
                  { value: '30d', label: 'Last 30 Days' },
                  { value: '90d', label: 'Last 90 Days' },
                  { value: 'all', label: 'All Time' },
                ]}
                className="text-xs"
              />
            </div>
          </div>

          {/* Active Filter Scope Info Pill */}
          <div className="flex items-center gap-2 text-2xs text-ink-500 bg-ink-50 px-3 py-1.5 rounded-lg border border-ink-100">
            <Info className="w-3.5 h-3.5 text-brand-500" />
            <span>
              Scope:{' '}
              <strong className="text-ink-800">
                {selectedProjectId === 'all' ? 'All Projects' : currentProject?.name || 'Selected Project'}
              </strong>
              {selectedCycle !== 'all' ? ` · Cycle #${selectedCycle}` : ''}
              {' · '}{dateRange === 'all' ? 'All time' : `Last ${dateRange.replace('d', '')} days`}
            </span>
          </div>
        </div>
      </Card>

      {/* KPI Cards Grid (10 Key Metrics) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* 1. Landing Visits & Unique */}
        <Card className="p-4 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-bold uppercase tracking-wider text-ink-400">Total Visits</span>
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <Eye className="w-4 h-4" />
            </span>
          </div>
          <div className="space-y-0.5">
            <div className="text-2xl font-bold text-ink-900">
              {loading ? '...' : (metrics.totalVisits || 0).toLocaleString()}
            </div>
            <div className="text-2xs text-ink-500 flex items-center justify-between">
              <span>Unique: <strong>{loading ? '...' : (metrics.uniqueVisitors || 0).toLocaleString()}</strong></span>
              {renderKpiChange('totalVisits')}
            </div>
          </div>
        </Card>

        {/* 2. Instagram Profile Clicks */}
        <Card className="p-4 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-bold uppercase tracking-wider text-ink-400">Instagram Clicks</span>
            <span className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
              <Instagram className="w-4 h-4" />
            </span>
          </div>
          <div className="space-y-0.5">
            <div className="text-2xl font-bold text-ink-900">
              {loading ? '...' : (metrics.instagramClicks || 0).toLocaleString()}
            </div>
            <div className="text-2xs text-ink-500 flex items-center justify-between">
              <span>Unique: <strong>{loading ? '...' : (metrics.uniqueInstagramClicks || 0).toLocaleString()}</strong></span>
              {renderKpiChange('instagramClicks')}
            </div>
          </div>
        </Card>

        {/* 3. Continue-Button Clicks */}
        <Card className="p-4 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-bold uppercase tracking-wider text-ink-400">Continue Clicks</span>
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <ArrowRight className="w-4 h-4" />
            </span>
          </div>
          <div className="space-y-0.5">
            <div className="text-2xl font-bold text-ink-900">
              {loading ? '...' : (metrics.continueClicks || metrics.confirmations || 0).toLocaleString()}
            </div>
            <div className="text-2xs text-ink-500 flex items-center justify-between">
              <span>Rate: <strong>{metrics.instagramClicks > 0 ? (((metrics.continueClicks || metrics.confirmations || 0) / metrics.instagramClicks) * 100).toFixed(1) : 0}%</strong> of IG clicks</span>
              {renderKpiChange('continueClicks')}
            </div>
          </div>
        </Card>

        {/* 4. Contact Registrations */}
        <Card className="p-4 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-bold uppercase tracking-wider text-ink-400">Contact Form</span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="space-y-0.5">
            <div className="text-2xl font-bold text-ink-900">
              {loading ? '...' : (metrics.registrations || 0).toLocaleString()}
            </div>
            <div className="text-2xs text-ink-500 flex items-center justify-between">
              <span>Conv: <strong>{metrics.totalVisits > 0 ? ((metrics.registrations / metrics.totalVisits) * 100).toFixed(1) : 0}%</strong></span>
              {renderKpiChange('registrations')}
            </div>
          </div>
        </Card>

        {/* 5. Gallery Link Clicks */}
        <Card className="p-4 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-bold uppercase tracking-wider text-ink-400">Gallery Clicks</span>
            <span className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
              <Layers className="w-4 h-4" />
            </span>
          </div>
          <div className="space-y-0.5">
            <div className="text-2xl font-bold text-ink-900">
              {loading ? '...' : (metrics.galleryClicks || 0).toLocaleString()}
            </div>
            <div className="text-2xs text-ink-500 flex items-center justify-between">
              <span>Unique: <strong>{loading ? '...' : (metrics.uniqueGalleryClickers || 0).toLocaleString()}</strong></span>
              {renderKpiChange('galleryClicks')}
            </div>
          </div>
        </Card>

        {/* 6. Email Opt-ins */}
        <Card className="p-4 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-bold uppercase tracking-wider text-ink-400">Email Opt-Ins</span>
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <Mail className="w-4 h-4" />
            </span>
          </div>
          <div className="space-y-0.5">
            <div className="text-2xl font-bold text-ink-900">
              {loading ? '...' : (metrics.emailOptIns || 0).toLocaleString()}
            </div>
            <div className="text-2xs text-ink-500">
              {metrics.bothOptIns || 0} opted for both Email + WA
            </div>
          </div>
        </Card>

        {/* 7. WhatsApp Opt-ins */}
        <Card className="p-4 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-bold uppercase tracking-wider text-ink-400">WhatsApp Opt-Ins</span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <MessageSquare className="w-4 h-4" />
            </span>
          </div>
          <div className="space-y-0.5">
            <div className="text-2xl font-bold text-ink-900">
              {loading ? '...' : (metrics.whatsappOptIns || 0).toLocaleString()}
            </div>
            <div className="text-2xs text-ink-500">
              Direct mobile notification reach
            </div>
          </div>
        </Card>

        {/* 8. Notifications Sent */}
        <Card className="p-4 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-bold uppercase tracking-wider text-ink-400">Messages Sent</span>
            <span className="p-1.5 rounded-lg bg-sky-50 text-sky-600">
              <Send className="w-4 h-4" />
            </span>
          </div>
          <div className="space-y-0.5">
            <div className="text-2xl font-bold text-ink-900">
              {loading ? '...' : (metrics.notificationsSent || 0).toLocaleString()}
            </div>
            <div className="text-2xs text-ink-500">
              Across {metrics.totalBatches || 0} batch runs
            </div>
          </div>
        </Card>

        {/* 9. Notification Delivery Success & Failures */}
        <Card className="p-4 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-bold uppercase tracking-wider text-ink-400">Delivery Status</span>
            <span className="p-1.5 rounded-lg bg-teal-50 text-teal-600">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="space-y-0.5">
            <div className="text-2xl font-bold text-ink-900">
              {metrics.notificationsSent + metrics.notificationsFailed > 0
                ? `${(((metrics.notificationsSent) / (metrics.notificationsSent + metrics.notificationsFailed)) * 100).toFixed(0)}%`
                : '100%'}
            </div>
            <div className="text-2xs text-ink-500 flex items-center justify-between">
              <span className="text-emerald-600 font-semibold">{metrics.notificationsSent || 0} sent</span>
              <span className="text-rose-600 font-semibold">{metrics.notificationsFailed || 0} failed</span>
            </div>
          </div>
        </Card>

        {/* 10. Duplicate Submissions Prevented */}
        <Card className="p-4 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-bold uppercase tracking-wider text-ink-400">Dupes Prevented</span>
            <span className="p-1.5 rounded-lg bg-ink-100 text-ink-700">
              <ShieldAlert className="w-4 h-4" />
            </span>
          </div>
          <div className="space-y-0.5">
            <div className="text-2xl font-bold text-ink-900">
              {loading ? '...' : (metrics.duplicatesPrevented || 0).toLocaleString()}
            </div>
            <div className="text-2xs text-ink-500">
              Guest re-registration handled safely
            </div>
          </div>
        </Card>
      </div>

      {/* Guest Journey Funnel & Conversion Rates (Section 4) */}
      <Card className="p-5 border border-ink-100 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-ink-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-ink-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-brand-600" />
              <span>Guest Funnel & Conversion Pipeline</span>
            </h3>
            <p className="text-2xs text-ink-500">
              Sequential drop-off analysis from initial QR code scan to external album viewing.
            </p>
          </div>
          <span className="text-3xs bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-full font-semibold">
            Unverified Self-Confirmation Model
          </span>
        </div>

        {funnelData?.stages?.length > 0 ? (
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-2">
              {funnelData.stages.map((stage, idx) => (
                <div
                  key={stage.stageId}
                  className="p-3.5 rounded-xl border border-ink-100 bg-ink-50/50 flex flex-col justify-between space-y-3 relative group hover:border-brand-300 transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="w-5 h-5 rounded-full bg-brand-500 text-white font-bold text-2xs flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="text-2xs font-mono font-bold text-brand-700">
                        {stage.conversionRate}%
                      </span>
                    </div>
                    <div className="text-xs font-bold text-ink-800 line-clamp-2 pt-1">
                      {stage.name}
                    </div>
                    <p className="text-3xs text-ink-400 line-clamp-2">
                      {stage.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-ink-100/80 space-y-1">
                    <div className="text-lg font-bold text-ink-900">
                      {stage.count.toLocaleString()}
                    </div>
                    {stage.uniqueCount !== undefined && stage.uniqueCount !== stage.count && (
                      <div className="text-3xs text-ink-500">
                        Unique: {stage.uniqueCount.toLocaleString()}
                      </div>
                    )}
                    {idx > 0 && (
                      <div className="text-3xs text-brand-600 font-semibold">
                        {stage.conversionRateFromPrev}% from Step {idx}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Funnel Notes Disclaimer */}
            <div className="p-3 rounded-lg bg-ink-50 border border-ink-100 text-3xs text-ink-500 space-y-1">
              <div className="font-semibold text-ink-700 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-brand-600" />
                <span>Important Measurement Notes:</span>
              </div>
              <ul className="list-disc pl-4 space-y-0.5 text-ink-500">
                {funnelData.notes?.map((n, i) => (
                  <li key={i}>{n}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <EmptyState compact icon={TrendingUp} title="No funnel events recorded for this range" />
        )}
      </Card>

      {/* Event Timeline Time-Series Chart (Section 5) */}
      <Card className="p-5 border border-ink-100 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-ink-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-ink-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-brand-600" />
              <span>Event Activity Timeline</span>
            </h3>
            <p className="text-2xs text-ink-500">
              Interactive hourly or daily time-series of scans, Instagram taps, registrations, and gallery views.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-2xs font-semibold text-ink-500">Interval:</span>
            <Select
              value={timelineInterval}
              onChange={(e) => setTimelineInterval(e.target.value)}
              options={[
                { value: 'auto', label: 'Auto' },
                { value: 'daily', label: 'Daily' },
                { value: 'hourly', label: 'Hourly' },
              ]}
              className="w-28 text-xs"
            />
          </div>
        </div>

        {timelineData.length > 0 ? (
          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="fillVisits" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.visits} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={CHART_COLORS.visits} stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="fillInstagram" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.instagram} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={CHART_COLORS.instagram} stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="fillGalleries" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.galleries} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={CHART_COLORS.galleries} stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
                <XAxis
                  dataKey="bucket"
                  tick={{ fontSize: 11, fill: CHART_COLORS.axis }}
                  tickFormatter={(val) => {
                    if (val.includes('T')) return val.split('T')[1]?.slice(0, 5) || val;
                    return val.slice(5); // MM-DD
                  }}
                />
                <YAxis tick={{ fontSize: 11, fill: CHART_COLORS.axis }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: 11, paddingTop: 10 }}
                  iconType="circle"
                  iconSize={8}
                />
                <Area
                  type="monotone"
                  dataKey="visits"
                  name="Page Visits"
                  stroke={CHART_COLORS.visits}
                  fill="url(#fillVisits)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="instagramClicks"
                  name="Instagram Clicks"
                  stroke={CHART_COLORS.instagram}
                  fill="url(#fillInstagram)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="continueClicks"
                  name="Continue Clicks"
                  stroke={CHART_COLORS.confirmations}
                  fill="none"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="registrations"
                  name="Contact Registrations"
                  stroke={CHART_COLORS.registrations}
                  fill="none"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="galleryClicks"
                  name="Gallery Clicks"
                  stroke={CHART_COLORS.galleries}
                  fill="url(#fillGalleries)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyState compact icon={BarChart3} title="No activity recorded in this date range" />
        )}
      </Card>

      {/* Two-Column Grid: Instagram & Gallery Analytics (Sections 6 & 8) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Instagram Conversion Metrics Card */}
        <Card className="p-5 border border-ink-100 shadow-sm space-y-4">
          <div className="border-b border-ink-100 pb-3">
            <h3 className="text-base font-bold text-ink-900 flex items-center gap-2">
              <Instagram className="w-4 h-4 text-rose-600" />
              <span>Instagram Conversion & Honesty Audit</span>
            </h3>
            <p className="text-2xs text-ink-500">
              Clear distinction between external profile clicks and Continue button progression.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="p-3.5 rounded-xl bg-ink-50 border border-ink-100 space-y-1">
              <span className="text-3xs uppercase font-bold text-ink-400">Instagram Button Clicks</span>
              <div className="text-xl font-bold text-ink-900">
                {(metrics.instagramClicks || 0).toLocaleString()}
              </div>
              <span className="text-2xs text-ink-500">
                {metrics.totalVisits > 0 ? ((metrics.instagramClicks / metrics.totalVisits) * 100).toFixed(1) : 0}% tap-through
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-ink-50 border border-ink-100 space-y-1">
              <span className="text-3xs uppercase font-bold text-ink-400">Continue-Button Clicks</span>
              <div className="text-xl font-bold text-ink-900">
                {(metrics.continueClicks || metrics.confirmations || 0).toLocaleString()}
              </div>
              <span className="text-2xs text-ink-500">
                {metrics.instagramClicks > 0 ? (((metrics.continueClicks || metrics.confirmations || 0) / metrics.instagramClicks) * 100).toFixed(1) : 0}% proceed to photos
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/80 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
              <ShieldAlert className="w-4 h-4 text-amber-700" />
              <span>Follower Verification Notice</span>
            </div>
            <p className="text-2xs text-amber-800 leading-relaxed">
              Instagram profile taps and Continue button clicks do not guarantee that a user followed the account on Instagram. Actual follow verification is not available without private Instagram API permissions. Metrics reflect genuine guest navigation intent.
            </p>
          </div>
        </Card>

        {/* Gallery Clicks Breakdown (Section 8) */}
        <Card className="p-5 border border-ink-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-ink-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-ink-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-600" />
                <span>Gallery Album Engagement</span>
              </h3>
              <p className="text-2xs text-ink-500">
                Clicks per external album card (Wedding, Haldi, Mehndi, etc.)
              </p>
            </div>
            {galleryData?.mostClickedGallery && (
              <Badge variant="brand" className="text-3xs">
                Top: {galleryData.mostClickedGallery}
              </Badge>
            )}
          </div>

          {galleryData?.galleries?.length > 0 ? (
            <div className="space-y-3 pt-1">
              {galleryData.galleries.map((gal) => (
                <div
                  key={gal.galleryId || gal.galleryTitle}
                  className="p-3 rounded-xl bg-ink-50 border border-ink-100 flex items-center justify-between"
                >
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-ink-900">
                      {gal.galleryTitle}
                    </div>
                    <div className="text-3xs text-ink-500">
                      {gal.uniqueSessions || 0} unique visitor sessions
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-purple-700">
                      {gal.totalClicks} clicks
                    </div>
                    <div className="text-3xs text-ink-400">
                      {gal.sharePercent}% of total
                    </div>
                  </div>
                </div>
              ))}
              <p className="text-3xs text-ink-400 italic">
                * Note: Photo downloads and high-res views are hosted securely on your client cloud gallery.
              </p>
            </div>
          ) : (
            <EmptyState compact icon={ImageIcon} title="No gallery clicks recorded yet" />
          )}
        </Card>
      </div>

      {/* Notification Channel Analytics (Section 9) */}
      <Card className="p-5 border border-ink-100 shadow-sm space-y-5">
        <div className="border-b border-ink-100 pb-3">
          <h3 className="text-base font-bold text-ink-900 flex items-center gap-2">
            <Send className="w-4 h-4 text-brand-600" />
            <span>Notification Delivery & Recipient Audit</span>
          </h3>
          <p className="text-2xs text-ink-500">
            Real dispatch audit stats distinguishing unique recipients from message delivery attempts and retries.
          </p>
        </div>

        {/* Audit Clarification Cards: Unique Recipients vs Delivery Attempts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Unique Recipients Group */}
          <div className="p-4 rounded-xl border border-ink-100 bg-emerald-50/20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-ink-800 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-600" />
                <span>Unique Registered Recipients</span>
              </span>
              <Badge variant="outline" className="text-3xs text-emerald-700 bg-white border-emerald-200">
                {notificationData?.recipients?.recipientSuccessRate || 0}% Notified
              </Badge>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="p-2 rounded bg-white border border-ink-100">
                <div className="text-3xs text-ink-400 uppercase font-semibold">Eligible</div>
                <div className="text-base font-bold text-ink-800">
                  {notificationData?.recipients?.totalContacts || 0}
                </div>
              </div>
              <div className="p-2 rounded bg-white border border-ink-100">
                <div className="text-3xs text-emerald-600 uppercase font-semibold">Notified</div>
                <div className="text-base font-bold text-emerald-700">
                  {notificationData?.recipients?.notifiedRecipients || 0}
                </div>
              </div>
              <div className="p-2 rounded bg-white border border-ink-100">
                <div className="text-3xs text-rose-600 uppercase font-semibold">Failed</div>
                <div className="text-base font-bold text-rose-700">
                  {notificationData?.recipients?.failedRecipients || 0}
                </div>
              </div>
              <div className="p-2 rounded bg-white border border-ink-100">
                <div className="text-3xs text-amber-600 uppercase font-semibold">Pending</div>
                <div className="text-base font-bold text-amber-700">
                  {notificationData?.recipients?.pendingRecipients || 0}
                </div>
              </div>
            </div>
          </div>

          {/* Message Delivery Attempts Group */}
          <div className="p-4 rounded-xl border border-ink-100 bg-indigo-50/20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-ink-800 flex items-center gap-1.5">
                <Send className="w-4 h-4 text-indigo-600" />
                <span>Message Dispatch Attempts (Audit)</span>
              </span>
              <Badge variant="outline" className="text-3xs text-indigo-700 bg-white border-indigo-200">
                {notificationData?.dispatchAttempts?.attemptSuccessRate || 0}% Succeeded
              </Badge>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="p-2 rounded bg-white border border-ink-100">
                <div className="text-3xs text-ink-400 uppercase font-semibold">Batches</div>
                <div className="text-base font-bold text-ink-800">
                  {notificationData?.dispatchAttempts?.totalBatches || 0}
                </div>
              </div>
              <div className="p-2 rounded bg-white border border-ink-100">
                <div className="text-3xs text-ink-400 uppercase font-semibold">Attempts</div>
                <div className="text-base font-bold text-ink-800">
                  {notificationData?.dispatchAttempts?.totalAttempts || 0}
                </div>
              </div>
              <div className="p-2 rounded bg-white border border-ink-100">
                <div className="text-3xs text-emerald-600 uppercase font-semibold">Accepted</div>
                <div className="text-base font-bold text-emerald-700">
                  {notificationData?.dispatchAttempts?.acceptedAttempts || 0}
                </div>
              </div>
              <div className="p-2 rounded bg-white border border-ink-100">
                <div className="text-3xs text-rose-600 uppercase font-semibold">Failed Att.</div>
                <div className="text-base font-bold text-rose-700">
                  {notificationData?.dispatchAttempts?.failedAttempts || 0}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Audit explanation note */}
        <div className="p-3 rounded-lg bg-ink-50 border border-ink-100 text-3xs text-ink-600 flex items-start gap-2">
          <Info className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            {notificationData?.explanation ||
              'Recipients represent unique registered guests. Delivery attempts represent individual message dispatch executions across batches. A single recipient retried 3 times generates 3 failed attempts without representing 3 failed recipients.'}
          </p>
        </div>

        {/* Channel Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Email Channel */}
          <div className="p-4 rounded-xl border border-ink-100 bg-ink-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-xs text-ink-800">
                <Mail className="w-4 h-4 text-indigo-600" />
                <span>Email Notifications</span>
              </div>
              <Badge variant="outline" className="text-3xs">
                {notificationData?.channels?.email?.successRate || 0}% Attempts OK
              </Badge>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="p-2 rounded bg-white border border-ink-100">
                <div className="text-3xs text-ink-400 uppercase font-semibold">Eligible</div>
                <div className="text-base font-bold text-ink-800">
                  {notificationData?.channels?.email?.eligibleRecipients || 0}
                </div>
              </div>
              <div className="p-2 rounded bg-white border border-ink-100">
                <div className="text-3xs text-emerald-600 uppercase font-semibold">Notified</div>
                <div className="text-base font-bold text-emerald-700">
                  {notificationData?.channels?.email?.notifiedRecipients || 0}
                </div>
              </div>
              <div className="p-2 rounded bg-white border border-ink-100">
                <div className="text-3xs text-ink-400 uppercase font-semibold">Attempts</div>
                <div className="text-base font-bold text-ink-800">
                  {notificationData?.channels?.email?.totalDeliveryAttempts || 0}
                </div>
              </div>
              <div className="p-2 rounded bg-white border border-ink-100">
                <div className="text-3xs text-rose-600 uppercase font-semibold">Failed Att.</div>
                <div className="text-base font-bold text-rose-700">
                  {notificationData?.channels?.email?.failedAttempts || 0}
                </div>
              </div>
            </div>

            <p className="text-3xs text-ink-400">
              {notificationData?.channels?.email?.providerNote}
            </p>
          </div>

          {/* WhatsApp Channel */}
          <div className="p-4 rounded-xl border border-ink-100 bg-ink-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-xs text-ink-800">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                <span>WhatsApp Notifications</span>
              </div>
              <Badge variant="outline" className="text-3xs">
                {notificationData?.channels?.whatsapp?.successRate || 0}% Attempts OK
              </Badge>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="p-2 rounded bg-white border border-ink-100">
                <div className="text-3xs text-ink-400 uppercase font-semibold">Eligible</div>
                <div className="text-base font-bold text-ink-800">
                  {notificationData?.channels?.whatsapp?.eligibleRecipients || 0}
                </div>
              </div>
              <div className="p-2 rounded bg-white border border-ink-100">
                <div className="text-3xs text-emerald-600 uppercase font-semibold">Notified</div>
                <div className="text-base font-bold text-emerald-700">
                  {notificationData?.channels?.whatsapp?.notifiedRecipients || 0}
                </div>
              </div>
              <div className="p-2 rounded bg-white border border-ink-100">
                <div className="text-3xs text-ink-400 uppercase font-semibold">Attempts</div>
                <div className="text-base font-bold text-ink-800">
                  {notificationData?.channels?.whatsapp?.totalDeliveryAttempts || 0}
                </div>
              </div>
              <div className="p-2 rounded bg-white border border-ink-100">
                <div className="text-3xs text-rose-600 uppercase font-semibold">Failed Att.</div>
                <div className="text-base font-bold text-rose-700">
                  {notificationData?.channels?.whatsapp?.failedAttempts || 0}
                </div>
              </div>
            </div>

            <p className="text-3xs text-ink-400">
              {notificationData?.channels?.whatsapp?.providerNote}
            </p>
          </div>
        </div>
      </Card>

      {/* Event-Level Comparison Table (Section 10) */}
      <Card className="p-5 border border-ink-100 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-ink-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-ink-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-brand-600" />
              <span>Event & Cycle Historical Comparison</span>
            </h3>
            <p className="text-2xs text-ink-500">
              Archived and active event cycles are isolated so reused common QR projects never mix analytics.
            </p>
          </div>
          <span className="text-2xs text-ink-400">
            {comparisonData.length} cycle records
          </span>
        </div>

        {comparisonData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-ink-100 text-ink-400 font-semibold uppercase text-3xs tracking-wider">
                  <th className="py-2.5 px-3">Project & Slug</th>
                  <th className="py-2.5 px-3">Event Cycle</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Visits</th>
                  <th className="py-2.5 px-3 text-right">IG Clicks</th>
                  <th className="py-2.5 px-3 text-right">Continue Clicks</th>
                  <th className="py-2.5 px-3 text-right">Registered</th>
                  <th className="py-2.5 px-3 text-right">Conv %</th>
                  <th className="py-2.5 px-3 text-right">Gallery Clicks</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {comparisonData.map((row) => (
                  <tr key={`${row.projectId}_${row.eventCycle}`} className="hover:bg-ink-50/60 transition">
                    <td className="py-3 px-3">
                      <div className="font-bold text-ink-900">{row.name}</div>
                      <div className="text-3xs text-ink-400 font-mono">/photos/{row.slug}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-3xs font-semibold bg-brand-50 text-brand-800 border border-brand-200">
                        Cycle #{row.eventCycle}
                        {row.isCurrentCycle && ' (Active)'}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      {row.galleryStatus === 'ready' ? (
                        <span className="inline-flex items-center gap-1 text-3xs text-emerald-700 font-semibold">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Ready
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-3xs text-amber-700 font-semibold">
                          <Clock className="w-3 h-3 text-amber-600" /> Preparing
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right font-semibold text-ink-800">
                      {row.visits.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right text-ink-600">
                      {row.instagramClicks.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right text-ink-600">
                      {(row.continueClicks || row.confirmations || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right font-semibold text-emerald-700">
                      {row.registrations.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right font-semibold text-brand-700">
                      {row.registrationRate}%
                    </td>
                    <td className="py-3 px-3 text-right font-semibold text-purple-700">
                      {row.galleryClicks.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={() => {
                          handleProjectChange(row.projectId);
                          handleCycleChange(String(row.eventCycle));
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                      >
                        Filter
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState compact icon={Layers} title="No project cycles found" />
        )}
      </Card>
    </div>
  );
};

export default WeddingQrAnalytics;

