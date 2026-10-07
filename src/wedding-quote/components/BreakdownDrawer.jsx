import { useEffect, useState } from 'react';
import { Copy, Printer } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, Modal, Spinner } from '@/components/ui';
import { wqQuoteApi } from '../api/wqApi';
import { formatINR } from '../utils/engine/money';
import { formatDate } from '../utils/engine/dates';
import { SIDE_LABEL } from '../utils/engine/display';
import { copyText } from '../utils/download';
import { T } from '../constants/strings';

const S = T.breakdown;

const breakdownText = (b, canCost) => {
  const col = (o) => [formatINR(o.selling), canCost ? formatINR(o.cost) : null, formatINR(o.mrp)].filter(Boolean).join(' | ');
  const lines = [`${S.title}`, ''];
  for (const day of b.days) {
    lines.push(`${formatDate(day.date, 'plain')}`);
    for (const e of day.entries) lines.push(`  ${Number(e.quantity) > 1 ? `${e.quantity} × ` : ''}${e.name}${SIDE_LABEL[e.side] ? ` (${SIDE_LABEL[e.side]})` : ''}: ${col(e)}`);
  }
  if (b.lines.length) {
    lines.push('', S.deliverables);
    for (const l of b.lines) lines.push(`  ${l.text}: ${col(l)}`);
  }
  if (b.addOn) lines.push('', `${S.addOn}: ${b.addOn.title}`);
  lines.push('', `${S.totals}: ${col(b.auto)}`, `${S.displayed}: ${formatINR(b.display.selling)} (MRP ${formatINR(b.display.mrp)})`);
  if (b.delta.selling || b.delta.mrp) lines.push(`${S.delta}: ${formatINR(b.delta.selling)} / MRP ${formatINR(b.delta.mrp)}`);
  if (canCost) lines.push(`${S.profit}: ${formatINR(b.profit)} · ${S.margin}: ${b.marginPct}%`);
  return lines.join('\n');
};

/** Price breakdown (A5) — a button outside the quote opens this. Costing columns only with viewCosting (server strips them otherwise). */
export const BreakdownDrawer = ({ quoteId, open, onClose, refreshKey }) => {
  const [state, setState] = useState({ loading: true, data: null, canCost: false });

  useEffect(() => {
    if (!open || !quoteId) return;
    setState((s) => ({ ...s, loading: true }));
    wqQuoteApi
      .breakdown(quoteId)
      .then((r) => setState({ loading: false, data: r.breakdown, canCost: r.canViewCosting }))
      .catch(() => setState({ loading: false, data: null, canCost: false }));
  }, [open, quoteId, refreshKey]);

  const { data: b, canCost, loading } = state;
  const cols = canCost ? ['selling', 'cost', 'mrp'] : ['selling', 'mrp'];
  const Row = ({ label, sub, o, strong }) => (
    <tr className={strong ? 'font-semibold text-ink-900' : 'text-ink-700'}>
      <td className="py-1.5 pr-3">{label}</td>
      <td className="py-1.5 pr-3 text-ink-500">{sub}</td>
      {cols.map((c) => <td key={c} className="tabular py-1.5 pl-3 text-right">{formatINR(o[c] ?? 0)}</td>)}
    </tr>
  );

  const print = () => {
    const w = window.open('', '_blank', 'width=700,height=900');
    if (!w) return;
    w.document.write(`<pre style="font:14px/1.5 monospace;padding:24px">${breakdownText(b, canCost).replace(/</g, '&lt;')}</pre>`);
    w.document.close();
    w.print();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      title={S.title}
      footer={
        b && (
          <>
            <Button variant="secondary" icon={Copy} onClick={async () => (await copyText(breakdownText(b, canCost))) && toast.success(T.common.copied)}>{S.copy}</Button>
            <Button variant="secondary" icon={Printer} onClick={print}>{S.print}</Button>
          </>
        )
      }
    >
      {loading ? (
        <div className="flex justify-center py-10"><Spinner /></div>
      ) : !b ? (
        <p className="text-ink-500">—</p>
      ) : (
        <div className="space-y-5 overflow-x-auto">
          {!canCost && <p className="rounded-lg bg-ink-50 px-3 py-2 text-sm text-ink-500">{S.costHidden}</p>}
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b border-ink-200 text-left text-xs uppercase tracking-wide text-ink-400">
                <th className="py-2 pr-3">{S.item}</th>
                <th className="py-2 pr-3">{S.side}</th>
                {cols.map((c) => <th key={c} className="py-2 pl-3 text-right">{S[c]}</th>)}
              </tr>
            </thead>
            <tbody>
              {b.days.map((day) => (
                <FragmentRows key={day.dayId} day={day} Row={Row} />
              ))}
              {b.lines.length > 0 && (
                <tr><td colSpan={cols.length + 2} className="pt-4 text-xs font-semibold uppercase tracking-wide text-ink-400">{S.deliverables}</td></tr>
              )}
              {b.lines.map((l) => <Row key={l.lineId} label={l.text} sub={l.isAuto ? T.wizard.autoLine : ''} o={l} />)}
              {b.addOn && (
                <tr><td colSpan={cols.length + 2} className="pt-3 text-xs text-ink-500">{S.addOn}: {b.addOn.title}</td></tr>
              )}
              <tr><td colSpan={cols.length + 2} className="border-t border-ink-200" /></tr>
              <Row label={S.totals} o={b.auto} strong />
            </tbody>
          </table>
          <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label={S.displayed} value={formatINR(b.display.selling)} hint={`MRP ${formatINR(b.display.mrp)}`} />
            <Stat label={S.delta} value={formatINR(b.delta.selling)} hint={`MRP ${formatINR(b.delta.mrp)}`} />
            {canCost && <Stat label={S.profit} value={formatINR(b.profit)} />}
            {canCost && <Stat label={S.margin} value={`${b.marginPct}%`} />}
          </dl>
        </div>
      )}
    </Modal>
  );
};

const FragmentRows = ({ day, Row }) => (
  <>
    <tr><td colSpan={5} className="pt-3 text-xs font-semibold uppercase tracking-wide text-brand-700">{formatDate(day.date, 'plain')}</td></tr>
    {day.entries.map((e) => <Row key={e.entryId} label={`${Number(e.quantity) > 1 ? `${e.quantity} × ` : ''}${e.name}`} sub={SIDE_LABEL[e.side] ?? ''} o={e} />)}
    <Row label="" sub={T.wizard.subtotal} o={day.subtotal} />
  </>
);

const Stat = ({ label, value, hint }) => (
  <div className="rounded-xl bg-ink-50 px-4 py-3">
    <dt className="text-xs text-ink-500">{label}</dt>
    <dd className="tabular text-lg font-semibold text-ink-900">{value}</dd>
    {hint && <dd className="text-xs text-ink-400">{hint}</dd>}
  </div>
);
