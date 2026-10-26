import { Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { T } from '../../constants/strings';

/** Three prices; cost hidden without viewCosting (the server ignores it then too). */
export const PriceFields = ({ value, onChange, perms, errors = {} }) => (
  <div className="grid gap-3 sm:grid-cols-3">
    <Input label={T.common.sellingPrice} prefix="₹" inputMode="numeric" value={value.sellingPrice ?? 0} error={errors.sellingPrice}
      onChange={(e) => onChange({ sellingPrice: e.target.value })} />
    {perms.viewCosting && (
      <Input label={T.common.costPrice} prefix="₹" inputMode="numeric" value={value.costPrice ?? 0} error={errors.costPrice}
        onChange={(e) => onChange({ costPrice: e.target.value })} />
    )}
    <Input label={T.common.mrpPrice} prefix="₹" inputMode="numeric" value={value.mrpPrice ?? 0} error={errors.mrpPrice}
      onChange={(e) => onChange({ mrpPrice: e.target.value })} />
  </div>
);

/** Ordered list of plain strings (item deliverable lines). */
export const StringListEditor = ({ label, hint, value = [], onChange, addLabel }) => {
  const set = (i, v) => onChange(value.map((x, j) => (j === i ? v : x)));
  const move = (i, d) => {
    const next = [...value];
    const t = i + d;
    if (t < 0 || t >= next.length) return;
    [next[i], next[t]] = [next[t], next[i]];
    onChange(next);
  };
  return (
    <div>
      <p className="text-sm font-medium text-ink-800">{label}</p>
      {hint && <p className="mb-2 text-xs text-ink-500">{hint}</p>}
      <div className="space-y-2">
        {value.map((line, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <Input value={line} onChange={(e) => set(i, e.target.value)} wrapperClassName="flex-1" aria-label={`${label} ${i + 1}`} />
            <Button size="sm" variant="ghost" iconOnly icon={ArrowUp} aria-label={T.common.moveUp} onClick={() => move(i, -1)} />
            <Button size="sm" variant="ghost" iconOnly icon={ArrowDown} aria-label={T.common.moveDown} onClick={() => move(i, 1)} />
            <Button size="sm" variant="ghost" iconOnly icon={Trash2} aria-label={T.common.remove} onClick={() => onChange(value.filter((_, j) => j !== i))} />
          </div>
        ))}
      </div>
      <Button size="sm" variant="subtle" icon={Plus} className="mt-2" onClick={() => onChange([...value, ''])}>{addLabel}</Button>
    </div>
  );
};

/** Maps server field errors [{field, message}] → { field: message }. */
export const errorsOf = (payload) =>
  Object.fromEntries((payload?.errors ?? []).map((e) => [String(e.field).split('.').slice(-1)[0], e.message]));
