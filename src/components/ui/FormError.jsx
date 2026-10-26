import { AlertCircle } from 'lucide-react';
import { cn } from '@/utils/cn';

/**
 * The banner shown when a request fails for a reason that is not tied to a
 * single field. Renders nothing when there is no message, so callers can drop
 * it in unconditionally.
 *
 * `fieldErrors` is accepted so a form can stay quiet when the server has
 * already pointed at specific inputs — repeating the same complaint twice, once
 * at the top and once beside the field, is just noise.
 */
export const FormError = ({ error, fieldErrors = [], className }) => {
  if (!error || fieldErrors.length > 0) return null;

  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-2.5 rounded-xl bg-danger-50 px-4 py-3 ring-1 ring-inset ring-danger-100',
        className,
      )}
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger-600" aria-hidden="true" />
      <p className="text-sm text-danger-700">{error}</p>
    </div>
  );
};
