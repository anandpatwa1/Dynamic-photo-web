import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, Input, Modal, Select, Switch, Textarea } from '@/components/ui';
import { PriceFields, StringListEditor, errorsOf } from './formParts';
import { T } from '../../constants/strings';

const num = (v) => Math.max(0, Math.round(Number(String(v ?? 0).replace(/[₹,\s]/g, '')) || 0));

/** Shared modal shell + save handling for every master form. */
const useMasterSave = ({ crud, record, onSaved }) => {
  const dispatch = useDispatch();
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const save = async (payload) => {
    setSaving(true);
    setErrors({});
    const action = record ? crud.thunks.update({ id: record._id, payload }) : crud.thunks.create(payload);
    const result = await dispatch(action);
    setSaving(false);
    if (result.error) {
      setErrors(errorsOf(result.payload));
      toast.error(result.payload?.message ?? 'Could not save');
      return;
    }
    toast.success(T.common.saved);
    onSaved();
  };
  return { save, saving, errors };
};

const Shell = ({ title, onClose, onSave, saving, children, size = 'lg' }) => (
  <Modal open onClose={onClose} title={title} size={size}
    footer={<><Button variant="secondary" onClick={onClose}>{T.common.cancel}</Button><Button loading={saving} onClick={onSave}>{T.common.save}</Button></>}>
    <div className="space-y-4">{children}</div>
  </Modal>
);

// ---------------------------------------------------------------- Items
export const ItemForm = ({ record, perms, onClose, onSaved, crud }) => {
  const [v, setV] = useState(() => ({ name: '', sellingPrice: 0, costPrice: 0, mrpPrice: 0, deliverables: [], note: '', isActive: true, ...(record ?? {}) }));
  const { save, saving, errors } = useMasterSave({ crud, record, onSaved });
  const patch = (p) => setV((s) => ({ ...s, ...p }));
  const submit = () => {
    const payload = {
      name: v.name, sellingPrice: num(v.sellingPrice), mrpPrice: num(v.mrpPrice),
      deliverables: v.deliverables.map((d) => d.trim()).filter(Boolean), note: v.note ?? '', isActive: v.isActive !== false,
    };
    if (perms.viewCosting) payload.costPrice = num(v.costPrice);
    save(payload);
  };
  return (
    <Shell title={record ? T.common.edit : T.items.add} onClose={onClose} onSave={submit} saving={saving}>
      <Input label={T.common.name} required value={v.name} error={errors.name} onChange={(e) => patch({ name: e.target.value })} placeholder="Photo + Video" autoFocus />
      <PriceFields value={v} onChange={patch} perms={perms} errors={errors} />
      <StringListEditor label={T.items.deliverables} hint={T.items.deliverablesHint} value={v.deliverables} onChange={(deliverables) => patch({ deliverables })} addLabel={T.items.addLine} />
      <Textarea label={T.common.note} optional rows={2} value={v.note ?? ''} onChange={(e) => patch({ note: e.target.value })} />
      <Switch label={T.common.active} checked={v.isActive !== false} onChange={(e) => patch({ isActive: e.target.checked })} />
    </Shell>
  );
};

// ---------------------------------------------------------------- Deliverable sets
export const SetForm = ({ record, perms, onClose, onSaved, crud }) => {
  const [v, setV] = useState(() => ({ name: '', isDefault: false, lines: [], isActive: true, ...(record ?? {}) }));
  const { save, saving, errors } = useMasterSave({ crud, record, onSaved });
  const setLine = (i, p) => setV((s) => ({ ...s, lines: s.lines.map((l, j) => (j === i ? { ...l, ...p } : l)) }));
  const move = (i, d) => setV((s) => {
    const lines = [...s.lines];
    const t = i + d;
    if (t < 0 || t >= lines.length) return s;
    [lines[i], lines[t]] = [lines[t], lines[i]];
    return { ...s, lines };
  });
  const submit = () =>
    save({
      name: v.name,
      isDefault: Boolean(v.isDefault),
      isActive: v.isActive !== false,
      lines: v.lines.filter((l) => l.text?.trim()).map((l) => ({
        ...(l._id ? { _id: l._id } : {}), text: l.text.trim(), sellingPrice: num(l.sellingPrice), mrpPrice: num(l.mrpPrice), note: l.note ?? '',
        ...(perms.viewCosting ? { costPrice: num(l.costPrice) } : {}),
      })),
    });
  return (
    <Shell title={record ? T.common.edit : T.sets.add} onClose={onClose} onSave={submit} saving={saving} size="xl">
      <Input label={T.common.name} required value={v.name} error={errors.name} onChange={(e) => setV({ ...v, name: e.target.value })} autoFocus />
      <Switch label={T.sets.isDefault} description="Only one set can be the default; it is pre-selected in the wizard." checked={Boolean(v.isDefault)} onChange={(e) => setV({ ...v, isDefault: e.target.checked })} />
      <div>
        <p className="mb-2 text-sm font-medium text-ink-800">{T.sets.lines}</p>
        <div className="space-y-3">
          {v.lines.map((line, i) => (
            <div key={line._id ?? i} className="rounded-xl bg-ink-50 p-3">
              <div className="flex items-center gap-1.5">
                <Input value={line.text ?? ''} placeholder="2 Reels" onChange={(e) => setLine(i, { text: e.target.value })} wrapperClassName="flex-1" aria-label={`Line ${i + 1}`} />
                <Button size="sm" variant="ghost" iconOnly icon={ArrowUp} aria-label={T.common.moveUp} onClick={() => move(i, -1)} />
                <Button size="sm" variant="ghost" iconOnly icon={ArrowDown} aria-label={T.common.moveDown} onClick={() => move(i, 1)} />
                <Button size="sm" variant="ghost" iconOnly icon={Trash2} aria-label={T.common.remove} onClick={() => setV({ ...v, lines: v.lines.filter((_, j) => j !== i) })} />
              </div>
              <div className="mt-2"><PriceFields value={line} onChange={(p) => setLine(i, p)} perms={perms} /></div>
              <Input className="mt-2" placeholder={`${T.common.note} (${T.common.optional})`} value={line.note ?? ''} onChange={(e) => setLine(i, { note: e.target.value })} wrapperClassName="mt-2" />
            </div>
          ))}
        </div>
        <Button size="sm" variant="subtle" icon={Plus} className="mt-2" onClick={() => setV({ ...v, lines: [...v.lines, { text: '', sellingPrice: 0, costPrice: 0, mrpPrice: 0, note: '' }] })}>{T.sets.addLine}</Button>
      </div>
    </Shell>
  );
};

