import { Plus, RotateCcw, Trash2 } from 'lucide-react';
import { Badge, Button, Input, Select, Switch, Textarea } from '@/components/ui';
import { buildPrintModel } from '../utils/engine/display';
import { formatINR } from '../utils/engine/money';
import { formatDate } from '../utils/engine/dates';
import * as ops from '../utils/quoteOps';
import { T } from '../constants/strings';

const E = T.editor;

const dateInputValue = (date) => date
  ? `${String(date.year).padStart(4, '0')}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`
  : '';

const dateFromInput = (value) => {
  const [year, month, day] = value.split('-').map(Number);
  return { day, month, year };
};

/** Overrides-aware text field: shows the effective value, writes through setText, offers reset. */
const OText = ({ quote, apply, path, label, auto, multiline }) => {
  const value = quote.textOverrides?.[path] ?? auto ?? '';
  const overridden = quote.textOverrides?.[path] !== undefined;
  const Comp = multiline ? Textarea : Input;
  return (
    <div className="flex items-end gap-1">
      <Comp label={label} rows={2} value={value} placeholder={E.empty} wrapperClassName="flex-1"
        onChange={(e) => apply((q) => ops.setText(q, path, e.target.value))} />
      {overridden && <Button size="sm" variant="ghost" iconOnly icon={RotateCcw} aria-label={T.common.reset} onClick={() => apply((q) => ops.resetText(q, path))} />}
    </div>
  );
};

const Section = ({ title, children }) => (
  <section className="space-y-3 border-b border-ink-100 pb-5">
    <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-400">{title}</h3>
    {children}
  </section>
);

/**
 * Every field in print order (package → dates → items → deliverables → add-on →
 * price → notes → footer), including empty ones. Edits go through the same
 * ops as canvas edits, so the two stay in sync both ways (A11).
 */
