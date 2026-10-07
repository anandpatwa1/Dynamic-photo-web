import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';

import {
  Button,
  FormError,
  Input,
  Modal,
  SegmentedControl,
  Select,
  Textarea,
} from '@/components/ui';
import { FieldGrid, FieldSpan } from '@/components/forms/FormSection';
import { TagInput } from '@/components/forms/TagInput';
import { clientSchema, clientDefaults, CLIENT_SOURCE_OPTIONS } from '@/validations/client.schema';
import { pruneEmpty } from '@/utils/pruneEmpty';
import {
  createClient,
  updateClient,
  selectClientSaving,
  selectClientFieldErrors,
  selectClientError,
} from '@/redux/client/clientSlice';
import { useServerErrors } from '@/hooks/useServerErrors';
import { CLIENT_STATUS_META, statusOptions } from '@/constants';

const STATUS_OPTIONS = statusOptions(CLIENT_STATUS_META);

export const ClientFormModal = ({ open, onClose, client, onSaved }) => {
  const dispatch = useDispatch();
  const saving = useSelector(selectClientSaving);
  const fieldErrors = useSelector(selectClientFieldErrors);
  const error = useSelector(selectClientError);

  const isEdit = Boolean(client?._id);

  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(clientSchema),
    defaultValues: clientDefaults(client),
  });

  useServerErrors(fieldErrors, setError);

  // Re-seed whenever the modal is opened for a different record.
  useEffect(() => {
    if (open) reset(clientDefaults(client));
  }, [open, client, reset]);

  const onSubmit = async (values) => {
    const payload = pruneEmpty({ ...values, tags: values.tags });

    const result = isEdit
      ? await dispatch(updateClient({ id: client._id, payload }))
      : await dispatch(createClient(payload));

    const thunk = isEdit ? updateClient : createClient;
    if (thunk.fulfilled.match(result)) {
      toast.success(isEdit ? 'Client updated' : 'Client added');
      onSaved?.(result.payload.client);
      onClose();
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      title={isEdit ? 'Edit client' : 'New client'}
      description={
        isEdit
          ? 'Update the details used across documents and projects.'
          : 'Add a brand, couple or business you work with.'
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(onSubmit)} loading={saving}>
            {isEdit ? 'Save changes' : 'Add client'}
          </Button>
        </>
      }
    >
      <FormError error={error} fieldErrors={fieldErrors} className="mb-5" />

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
        <Controller
          control={control}
          name="type"
          render={({ field }) => (
            <SegmentedControl
              options={[
                { value: 'business', label: 'Business / Brand' },
                { value: 'individual', label: 'Individual' },
              ]}
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />

        <FieldGrid>
          <Input
            label="Client name"
            required
            placeholder="Sanatan Mobility"
            error={errors.name?.message}
            {...register('name')}
          />
          <Input
            label="Contact person"
            placeholder="Who you actually speak to"
            error={errors.contactPerson?.message}
            {...register('contactPerson')}
          />
          <Input
            label="Email"
            type="email"
            placeholder="hello@brand.com"
            error={errors.email?.message}
            {...register('email')}
          />
          <Input
            label="Phone"
            placeholder="+91 98936 08222"
            error={errors.phone?.message}
            {...register('phone')}
          />
          <Input
            label="Alternate phone"
            optional
            error={errors.alternatePhone?.message}
            {...register('alternatePhone')}
          />
          <Select
            label="Status"
            options={STATUS_OPTIONS}
            error={errors.status?.message}
            {...register('status')}
          />
        </FieldGrid>

        <div className="border-t border-ink-200/70 pt-6">
          <p className="mb-4 text-sm font-medium text-ink-700">Address</p>
          <FieldGrid>
            <FieldSpan>
              <Input
                label="Address line 1"
                placeholder="Survey No. 76, near Lavkush Square"
                error={errors.address?.line1?.message}
                {...register('address.line1')}
              />
            </FieldSpan>
            <FieldSpan>
              <Input
                label="Address line 2"
                optional
                error={errors.address?.line2?.message}
                {...register('address.line2')}
              />
            </FieldSpan>
            <Input label="City" error={errors.address?.city?.message} {...register('address.city')} />
            <Input
              label="State"
              error={errors.address?.state?.message}
              {...register('address.state')}
            />
            <Input
              label="PIN code"
              error={errors.address?.pincode?.message}
              {...register('address.pincode')}
            />
            <Input
              label="Country"
              error={errors.address?.country?.message}
              {...register('address.country')}
            />
          </FieldGrid>
        </div>

        <div className="border-t border-ink-200/70 pt-6">
          <p className="mb-4 text-sm font-medium text-ink-700">Business details</p>
          <FieldGrid columns={3}>
            <Input
              label="GSTIN"
              optional
              className="uppercase"
              error={errors.gstin?.message}
              {...register('gstin')}
            />
            <Input
              label="PAN"
              optional
              className="uppercase"
              error={errors.pan?.message}
              {...register('pan')}
            />
            <Input
              label="Place of supply"
              optional
              placeholder="Indore, Madhya Pradesh"
              error={errors.placeOfSupply?.message}
              {...register('placeOfSupply')}
            />
          </FieldGrid>
        </div>

        <div className="space-y-5 border-t border-ink-200/70 pt-6">
          <FieldGrid>
            <Select
              label="How did they find you?"
              options={CLIENT_SOURCE_OPTIONS}
              error={errors.source?.message}
              {...register('source')}
            />
            <Controller
              control={control}
              name="tags"
              render={({ field }) => (
                <TagInput
                  label="Tags"
                  hint="Press Enter to add"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.tags?.message}
                />
              )}
            />
          </FieldGrid>

          <Textarea
            label="Internal notes"
            rows={3}
            optional
            placeholder="Anything your team should know before the next call…"
            hint="Only visible to your team — never printed on documents."
            error={errors.notes?.message}
            {...register('notes')}
          />
        </div>
      </form>
    </Modal>
  );
};
