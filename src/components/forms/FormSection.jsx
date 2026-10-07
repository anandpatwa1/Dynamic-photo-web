import { cn } from '@/utils/cn';
import { Card, CardBody, CardFooter, CardHeader, CardTitle, CardDescription, Button } from '@/components/ui';

/**
 * A titled card wrapping one logical group of fields, with an optional save
 * footer. Used by every settings tab and detail form so spacing and hierarchy
 * stay identical across the app.
 */
export const FormSection = ({
  title,
  description,
  icon: Icon,
  children,
  footer,
  onSubmit,
  saving = false,
  dirty = false,
  submitLabel = 'Save changes',
  className,
  as = 'form',
}) => {
  const Component = as;

  return (
    <Card as={Component} onSubmit={onSubmit} noValidate className={cn('overflow-hidden', className)}>
      {(title || description) && (
        <CardHeader>
          <div className="flex min-w-0 items-start gap-3.5">
            {Icon && (
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-200/60">
                <Icon className="h-4.5 w-4.5" aria-hidden="true" />
              </span>
            )}
            <div className="min-w-0">
              <CardTitle>{title}</CardTitle>
              {description && <CardDescription>{description}</CardDescription>}
            </div>
          </div>
        </CardHeader>
      )}

      <CardBody className="space-y-5">{children}</CardBody>

      {(footer || onSubmit) && (
        <CardFooter className="bg-ink-50/60">
          {footer ?? (
            <>
              {dirty && (
                <p className="mr-auto text-sm text-ink-500">You have unsaved changes</p>
              )}
              <Button type="submit" loading={saving} disabled={!dirty && !saving}>
                {submitLabel}
              </Button>
            </>
          )}
        </CardFooter>
      )}
    </Card>
  );
};

/** Responsive two-column field grid; `span` lets a field take the full width. */
export const FieldGrid = ({ columns = 2, className, children }) => (
  <div
    className={cn(
      'grid gap-5',
      columns === 3 ? 'sm:grid-cols-3' : columns === 2 ? 'sm:grid-cols-2' : 'grid-cols-1',
      className,
    )}
  >
    {children}
  </div>
);

export const FieldSpan = ({ className, children }) => (
  <div className={cn('sm:col-span-full', className)}>{children}</div>
);
