import { AlertTriangle, Trash2 } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Modal } from './Modal';
import { Button } from './Button';

const TONES = {
  danger: { icon: Trash2, wrap: 'bg-danger-50 text-danger-600', confirm: 'danger' },
  warning: { icon: AlertTriangle, wrap: 'bg-warning-50 text-warning-600', confirm: 'primary' },
};

/** Destructive-action confirmation used by every delete/archive flow. */
export const ConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  tone = 'danger',
  loading = false,
}) => {
  const config = TONES[tone] ?? TONES.danger;
  const Icon = config.icon;

  return (
    <Modal
      open={open}
      onClose={loading ? undefined : onClose}
      size="sm"
      showClose={false}
      closeOnBackdrop={!loading}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={config.confirm} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex gap-4">
        <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-full', config.wrap)}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 pt-0.5">
          <h2 className="text-md font-semibold text-ink-900">{title}</h2>
          {message && <p className="mt-1.5 text-sm leading-relaxed text-ink-600">{message}</p>}
        </div>
      </div>
    </Modal>
  );
};
