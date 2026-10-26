import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, ConfirmDialog, DataTable, EmptyState, PageHeader, SearchInput, Switch, Toolbar } from '@/components/ui';
import { PermissionGate } from '../../components/PermissionGate';
import { useWqPermissions } from '../../hooks/useWqPermissions';
import { T } from '../../constants/strings';
import { CRM } from '@/routes/paths';

/**
 * Generic master list: search, active toggle, reorder, edit/delete.
 * `crud` is a createCrudSlice result; `service` the matching API object.
 */
export const MasterPage = ({ crud, service, title, description, addLabel, columns, Form, emptyText, emptyHint }) => {
  const dispatch = useDispatch();
  const perms = useWqPermissions();
  const items = useSelector(crud.selectors.selectItems);
  const loading = useSelector(crud.selectors.selectLoading);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null); // null | {} (new) | record
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => dispatch(crud.thunks.fetchList({ search: search || undefined, limit: 200 })), [dispatch, crud, search]);
  useEffect(() => { load(); }, [load]);

  const canManage = perms.manageMasters;

  const move = async (index, delta) => {
    const ids = items.map((i) => i._id);
    const target = index + delta;
    if (target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    try {
      await service.reorder(ids);
      load();
    } catch (e) {
      toast.error(e?.response?.data?.message ?? 'Could not reorder');
    }
  };

  const toggleActive = async (row) => {
    const result = await dispatch(crud.thunks.update({ id: row._id, payload: { isActive: !row.isActive } }));
    if (result.error) toast.error(result.payload?.message ?? 'Could not update');
  };

  const confirmDelete = async () => {
    setBusy(true);
    try {
      const res = await service.remove(deleting._id);
      toast.success(res?.deactivated ? 'In use by quotes — deactivated instead' : T.common.deleted);
      setDeleting(null);
      load();
    } catch (e) {
      toast.error(e?.response?.data?.message ?? 'Could not delete');
    } finally {
      setBusy(false);
    }
  };

  const tableColumns = [
    ...columns(perms),
    {
      key: 'isActive',
      header: T.common.active,
      render: (row) => (
        <Switch checked={row.isActive !== false} disabled={!canManage} onChange={() => toggleActive(row)} aria-label={T.common.active} />
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (row, index) =>
        canManage && (
          <div className="flex justify-end gap-1">
            <Button size="xs" variant="ghost" iconOnly icon={ArrowUp} aria-label={T.common.moveUp} disabled={!!search || index === 0} onClick={() => move(index, -1)} />
            <Button size="xs" variant="ghost" iconOnly icon={ArrowDown} aria-label={T.common.moveDown} disabled={!!search || index === items.length - 1} onClick={() => move(index, 1)} />
            <Button size="xs" variant="ghost" iconOnly icon={Pencil} aria-label={T.common.edit} onClick={() => setEditing(row)} />
            <Button size="xs" variant="ghost" iconOnly icon={Trash2} aria-label={T.common.delete} onClick={() => setDeleting(row)} />
          </div>
        ),
    },
  ];

  return (
    <PermissionGate anyOf={['manageMasters', 'viewQuotes', 'createQuote']}>
      <PageHeader
        title={title}
        description={description}
        breadcrumbs={[{ label: T.module, to: CRM.wqQuotes }, { label: T.nav.mastersGroup }, { label: title }]}
        actions={canManage && <Button icon={Plus} onClick={() => setEditing({})}>{addLabel}</Button>}
      />
      <Toolbar>
        <SearchInput value={search} onChange={setSearch} placeholder={T.common.search} className="w-full sm:w-80" />
      </Toolbar>
      <DataTable
        columns={tableColumns}
        rows={items}
        loading={loading}
        empty={<EmptyState title={emptyText} description={emptyHint} actionLabel={canManage ? addLabel : undefined} onAction={canManage ? () => setEditing({}) : undefined} actionIcon={Plus} />}
      />
      {editing && (
        <Form
          record={editing._id ? editing : null}
          perms={perms}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
          crud={crud}
        />
      )}
      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={confirmDelete} loading={busy} message={T.common.confirmDelete} />
    </PermissionGate>
  );
};
