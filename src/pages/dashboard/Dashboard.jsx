import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CalendarClock,
  FileText,
  IndianRupee,
  Plus,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';

import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardSkeleton,
  CardTitle,
  EmptyState,
  FormError,
  PageHeader,
  StatCard,
  StatusBadge,
} from '@/components/ui';
import { ChartCard, RevenueTrendChart } from '@/components/charts/Charts';
import { reportApi } from '@/api/reportApi';
import { parseApiError } from '@/api/axios';
import { useAuth } from '@/hooks/useAuth';
import { DOCUMENT_STATUS_META, PROJECT_STATUS_META } from '@/constants';
import { formatCompactCurrency, formatCurrency, formatDate, formatRelative } from '@/utils/format';

/** Compact list row shared by the three activity panels. */
const ListRow = ({ to, title, subtitle, meta, badge }) => (
  <Link
    to={to}
    className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-ink-50"
  >
    <div className="min-w-0 flex-1">
      <p className="truncate text-base font-medium text-ink-900">{title}</p>
      <p className="truncate text-sm text-ink-500">{subtitle}</p>
    </div>
    <div className="shrink-0 text-right">
      {meta && <p className="tabular text-sm font-medium text-ink-900">{meta}</p>}
      {badge}
    </div>
  </Link>
);

export const Dashboard = () => {
  const { user, canManage } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    reportApi
      .dashboard()
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((caught) => {
        if (!cancelled) setError(parseApiError(caught).message);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const loading = !data && !error;
  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <>
      <PageHeader
        title={`${greeting}, ${user?.name?.split(' ')[0] ?? 'there'}`}
        description="Here's where the studio stands today."
        actions={
          canManage && (
            <Button as={Link} to="/CRM/documents/new?type=quotation" icon={Plus}>
              New quotation
            </Button>
          )
        }
      />

      <FormError error={error} className="mb-6" />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Collected this month"
          value={formatCompactCurrency(data?.revenue?.thisMonth ?? 0)}
          icon={Wallet}
          accent="success"
          delta={data ? data.revenue.change : null}
          loading={loading}
        />
        <StatCard
          label="Outstanding"
          value={formatCompactCurrency(data?.receivables?.outstanding ?? 0)}
          hint="Across all live invoices"
          icon={IndianRupee}
          accent="warning"
          loading={loading}
        />
        <StatCard
          label="Total invoiced"
          value={formatCompactCurrency(data?.receivables?.invoiced ?? 0)}
          hint="Lifetime"
          icon={FileText}
          loading={loading}
        />
        <StatCard
          label="Active clients"
          value={data?.clients?.active ?? 0}
          hint={`${data?.clients?.lead ?? 0} open leads`}
          icon={Users}
          accent="info"
          loading={loading}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {loading ? (
            <CardSkeleton className="h-80" />
          ) : (
            <ChartCard
              title="Collections over the last 12 months"
              description="Payments actually received, month by month."
              height={300}
              isEmpty={!data?.trend?.some((point) => point.total > 0)}
              emptyIcon={TrendingUp}
              emptyText="No payments recorded yet"
            >
              <RevenueTrendChart data={data?.trend ?? []} />
            </ChartCard>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-md">Upcoming shoots</CardTitle>
            <Link to="/CRM/projects" className="text-sm font-medium text-brand-600 hover:text-brand-700">
              All projects
            </Link>
          </CardHeader>
          <CardBody className="p-2">
            {loading ? (
              <div className="space-y-2 p-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="skeleton h-12 rounded-xl" />
                ))}
              </div>
            ) : data?.upcomingShoots?.length ? (
              data.upcomingShoots.map((project) => (
                <ListRow
                  key={project._id}
                  to="/CRM/projects"
                  title={project.title}
                  subtitle={
                    project.location
                      ? `${project.client?.name ?? ''} · ${project.location}`
                      : (project.client?.name ?? '')
                  }
                  meta={formatDate(project.shootDate, 'dd MMM')}
                  badge={
                    <StatusBadge status={project.status} meta={PROJECT_STATUS_META} size="sm" />
                  }
                />
              ))
            ) : (
              <EmptyState
                compact
                icon={CalendarClock}
                title="No shoots scheduled"
                description="Projects with a future shoot date will appear here."
              />
            )}
          </CardBody>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-md">Recent documents</CardTitle>
            <Link
              to="/CRM/documents"
              className="flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              View all
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </CardHeader>
          <CardBody className="p-2">
            {loading ? (
              <div className="space-y-2 p-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="skeleton h-12 rounded-xl" />
                ))}
              </div>
            ) : data?.recentDocuments?.length ? (
              data.recentDocuments.map((document) => (
                <ListRow
                  key={document._id}
                  to={`/CRM/documents/${document._id}`}
                  title={document.number}
                  subtitle={`${document.clientSnapshot?.name ?? '—'} · ${formatRelative(document.date)}`}
                  meta={formatCurrency(document.total)}
                  badge={
                    <StatusBadge status={document.status} meta={DOCUMENT_STATUS_META} size="sm" />
                  }
                />
              ))
            ) : (
              <EmptyState
                compact
                icon={FileText}
                title="No documents yet"
                description="Your quotations and invoices will show up here."
              />
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-md">Needs attention</CardTitle>
            {data?.overdueInvoices?.length > 0 && (
              <Badge tone="danger">{data.overdueInvoices.length} overdue</Badge>
            )}
          </CardHeader>
          <CardBody className="p-2">
            {loading ? (
              <div className="space-y-2 p-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="skeleton h-12 rounded-xl" />
                ))}
              </div>
            ) : data?.overdueInvoices?.length ? (
              data.overdueInvoices.map((invoice) => (
                <ListRow
                  key={invoice._id}
                  to={`/CRM/documents/${invoice._id}`}
                  title={invoice.number}
                  subtitle={`${invoice.clientSnapshot?.name ?? '—'} · due ${formatDate(invoice.validUntil)}`}
                  meta={formatCurrency(invoice.balanceDue)}
                  badge={
                    <Badge tone="danger" size="sm">
                      Overdue
                    </Badge>
                  }
                />
              ))
            ) : (
              <EmptyState
                compact
                icon={Wallet}
                title="Nothing overdue"
                description="Every invoice is either paid or still within its terms."
              />
            )}
          </CardBody>
        </Card>
      </div>
    </>
  );
};

export default Dashboard;
