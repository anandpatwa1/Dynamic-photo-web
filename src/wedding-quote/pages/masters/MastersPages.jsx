import { Badge } from '@/components/ui';
import { MasterPage } from './MasterPage';
import { AddOnForm, ItemForm, PresetForm, SetForm } from './forms';
import { wqAddOns, wqItems, wqPresets, wqSets } from '../../redux/wqSlices';
import { wqMasters } from '../../api/wqApi';
import { formatINR } from '../../utils/engine/money';
import { isReelText } from '../../utils/engine/reels';
import { T } from '../../constants/strings';

const priceCols = (perms) => [
  { key: 'sellingPrice', header: T.common.sellingPrice, align: 'right', render: (r) => <span className="tabular">{formatINR(r.sellingPrice)}</span> },
  ...(perms.viewCosting ? [{ key: 'costPrice', header: T.common.costPrice, align: 'right', render: (r) => <span className="tabular text-ink-500">{formatINR(r.costPrice)}</span> }] : []),
  { key: 'mrpPrice', header: T.common.mrpPrice, align: 'right', render: (r) => <span className="tabular text-ink-500">{formatINR(r.mrpPrice)}</span> },
];

export const ItemsPage = () => (
  <MasterPage crud={wqItems} service={wqMasters.items} title={T.items.title} description={T.items.description} addLabel={T.items.add}
    emptyText={T.items.empty} emptyHint={T.items.emptyHint} Form={ItemForm}
    columns={(perms) => [
      { key: 'name', header: T.common.name, render: (r) => (
        <div><p className="font-medium text-ink-900">{r.name}</p>
          <p className="text-xs text-ink-500">{(r.deliverables ?? []).map((d) => (isReelText(d) ? `🎞 ${d}` : d)).join(' · ')}</p></div>
      ) },
      ...priceCols(perms),
    ]} />
);

export const SetsPage = () => (
  <MasterPage crud={wqSets} service={wqMasters.sets} title={T.sets.title} description={T.sets.description} addLabel={T.sets.add} emptyText={T.sets.empty} Form={SetForm}
    columns={() => [
      { key: 'name', header: T.common.name, render: (r) => (
        <div><p className="flex items-center gap-2 font-medium text-ink-900">{r.name}{r.isDefault && <Badge tone="brand" size="sm">{T.sets.defaultBadge}</Badge>}</p>
          <p className="text-xs text-ink-500">{(r.lines ?? []).map((l) => l.text).join(' · ')}</p></div>
      ) },
      { key: 'lines', header: T.sets.lines, align: 'right', render: (r) => r.lines?.length ?? 0 },
    ]} />
);

export const AddOnsPage = () => (
  <MasterPage crud={wqAddOns} service={wqMasters.addOns} title={T.addOns.title} description={T.addOns.description} addLabel={T.addOns.add} emptyText={T.addOns.empty} Form={AddOnForm}
    columns={() => [
      { key: 'title', header: T.addOns.titleField, render: (r) => (
        <div><p className="font-medium text-ink-900">{r.badge && <Badge size="sm" className="mr-2">{r.badge}</Badge>}{r.title}</p><p className="text-xs text-ink-500">{r.text}</p></div>
      ) },
      { key: 'kind', header: T.addOns.kind, render: (r) => T.addOns.kinds[r.kind] ?? r.kind },
      { key: 'priceEffect', header: T.addOns.priceEffect, render: (r) => (Number(r.priceAmount) > 0 ? `Extra ${formatINR(r.priceAmount)}` : '—') },
    ]} />
);

export const PresetsPage = () => (
  <MasterPage crud={wqPresets} service={wqMasters.presets} title={T.presets.title} description={T.presets.description} addLabel={T.presets.add} emptyText={T.presets.empty} Form={PresetForm}
    columns={() => [
      { key: 'name', header: T.common.name, render: (r) => <div><p className="font-medium text-ink-900">{r.name}</p><p className="text-xs text-ink-500">{r.subtitle}</p></div> },
    ]} />
);
