import { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';

import {
  Button,
  FormError,
  Input,
  Modal,
  NumberInput,
  Select,
  Textarea,
} from '@/components/ui';
import { FieldGrid } from '@/components/forms/FormSection';
import {
  createPayment,
  updatePayment,
  selectPaymentSaving,
  selectPaymentError,
  selectPaymentFieldErrors,
} from '@/redux/payment/paymentSlice';
import { fetchDocuments, selectDocuments } from '@/redux/document/documentSlice';
import { useServerErrors } from '@/hooks/useServerErrors';
import { PAYMENT_MODES } from '@/constants';
import { formatCurrency, toDateInputValue } from '@/utils/format';

const paymentSchema = z.object({
  document: z.string().min(1, 'Choose the invoice this payment settles'),
  amount: z.coerce.number().gt(0, 'Enter an amount greater than zero'),
  date: z.string().min(1, 'Pick a date'),
  mode: z.enum(['upi', 'bank_transfer', 'cash', 'cheque', 'card', 'other']),
  status: z.enum(['received', 'pending', 'failed', 'refunded']),
  reference: z.string().trim().max(120, 'Too long').optional().or(z.literal('')),
  notes: z.string().trim().max(1000, 'Too long').optional().or(z.literal('')),
});

const STATUS_OPTIONS = [
  { value: 'received', label: 'Received' },
  { value: 'pending', label: 'Pending' },
  { value: 'failed', label: 'Failed' },
  { value: 'refunded', label: 'Refunded' },
];

export const PaymentFormModal = ({ open, onClose, payment, presetDocument, onSaved }) => {
  const dispatch = useDispatch();
  const saving = useSelector(selectPaymentSaving);
  const error = useSelector(selectPaymentError);
  const fieldErrors = useSelector(selectPaymentFieldErrors);
  const documents = useSelector(selectDocuments);

  const isEdit = Boolean(payment?._id);

  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      document: presetDocument?._id ?? '',
      amount: 0,
      date: toDateInputValue(new Date()),
      mode: 'upi',
      status: 'received',
      reference: '',
      notes: '',
    },
  });

  useServerErrors(fieldErrors, setError);

  // Only unsettled invoices can receive a payment.
  useEffect(() => {
    if (open && !presetDocument) {
      dispatch(fetchDocuments({ type: 'invoice', limit: 100, sortBy: 'date', sortOrder: 'desc' }));
    }
  }, [open, presetDocument, dispatch]);

  useEffect(() => {
    if (!open) return;
    reset({
      document: payment?.document?._id ?? presetDocument?._id ?? '',
      amount: payment?.amount ?? presetDocument?.balanceDue ?? 0,
      date: toDateInputValue(payment?.date ?? new Date()),
      mode: payment?.mode ?? 'upi',
      status: payment?.status ?? 'received',
      reference: payment?.reference ?? '',
      notes: payment?.notes ?? '',
    });
  }, [open, payment, presetDocument, reset]);

  const selectedId = useWatch({ control, name: 'document' });

  const selected = useMemo(
    () =>
      presetDocument?._id === selectedId
        ? presetDocument
        : documents.find((item) => item._id === selectedId),
    [documents, presetDocument, selectedId],
  );

  const options = useMemo(() => {
    const pool = presetDocument ? [presetDocument] : documents;
    return pool
      .filter((item) => item.status !== 'cancelled')
      .map((item) => ({
        value: item._id,
        label: `${item.number} · ${item.clientSnapshot?.name ?? ''} · ${formatCurrency(item.balanceDue)} due`,
      }));
  }, [documents, presetDocument]);

  const onSubmit = async (values) => {
    const payload = { ...values, date: new Date(values.date).toISOString() };

    const result = isEdit
      ? await dispatch(updatePayment({ id: payment._id, payload }))
      : await dispatch(createPayment(payload));

    const thunk = isEdit ? updatePayment : createPayment;
    if (thunk.fulfilled.match(result)) {
      toast.success(isEdit ? 'Payment updated' : 'Payment recorded');
      onSaved?.(result.payload);
      onClose();
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={isEdit ? 'Edit payment' : 'Record a payment'}
      description="The invoice balance and status update automatically."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(onSubmit)} loading={saving}>
            {isEdit ? 'Save payment' : 'Record payment'}
          </Button>
        </>
      }
    >
      <FormError error={error} fieldErrors={fieldErrors} className="mb-5" />

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <Select
          label="Invoice"
          required
          disabled={isEdit || Boolean(presetDocument)}
          placeholder="Choose an invoice…"
          options={options}
          hint={isEdit ? 'A payment cannot be moved to another document' : undefined}
          error={errors.document?.message}
          {...register('document')}
        />

        {selected && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-ink-50 px-4 py-3">
            <span className="text-sm text-ink-600">
              Outstanding on <span className="tabular font-medium">{selected.number}</span>
            </span>
            <span className="tabular text-md font-semibold text-ink-900">
              {formatCurrency(selected.balanceDue)}
            </span>
          </div>
        )}

        <FieldGrid>
          <NumberInput
            label="Amount"
            required
            prefix="₹"
            error={errors.amount?.message}
            {...register('amount')}
          />
          <Input label="Date" type="date" required error={errors.date?.message} {...register('date')} />
          <Select label="Mode" options={PAYMENT_MODES} error={errors.mode?.message} {...register('mode')} />
          <Select
            label="Status"
            options={STATUS_OPTIONS}
            hint="Only received payments reduce the balance"
            error={errors.status?.message}
            {...register('status')}
          />
        </FieldGrid>

        <Input
          label="Reference"
          optional
          placeholder="UTR / transaction id / cheque no."
          error={errors.reference?.message}
          {...register('reference')}
        />

        <Textarea
          label="Notes"
          rows={2}
          optional
          error={errors.notes?.message}
          {...register('notes')}
        />
      </form>
    </Modal>
  );
};
