import { Check, Copy, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import {
  Badge,
  Button,
  Dropdown,
  DropdownDivider,
  DropdownItem,
} from '@/components/ui';
import { cn } from '@/utils/cn';
import { formatCurrency, humanize } from '@/utils/format';

const CATEGORY_TONE = {
  monthly_content: 'brand',
  wedding: 'danger',
  pre_wedding: 'warning',
  corporate: 'info',
  product_shoot: 'olive',
  drone_shoot: 'info',
  event: 'warning',
  portfolio: 'neutral',
  other: 'neutral',
};

const MAX_VISIBLE_DELIVERABLES = 4;

/**
 * Product-style card for a package. The price block deliberately mirrors the
 * printed document — same hierarchy, same struck-through original price.
 */
export const PackageCard = ({ package: pkg, canManage, onEdit, onDuplicate, onDelete }) => {
  const hasDiscount = pkg.discountAmount > 0;
  const visible = pkg.deliverables?.slice(0, MAX_VISIBLE_DELIVERABLES) ?? [];
  const remaining = (pkg.deliverables?.length ?? 0) - visible.length;

  return (
    <article
      className={cn(
        'group flex flex-col rounded-2xl bg-white shadow-card transition-all duration-200 ease-smooth',
        'hover:-translate-y-0.5 hover:shadow-card-hover',
        !pkg.isActive && 'opacity-70',
      )}
    >
      <header className="flex items-start justify-between gap-3 border-b border-ink-200/70 p-5">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            <Badge tone={CATEGORY_TONE[pkg.category] ?? 'neutral'} size="sm">
              {humanize(pkg.category)}
            </Badge>
            {!pkg.isActive && (
              <Badge tone="neutral" size="sm">
                Inactive
              </Badge>
            )}
          </div>
          <h3 className="text-balance text-md font-semibold leading-snug text-ink-900">
            {pkg.name}
          </h3>
        </div>

        {canManage && (
          <Dropdown
            trigger={({ toggle }) => (
              <Button
                variant="ghost"
                size="sm"
                iconOnly
                icon={MoreHorizontal}
                onClick={toggle}
                aria-label={`Actions for ${pkg.name}`}
                className="-mr-1.5 -mt-1 shrink-0"
              />
            )}
          >
            <DropdownItem icon={Pencil} onClick={() => onEdit(pkg)}>
              Edit package
            </DropdownItem>
            <DropdownItem icon={Copy} onClick={() => onDuplicate(pkg)}>
              Duplicate
            </DropdownItem>
            <DropdownDivider />
            <DropdownItem icon={Trash2} danger onClick={() => onDelete(pkg)}>
              Delete
            </DropdownItem>
          </Dropdown>
        )}
      </header>

      <div className="flex-1 p-5">
        {pkg.description && (
          <p className="mb-4 line-clamp-2 text-pretty text-sm leading-relaxed text-ink-500">
            {pkg.description}
          </p>
        )}

        {visible.length > 0 && (
          <ul className="space-y-2">
            {visible.map((item) => (
              <li key={item} className="flex items-start gap-2.5">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-brand-100">
                  <Check className="h-2.5 w-2.5 text-brand-700" strokeWidth={3} aria-hidden="true" />
                </span>
                <span className="text-pretty text-sm leading-snug text-ink-600">{item}</span>
              </li>
            ))}
            {remaining > 0 && (
              <li className="pl-7 text-sm text-ink-400">+{remaining} more included</li>
            )}
          </ul>
        )}
      </div>

      <footer className="border-t border-ink-200/70 bg-ink-50/60 p-5">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            {hasDiscount && (
              <p className="tabular text-sm text-ink-400 line-through">
                {formatCurrency(pkg.price)}
              </p>
            )}
            <p className="tabular text-2xl font-semibold text-ink-900">
              {formatCurrency(pkg.netPrice ?? pkg.price)}
            </p>
            <p className="mt-0.5 text-xs text-ink-500">
              {pkg.unitLabel || `per ${pkg.unit}`}
            </p>
          </div>

          {hasDiscount && (
            <Badge tone="success" size="sm">
              Save {formatCurrency(pkg.discountAmount)}
            </Badge>
          )}
        </div>
      </footer>
    </article>
  );
};