export const SidePanel = ({ quote, apply, studio, theme, addOns = [] }) => {
  const raw = buildPrintModel({ ...quote, textOverrides: {} }, { dateStyle: theme.definition.dateStyle, studio });
  const model = buildPrintModel(quote, { dateStyle: theme.definition.dateStyle, studio });
  const auto = quote.computed?.auto ?? quote.pricing?.auto ?? {};
  const override = quote.pricing?.override ?? {};

  return (
    <div className="space-y-5 text-sm">
      <Section title={E.fields.package}>
        <Input label={T.wizard.packageName} value={quote.packageSnapshot?.name ?? ''} onChange={(e) => apply((q) => ops.setField(q, 'packageSnapshot.name', e.target.value))} />
        <OText quote={quote} apply={apply} path="title" label="Title text on quote" auto={raw.title} />
        <OText quote={quote} apply={apply} path="subtitle" label={T.wizard.subtitle} auto={raw.subtitle} />
        <OText quote={quote} apply={apply} path="description" label={T.wizard.description} auto={raw.description} multiline />
        <Input label={T.wizard.label} value={quote.label ?? ''} onChange={(e) => apply((q) => ops.setField(q, 'label', e.target.value))} />
      </Section>

      <Section title={E.fields.dates}>
        <div className="space-y-2 rounded-xl bg-ink-50 p-2.5">
          {(quote.days ?? []).map((day, index) => (
            <Input key={day._id} label={`${E.actualDate} ${index + 1}`} type="date" value={dateInputValue(day.date)}
              onChange={(event) => event.target.value && apply((q) => ops.setDayDate(q, day._id, dateFromInput(event.target.value)))} />
          ))}
        </div>
        <Input label={T.wizard.printYear} hint={T.wizard.printYearHint} inputMode="numeric" value={quote.printYear ?? ''}
          onChange={(e) => apply((q) => ops.setField(q, 'printYear', e.target.value.replace(/\D/g, '').slice(0, 4) || null))} />
        <Switch label={E.groupDates} checked={Boolean(quote.layout?.options?.groupDates)} onChange={(e) => apply((q) => ops.setOption(q, 'groupDates', e.target.checked))} />
        <Switch label={E.caps} checked={quote.layout?.options?.caps !== false} onChange={(e) => apply((q) => ops.setOption(q, 'caps', e.target.checked))} />
        <Switch label={E.showSides} checked={quote.layout?.options?.showSides !== false} onChange={(e) => apply((q) => ops.setOption(q, 'showSides', e.target.checked))} />
        {model.dates.map((g, i) => (
          <OText key={g.key} quote={quote} apply={apply} path={g.labelPath} label={`${E.printedDate} ${i + 1}`} auto={raw.dates[i]?.label} />
        ))}
      </Section>

      <Section title={E.fields.items}>
        {model.dates.map((g, gi) => (
          <div key={g.key} className="space-y-2">
            <p className="font-medium text-ink-700">{g.label}</p>
            {g.lines.map((line, li) => (
              <OText key={line.path} quote={quote} apply={apply} path={line.path} label={`Line ${li + 1}`} auto={raw.dates[gi]?.lines[li]?.text} />
            ))}
            {quote.days.filter((d) => g.dayIds.includes(String(d._id))).flatMap((d) => d.entries).map((e) => (
              <div key={e._id} className="space-y-2 rounded-xl bg-ink-50 p-2.5">
                <div className="flex items-end gap-2">
                  <div className="min-w-0 flex-1 pb-2">
                    <p className="truncate font-medium text-ink-900"><span className="text-brand-700">{e.quantity ?? 1} ×</span> {e.itemSnapshot?.name}</p>
                    <p className="text-xs text-ink-400">{e.side === 'none' ? T.sides.none : T.sides[e.side]}</p>
                  </div>
                  <Input label={T.wizard.quantity} aria-label={`${T.wizard.quantity}: ${e.itemSnapshot?.name}`} type="number" min="1" max="99" wrapperClassName="w-20 shrink-0" value={e.quantity ?? 1}
                    onChange={(ev) => apply((q) => ops.setEntryQuantity(q, e._id, ev.target.value))} />
                </div>
                <Input label={T.common.note} aria-label={`${T.common.note}: ${e.itemSnapshot?.name}`} value={e.note ?? ''} placeholder={E.empty}
                  onChange={(ev) => apply((q) => ops.setEntryNote(q, e._id, ev.target.value))} />
              </div>
            ))}
            {!g.lines.length && <p className="text-ink-400">{E.empty}</p>}
          </div>
        ))}
      </Section>

      <Section title={E.fields.deliverables}>
        <OText quote={quote} apply={apply} path="deliverablesHeading" label="Heading" auto={T.canvas.deliverablesHeading} />
        {(quote.deliverables?.lines ?? []).map((l) => (
          <div key={l._id} className="space-y-1.5 rounded-xl bg-ink-50 p-2.5">
            <div className="flex items-end gap-1">
              <Input label={l.isAuto ? `${T.wizard.autoLine} · Reels` : 'Line'} value={l.text ?? ''} wrapperClassName="flex-1"
                onChange={(e) => apply((q) => ops.setText(q, `deliverable.${l._id}`, e.target.value))}
                trailing={l.isAuto && l.isEdited ? <Badge size="sm" tone="warning">{T.wizard.edited}</Badge> : null} />
              {l.isAuto && l.isEdited && <Button size="sm" variant="ghost" icon={RotateCcw} onClick={() => apply((q) => ops.resetReels(q))}>{T.wizard.resetAuto}</Button>}
            </div>
            <Input aria-label={T.common.note} placeholder={T.common.note} value={l.note ?? ''} onChange={(e) => apply((q) => ops.setLineNote(q, l._id, e.target.value))} />
          </div>
        ))}
      </Section>

      <Section title={E.fields.addOn}>
        <Select value={quote.addOn?.snapshot?.addOnId ?? ''} placeholder={T.wizard.noAddOn} options={addOns.map((a) => ({ value: a._id, label: a.title }))}
          onChange={(e) => apply((q) => ops.setAddOnFromMaster(q, addOns.find((a) => a._id === e.target.value) ?? null))} />
        {quote.addOn?.snapshot && (
          <>
            {Number(quote.addOn.snapshot.priceAmount) > 0 && (
              <Switch label={T.addOns.includeInTotal}
                description={`${formatINR(quote.addOn.snapshot.priceAmount)} · ${quote.addOn.snapshot.includeInTotal ? T.addOns.includedInTotal : T.addOns.excludedFromTotal}`}
                checked={Boolean(quote.addOn.snapshot.includeInTotal)}
                onChange={(event) => apply((q) => ops.setAddOnIncluded(q, event.target.checked))} />
            )}
            <OText quote={quote} apply={apply} path="addOn.badge" label={T.addOns.badge} auto={quote.addOn.snapshot.badge} />
            <OText quote={quote} apply={apply} path="addOn.title" label={T.addOns.titleField} auto={quote.addOn.snapshot.title} />
            <OText quote={quote} apply={apply} path="addOn.text" label={T.addOns.text} auto={quote.addOn.snapshot.text} multiline />
            <OText quote={quote} apply={apply} path="addOn.price" label={T.addOns.printedPrice}
              auto={Number(quote.addOn.snapshot.priceAmount) > 0 ? `${quote.addOn.snapshot.includeInTotal ? '' : 'Extra '}${formatINR(quote.addOn.snapshot.priceAmount)}` : ''} />
          </>
        )}
      </Section>

      <Section title={E.fields.price}>
        {['selling', 'mrp'].map((key) => (
          <div key={key} className="flex items-end gap-1">
            <Input label={`${key === 'selling' ? T.common.sellingPrice : T.common.mrpPrice} — ${E.priceAuto} ${formatINR(auto[key] ?? 0)}`} prefix="₹" inputMode="numeric"
              placeholder={String(auto[key] ?? 0)} value={override[key] ?? ''} wrapperClassName="flex-1"
              onChange={(e) => apply((q) => ops.setPriceOverride(q, key, e.target.value.replace(/\D/g, '')))} />
            {override[key] !== null && override[key] !== undefined && (
              <Button size="sm" variant="ghost" iconOnly icon={RotateCcw} aria-label={T.common.reset} onClick={() => apply((q) => ops.setPriceOverride(q, key, null))} />
            )}
          </div>
        ))}
      </Section>

      <Section title={E.fields.notes}>
        {(quote.notes ?? []).map((n, i) => (
          <div key={i} className="flex items-center gap-1">
            <Input aria-label={`${T.common.note} ${i + 1}`} value={n} wrapperClassName="flex-1" onChange={(e) => apply((q) => ops.updateNote(q, i, e.target.value))} />
            <Button size="sm" variant="ghost" iconOnly icon={Trash2} aria-label={T.common.remove} onClick={() => apply((q) => ops.removeNote(q, i))} />
          </div>
        ))}
        <Button size="sm" variant="subtle" icon={Plus} onClick={() => apply((q) => ops.addNote(q, ''))}>{E.addNote}</Button>
        {model.notes.length > 0 && <p className="text-xs text-ink-400">On quote: {model.notes.join(' · ')}</p>}
      </Section>

      <Section title={E.fields.footer}>
        <OText quote={quote} apply={apply} path="footer" label={E.fields.footer} auto={raw.footer} />
      </Section>
      <p className="text-xs text-ink-400">{formatDate(quote.days?.[0]?.date ?? { day: 1, month: 1 }, 'short')} · {quote.days?.length ?? 0} dates</p>
    </div>
  );
};
