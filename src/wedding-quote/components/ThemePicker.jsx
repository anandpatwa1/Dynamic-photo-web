import { useMemo, useState } from 'react';
import { Check, Palette } from 'lucide-react';
import { Button, Modal, SearchInput, Tabs } from '@/components/ui';
import { cn } from '@/utils/cn';
import { ThemePreview } from '../pages/themes/ThemePreview';
import { T, fmt } from '../constants/strings';

const TH = T.themes;
const identityOf = (theme) => String(theme?._id ?? theme?.key ?? '');

export const ThemePicker = ({ themes = [], assignedIds = [], value, dayCount, disabled, onChange }) => {
  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState('assigned');
  const [query, setQuery] = useState('');
  const assigned = useMemo(() => new Set(assignedIds.map(String)), [assignedIds]);
  const assignedCount = assigned.size ? themes.filter((theme) => assigned.has(String(theme._id))).length : themes.length;
  const visible = useMemo(() => themes.filter((theme) => {
    if (scope === 'assigned' && assigned.size && !assigned.has(String(theme._id))) return false;
    return theme.name.toLowerCase().includes(query.trim().toLowerCase());
  }), [themes, scope, assigned, query]);
  const selectedIndex = Math.max(0, themes.findIndex((theme) => identityOf(theme) === String(value ?? '')));
  const selected = themes[selectedIndex];

  return (
    <>
      <Button variant="secondary" size="sm" icon={Palette} disabled={disabled} onClick={() => setOpen(true)} className="max-w-48">
        <span className="truncate">{selected?.name ?? TH.chooseTheme}</span>
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title={TH.chooseTheme}
        description={TH.pickerDescription} size="2xl" className="sm:max-h-[94vh]">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Tabs size="sm" value={scope} onChange={setScope} className="sm:min-w-72"
            tabs={[{ value: 'assigned', label: fmt(T.editor.assigned, { n: dayCount }), count: assignedCount }, { value: 'all', label: TH.all, count: themes.length }]} />
          <SearchInput value={query} onChange={setQuery} delay={0} placeholder={TH.search} className="w-full sm:max-w-xs" />
        </div>
        {visible.length ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
            {visible.map((theme) => {
              const active = identityOf(theme) === identityOf(selected);
              const compatible = (theme.forDays ?? []).includes(dayCount);
              return (
                <button key={identityOf(theme)} type="button" aria-pressed={active} onClick={() => { if (theme._id) onChange(theme._id); setOpen(false); }}
                  className={cn('overflow-hidden rounded-2xl bg-white p-2 text-left ring-1 transition hover:-translate-y-0.5 hover:shadow-card-hover', active ? 'ring-2 ring-brand-500' : 'ring-ink-200')}>
                  <div className="relative flex justify-center overflow-hidden rounded-xl bg-ink-100">
                    <ThemePreview theme={theme} dayCount={dayCount} width={150} />
                    {active && <span className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-brand-500 text-white shadow"><Check className="h-4 w-4" /></span>}
                  </div>
                  <p className="mt-2 truncate text-sm font-semibold text-ink-900">{theme.name}</p>
                  <p className={cn('mt-0.5 text-xs', compatible ? 'text-success-700' : 'text-ink-400')}>{compatible ? TH.compatible : fmt(TH.forDays, { days: (theme.forDays ?? []).join(', ') })}</p>
                </button>
              );
            })}
          </div>
        ) : <p className="py-12 text-center text-sm text-ink-500">No themes found</p>}
      </Modal>
    </>
  );
};

export default ThemePicker;