// ---------------------------------------------------------------- Add-ons
export const AddOnForm = ({ record, onClose, onSaved, crud }) => {
  const [v, setV] = useState(() => ({ kind: 'free', title: '', text: '', badge: '', valueAmount: 0, priceEffect: 'none', priceAmount: 0, isActive: true, ...(record ?? {}) }));
  const { save, saving, errors } = useMasterSave({ crud, record, onSaved });
  const A = T.addOns;
  // Inclusion is chosen per quote; the master only stores the reusable amount.
  const submit = () => save({ ...v, priceEffect: 'none', valueAmount: num(v.valueAmount), priceAmount: num(v.priceAmount), _id: undefined, createdAt: undefined, updatedAt: undefined, __v: undefined, sortOrder: undefined });
  return (
    <Shell title={record ? T.common.edit : A.add} onClose={onClose} onSave={submit} saving={saving}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Select label={A.kind} value={v.kind} onChange={(e) => setV({ ...v, kind: e.target.value })} options={Object.entries(A.kinds).map(([value, label]) => ({ value, label }))} />
        <Input label={A.badge} value={v.badge} onChange={(e) => setV({ ...v, badge: e.target.value })} placeholder="FREE" />
      </div>
      <Input label={A.titleField} required value={v.title} error={errors.title} onChange={(e) => setV({ ...v, title: e.target.value })} placeholder="Free Pre-Wedding" />
      <Textarea label={A.text} rows={2} value={v.text} onChange={(e) => setV({ ...v, text: e.target.value })} placeholder="Free pre-wedding worth ₹25,000" />
      <div className="grid gap-3 sm:grid-cols-2">
        <Input label={A.valueAmount} prefix="₹" inputMode="numeric" value={v.valueAmount} onChange={(e) => setV({ ...v, valueAmount: e.target.value })} />
        <Input label={A.priceAmount} prefix="₹" inputMode="numeric" hint={A.priceHint} error={errors.priceAmount} value={v.priceAmount} onChange={(e) => setV({ ...v, priceAmount: e.target.value })} />
      </div>
      <Switch label={T.common.active} checked={v.isActive !== false} onChange={(e) => setV({ ...v, isActive: e.target.checked })} />
    </Shell>
  );
};

// ---------------------------------------------------------------- Package presets
export const PresetForm = ({ record, onClose, onSaved, crud }) => {
  const [v, setV] = useState(() => ({ name: '', subtitle: '', description: '', isActive: true, ...(record ?? {}) }));
  const { save, saving, errors } = useMasterSave({ crud, record, onSaved });
  const P = T.presets;
  return (
    <Shell title={record ? T.common.edit : P.add} onClose={onClose} saving={saving}
      onSave={() => save({ name: v.name, subtitle: v.subtitle ?? '', description: v.description ?? '', isActive: v.isActive !== false })}>
      <Input label={T.common.name} required value={v.name} error={errors.name} onChange={(e) => setV({ ...v, name: e.target.value })} placeholder="Destination Wedding Package" autoFocus />
      <Input label={P.subtitle} value={v.subtitle} onChange={(e) => setV({ ...v, subtitle: e.target.value })} placeholder="Both Side Coverage" />
      <Textarea label={P.descriptionField} rows={3} value={v.description} onChange={(e) => setV({ ...v, description: e.target.value })} />
      <Switch label={T.common.active} checked={v.isActive !== false} onChange={(e) => setV({ ...v, isActive: e.target.checked })} />
    </Shell>
  );
};
