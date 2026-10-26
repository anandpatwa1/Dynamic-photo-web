import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Card, CardHeader, CardTitle, CardDescription, EmptyState } from '@/components/ui';
import { SERIES, SEQUENTIAL, axisProps, gridProps, tooltipProps, CHART_INK } from './chartTheme';
import { formatCompactCurrency, formatCurrency } from '@/utils/format';
import { cn } from '@/utils/cn';

/**
 * Shared frame: title, optional description, and a fixed-height plot area.
 *
 * `ResponsiveContainer` injects `width`/`height` by cloning its single child,
 * so every chart below spreads those props onto the recharts element — without
 * that, the chart mounts at zero size and renders no SVG at all.
 */
export const ChartCard = ({ title, description, action, height = 300, isEmpty, emptyIcon, emptyText, children, className }) => (
  <Card className={cn('overflow-hidden', className)}>
    <CardHeader bordered={false} className="pb-2">
      <div className="min-w-0">
        <CardTitle className="text-md">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </div>
      {action}
    </CardHeader>

    {isEmpty ? (
      <EmptyState compact icon={emptyIcon} title={emptyText ?? 'Nothing to chart yet'} />
    ) : (
      <div style={{ height }} className="px-2 pb-4 pr-4">
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    )}
  </Card>
);

const currencyTick = (value) => formatCompactCurrency(value).replace('₹', '₹');

/**
 * Collections over time — one series, so the title carries identity and no
 * legend is needed. Area (not bars) because the job is trend, not comparison.
 */
export const RevenueTrendChart = ({ data = [], ...responsive }) => (
  <AreaChart {...responsive} data={data} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
    <defs>
      <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={SEQUENTIAL} stopOpacity={0.22} />
        <stop offset="100%" stopColor={SEQUENTIAL} stopOpacity={0.01} />
      </linearGradient>
    </defs>
    <CartesianGrid {...gridProps} />
    <XAxis dataKey="month" {...axisProps} />
    <YAxis {...axisProps} tickFormatter={currencyTick} width={56} />
    <Tooltip
      {...tooltipProps}
      formatter={(value) => [formatCurrency(value), 'Collected']}
      cursor={{ stroke: CHART_INK.axis, strokeWidth: 1 }}
    />
    <Area
      // Linear, not a spline: monthly totals are discrete buckets, and a curved
      // interpolation bulges between points — implying amounts that never existed.
      type="linear"
      dataKey="total"
      stroke={SEQUENTIAL}
      strokeWidth={2}
      fill="url(#revenueFill)"
      dot={false}
      activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff' }}
    />
  </AreaChart>
);

/**
 * Invoiced vs collected — two series, so a legend is always present and the
 * colours come from the validated categorical pair in fixed order.
 * Both measures are rupees, so they share one axis (never a dual axis).
 */
export const InvoicedVsCollectedChart = ({ data = [], ...responsive }) => (
  <BarChart {...responsive} data={data} margin={{ top: 8, right: 8, left: 4, bottom: 0 }} barGap={2}>
    <CartesianGrid {...gridProps} />
    <XAxis dataKey="label" {...axisProps} />
    <YAxis {...axisProps} tickFormatter={currencyTick} width={56} />
    <Tooltip {...tooltipProps} formatter={(value, name) => [formatCurrency(value), name]} />
    <Legend
      iconType="circle"
      iconSize={8}
      wrapperStyle={{ fontSize: 12, color: CHART_INK.label, paddingTop: 8 }}
    />
    <Bar dataKey="invoiced" name="Invoiced" fill={SERIES[0]} radius={[4, 4, 0, 0]} maxBarSize={22} />
    <Bar dataKey="collected" name="Collected" fill={SERIES[1]} radius={[4, 4, 0, 0]} maxBarSize={22} />
  </BarChart>
);

/**
 * Ranked magnitude — a horizontal bar chart in one hue. Long client names need
 * the horizontal orientation; a single series needs no legend.
 */
export const RankedBarChart = ({
  data = [],
  dataKey = 'value',
  nameKey = 'name',
  formatter = formatCurrency,
  ...responsive
}) => (
  <BarChart {...responsive} data={data} layout="vertical" margin={{ top: 4, right: 16, left: 4, bottom: 0 }}>
    <CartesianGrid {...gridProps} horizontal={false} vertical />
    <XAxis type="number" {...axisProps} tickFormatter={currencyTick} />
    <YAxis
      type="category"
      dataKey={nameKey}
      {...axisProps}
      width={132}
      tick={{ fill: CHART_INK.label, fontSize: 11 }}
    />
    <Tooltip {...tooltipProps} formatter={(value) => [formatter(value), '']} />
    <Bar dataKey={dataKey} radius={[0, 4, 4, 0]} maxBarSize={18}>
      {data.map((entry, index) => (
        // A single-hue ramp: the leader is fullest, the tail recedes.
        <Cell
          key={entry[nameKey] ?? index}
          fill={SEQUENTIAL}
          fillOpacity={1 - Math.min(index * 0.09, 0.55)}
        />
      ))}
    </Bar>
  </BarChart>
);
