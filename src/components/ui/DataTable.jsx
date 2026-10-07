import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/utils/cn';
import { TableSkeleton } from './Skeleton';
import { EmptyState } from './EmptyState';
import { Pagination } from './Pagination';

/**
 * The table used by every list page.
 *
 * columns: [{
 *   key, header, accessor?(row) | render?(row, index),
 *   align?: 'left'|'right'|'center', width?, sortable?, numeric?, className?, headerClassName?
 * }]
 *
 * Sorting is controlled — the parent owns `sort` and reacts to `onSortChange`,
 * so the same component works for both server- and client-sorted data.
 */
export const DataTable = ({
  columns = [],
  rows = [],
  loading = false,
  rowKey = (row, index) => row?._id ?? row?.id ?? index,
  onRowClick,
  sort,
  onSortChange,
  meta,
  onPageChange,
  onLimitChange,
  empty,
  className,
  stickyHeader = true,
}) => {
  const handleSort = (column) => {
    if (!column.sortable || !onSortChange) return;
    const isActive = sort?.sortBy === column.key;
    onSortChange({
      sortBy: column.key,
      sortOrder: isActive && sort.sortOrder === 'desc' ? 'asc' : 'desc',
    });
  };

  const alignClass = (align) =>
    align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';

  if (loading) {
    return (
      <div className={cn('rounded-2xl bg-white shadow-card', className)}>
        <TableSkeleton columns={columns.length} />
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className={cn('rounded-2xl bg-white shadow-card', className)}>
        {empty ?? <EmptyState title="Nothing here yet" description="Records will appear here once added." />}
      </div>
    );
  }

  return (
    <div className={cn('rounded-2xl bg-white shadow-card', className)}>
      {/* Horizontal scroll only. `overflow-y: visible` cannot be honoured next
          to `overflow-x: auto` (CSS forces it to `auto`), so anything that must
          escape this box — row action menus — renders through a portal. */}
      <div className="scrollbar-slim overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse">
          <thead>
            <tr className={cn('bg-ink-50/80', stickyHeader && 'sticky top-0 z-10')}>
              {columns.map((column) => {
                const isActive = sort?.sortBy === column.key;
                const SortIcon = !isActive
                  ? ChevronsUpDown
                  : sort.sortOrder === 'asc'
                    ? ArrowUp
                    : ArrowDown;

                return (
                  <th
                    key={column.key}
                    scope="col"
                    style={column.width ? { width: column.width } : undefined}
                    className={cn(
                      'border-b border-ink-200/70 px-6 py-3 text-2xs font-semibold uppercase tracking-wider text-ink-500',
                      alignClass(column.align),
                      column.headerClassName,
                    )}
                  >
                    {column.sortable ? (
                      <button
                        type="button"
                        onClick={() => handleSort(column)}
                        className={cn(
                          // `uppercase` is repeated here because a <button> does
                          // not inherit text-transform from its <th>.
                          'inline-flex items-center gap-1.5 uppercase tracking-wider transition-colors hover:text-ink-800',
                          column.align === 'right' && 'flex-row-reverse',
                          isActive && 'text-ink-900',
                        )}
                      >
                        {column.header}
                        <SortIcon className="h-3 w-3 shrink-0" aria-hidden="true" />
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-ink-200/60">
            {rows.map((row, index) => (
              <tr
                key={rowKey(row, index)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  'transition-colors',
                  onRowClick && 'cursor-pointer hover:bg-brand-50/40',
                )}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn(
                      'px-6 py-3.5 text-base text-ink-700 align-middle',
                      alignClass(column.align),
                      column.numeric && 'tabular',
                      column.className,
                    )}
                  >
                    {column.render
                      ? column.render(row, index)
                      : column.accessor
                        ? column.accessor(row)
                        : (row[column.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination meta={meta} onPageChange={onPageChange} onLimitChange={onLimitChange} />
    </div>
  );
};
