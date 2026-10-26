import { useEffect, useState } from 'react';
import { BarChart3, Package as PackageIcon, Users } from 'lucide-react';

import {
  Card,
  CardHeader,
  CardSkeleton,
  CardTitle,
  FormError,
  PageHeader,
  SegmentedControl,
} from '@/components/ui';
import { ChartCard, InvoicedVsCollectedChart, RankedBarChart } from '@/components/charts/Charts';
import { reportApi } from '@/api/reportApi';
import { parseApiError } from '@/api/axios';
import { formatCurrency, formatNumber, truncate } from '@/utils/format';

const RANGE_OPTIONS = [
  { value: 6, label: '6 months' },
  { value: 12, label: '12 months' },
  { value: 24, label: '24 months' },
];

/**
 * A table view of the same numbers as the charts, so identity is never carried
 * by colour alone and the figures stay readable to a screen reader.
 */
const DataTableView = ({ columns, rows, emptyText }) => {
  if (!rows.length) {
    return <p className="px-6 py-8 text-center text-sm text-ink-500">{emptyText}</p>;
  }

  return (
    <div className="scrollbar-slim overflow-x-auto">
      <table className="w-full border-collapse text-base">
        <thead>
          <tr className="border-b border-ink-200/70 bg-ink-50/60">
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={`px-5 py-2.5 text-2xs font-semibold uppercase tracking-wider text-ink-500 ${
                  column.align === 'right' ? 'text-right' : 'text-left'
                }`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-200/60">
          {rows.map((row, index) => (
            <tr key={row._id ?? index}>
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={`px-5 py-2.5 ${
                    column.align === 'right' ? 'text-right tabular text-ink-900' : 'text-ink-700'
                  }`}
                >
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export const Reports = () => {
  const [months, setMonths] = useState(12);
  const [revenue, setRevenue] = useState(null);
  const [clients, setClients] = useState(null);
  const [packages, setPackages] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    Promise.all([reportApi.revenue(months), reportApi.clients(), reportApi.packages()])
      .then(([revenueResult, clientResult, packageResult]) => {
        if (cancelled) return;
        setRevenue(revenueResult.series ?? []);
        setClients(clientResult.clients ?? []);
        setPackages(packageResult.packages ?? []);
      })
      .catch((caught) => {
        if (!cancelled) setError(parseApiError(caught).message);
      });

    return () => {
      cancelled = true;
    };
  }, [months]);

  const loading = !revenue && !error;

  const topClients = (clients ?? []).map((client) => ({
    ...client,
    label: truncate(client.name ?? 'Unknown', 18),
  }));

  const topPackages = (packages ?? []).map((pkg) => ({
    ...pkg,
    label: truncate(pkg.name ?? 'Unknown', 18),
  }));

  return (
    <>
      <PageHeader
        title="Reports"
        description="How the studio is actually performing — invoiced, collected and by whom."
        actions={
          <SegmentedControl options={RANGE_OPTIONS} value={months} onChange={setMonths} />
        }
      />

      <FormError error={error} className="mb-6" />

      <div className="space-y-6">
        {loading ? (
          <CardSkeleton className="h-96" />
        ) : (
          <ChartCard
            title="Invoiced vs collected"
            description="What you billed against what actually arrived. Both in rupees, on one axis."
            height={320}
            isEmpty={!revenue?.some((point) => point.invoiced > 0 || point.collected > 0)}
            emptyIcon={BarChart3}
            emptyText="No billing activity in this period"
          >
            <InvoicedVsCollectedChart data={revenue ?? []} />
          </ChartCard>
        )}

        <div className="grid gap-6 xl:grid-cols-2">
          {loading ? (
            <>
              <CardSkeleton className="h-80" />
              <CardSkeleton className="h-80" />
            </>
          ) : (
            <>
              <ChartCard
                title="Top clients by revenue"
                description="Lifetime invoiced value."
                height={300}
                isEmpty={topClients.length === 0}
                emptyIcon={Users}
                emptyText="No invoiced clients yet"
              >
                <RankedBarChart data={topClients} dataKey="invoiced" nameKey="label" />
              </ChartCard>

              <ChartCard
                title="Best-selling packages"
                description="Revenue attributed to each package."
                height={300}
                isEmpty={topPackages.length === 0}
                emptyIcon={PackageIcon}
                emptyText="No packages sold yet"
              >
                <RankedBarChart data={topPackages} dataKey="revenue" nameKey="label" />
              </ChartCard>
            </>
          )}
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle className="text-md">Client ledger</CardTitle>
            </CardHeader>
            <DataTableView
              emptyText="No client billing yet."
              rows={clients ?? []}
              columns={[
                { key: 'name', header: 'Client', render: (row) => row.name ?? '—' },
                {
                  key: 'invoiced',
                  header: 'Invoiced',
                  align: 'right',
                  render: (row) => formatCurrency(row.invoiced),
                },
                {
                  key: 'collected',
                  header: 'Collected',
                  align: 'right',
                  render: (row) => formatCurrency(row.collected),
                },
                {
                  key: 'outstanding',
                  header: 'Outstanding',
                  align: 'right',
                  render: (row) => (
                    <span className={row.outstanding > 0 ? 'text-warning-700' : undefined}>
                      {formatCurrency(row.outstanding)}
                    </span>
                  ),
                },
              ]}
            />
          </Card>

          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle className="text-md">Package performance</CardTitle>
            </CardHeader>
            <DataTableView
              emptyText="No packages sold yet."
              rows={packages ?? []}
              columns={[
                { key: 'name', header: 'Package', render: (row) => row.name ?? '—' },
                {
                  key: 'timesSold',
                  header: 'Sold',
                  align: 'right',
                  render: (row) => formatNumber(row.timesSold),
                },
                {
                  key: 'revenue',
                  header: 'Revenue',
                  align: 'right',
                  render: (row) => formatCurrency(row.revenue),
                },
              ]}
            />
          </Card>
        </div>
      </div>
    </>
  );
};

export default Reports;
