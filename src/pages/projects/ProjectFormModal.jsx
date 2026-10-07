import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
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
import { FieldGrid, FieldSpan } from '@/components/forms/FormSection';
import { TermsEditor, fieldsToTerms } from '@/components/forms/TermsEditor';
import {
  createProject,
  updateProject,
  selectProjectSaving,
  selectProjectError,
  selectProjectFieldErrors,
} from '@/redux/project/projectSlice';
import { fetchClientOptions, selectClientOptions } from '@/redux/client/clientSlice';
import { fetchPackageOptions, selectPackageOptions } from '@/redux/package/packageSlice';
import { useServerErrors } from '@/hooks/useServerErrors';
import { PACKAGE_CATEGORIES, PROJECT_STATUS_META, statusOptions } from '@/constants';
import { toDateInputValue } from '@/utils/format';

const projectSchema = z
  .object({
    title: z.string().trim().min(1, 'Give the project a name').max(200, 'Too long'),
    client: z.string().min(1, 'Choose a client'),
    package: z.string().optional().or(z.literal('')),
    category: z.string(),
    status: z.string(),
    priority: z.enum(['low', 'normal', 'high']),
    description: z.string().trim().max(2000, 'Too long').optional().or(z.literal('')),
    location: z.string().trim().max(200, 'Too long').optional().or(z.literal('')),
    shootDate: z.string().optional().or(z.literal('')),
    shootEndDate: z.string().optional().or(z.literal('')),
    deliveryDate: z.string().optional().or(z.literal('')),
    budget: z.coerce.number().min(0, 'Cannot be negative'),
    deliverables: z.array(z.object({ value: z.string().trim().max(300, 'Too long') })),
    notes: z.string().trim().max(2000, 'Too long').optional().or(z.literal('')),
  })
  // Mirrors the server rule so the user sees it before a round trip.
  .refine(
    (data) => !data.shootDate || !data.deliveryDate || data.deliveryDate >= data.shootDate,
    { message: 'Delivery cannot precede the shoot', path: ['deliveryDate'] },
  )
  .refine(
    (data) => !data.shootDate || !data.shootEndDate || data.shootEndDate >= data.shootDate,
    { message: 'The end date cannot precede the shoot', path: ['shootEndDate'] },
  );

const STATUS_OPTIONS = statusOptions(PROJECT_STATUS_META);

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
];

const toDefaults = (project) => ({
  title: project?.title ?? '',
  client: project?.client?._id ?? project?.client ?? '',
  package: project?.package?._id ?? project?.package ?? '',
  category: project?.category ?? 'other',
  status: project?.status ?? 'enquiry',
  priority: project?.priority ?? 'normal',
  description: project?.description ?? '',
  location: project?.location ?? '',
  shootDate: toDateInputValue(project?.shootDate),
  shootEndDate: toDateInputValue(project?.shootEndDate),
  deliveryDate: toDateInputValue(project?.deliveryDate),
  budget: project?.budget ?? 0,
  deliverables: (project?.deliverables ?? []).map((item) => ({ value: item.label })),
  notes: project?.notes ?? '',
});

export const ProjectFormModal = ({ open, onClose, project, onSaved }) => {
  const dispatch = useDispatch();
  const saving = useSelector(selectProjectSaving);
  const error = useSelector(selectProjectError);
  const fieldErrors = useSelector(selectProjectFieldErrors);
  const clients = useSelector(selectClientOptions);
  const packages = useSelector(selectPackageOptions);

  const isEdit = Boolean(project?._id);

  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(projectSchema),
    defaultValues: toDefaults(project),
  });

  useServerErrors(fieldErrors, setError);

  useEffect(() => {
    if (open) {
      dispatch(fetchClientOptions());
      dispatch(fetchPackageOptions());
      reset(toDefaults(project));
    }
  }, [open, project, reset, dispatch]);

  const onSubmit = async (values) => {
    const payload = {
      ...values,
      package: values.package || undefined,
      shootDate: values.shootDate || undefined,
      shootEndDate: values.shootEndDate || undefined,
      deliveryDate: values.deliveryDate || undefined,
      // The API stores `{ label, isDone }`; the editor works in `{ value }`.
      deliverables: fieldsToTerms(values.deliverables).map((label) => ({ label, isDone: false })),
    };

    const result = isEdit
      ? await dispatch(updateProject({ id: project._id, payload }))
      : await dispatch(createProject(payload));

    const thunk = isEdit ? updateProject : createProject;
    if (thunk.fulfilled.match(result)) {
      toast.success(isEdit ? 'Project updated' : 'Project created');
      onSaved?.(result.payload.project);
      onClose();
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      title={isEdit ? 'Edit project' : 'New project'}
      description="Track a shoot from enquiry through to delivery."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(onSubmit)} loading={saving}>
            {isEdit ? 'Save project' : 'Create project'}
          </Button>
        </>
      }
    >
      <FormError error={error} fieldErrors={fieldErrors} className="mb-5" />

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
        <FieldGrid>
          <FieldSpan>
            <Input
              label="Project title"
              required
              placeholder="Sanatan Mobility — August content"
              error={errors.title?.message}
              {...register('title')}
            />
          </FieldSpan>

          <Select
            label="Client"
            required
            disabled={isEdit}
            placeholder="Choose a client…"
            options={clients.map((client) => ({ value: client._id, label: client.name }))}
            error={errors.client?.message}
            {...register('client')}
          />
          <Select
            label="Package"
            placeholder="No package"
            options={packages.map((pkg) => ({ value: pkg._id, label: pkg.name }))}
            error={errors.package?.message}
            {...register('package')}
          />
          <Select
            label="Category"
            options={PACKAGE_CATEGORIES}
            error={errors.category?.message}
            {...register('category')}
          />
          <Select
            label="Status"
            options={STATUS_OPTIONS}
            error={errors.status?.message}
            {...register('status')}
          />
          <Select
            label="Priority"
            options={PRIORITY_OPTIONS}
            error={errors.priority?.message}
            {...register('priority')}
          />
          <NumberInput
            label="Budget"
            prefix="₹"
            error={errors.budget?.message}
            {...register('budget')}
          />
        </FieldGrid>

        <div className="border-t border-ink-200/70 pt-6">
          <FieldGrid columns={3}>
            <Input
              label="Shoot date"
              type="date"
              error={errors.shootDate?.message}
              {...register('shootDate')}
            />
            <Input
              label="Shoot ends"
              type="date"
              error={errors.shootEndDate?.message}
              {...register('shootEndDate')}
            />
            <Input
              label="Delivery by"
              type="date"
              error={errors.deliveryDate?.message}
              {...register('deliveryDate')}
            />
          </FieldGrid>

          <Input
            label="Location"
            placeholder="Indore, Madhya Pradesh"
            wrapperClassName="mt-5"
            error={errors.location?.message}
            {...register('location')}
          />
        </div>

        <div className="border-t border-ink-200/70 pt-6">
          <TermsEditor
            control={control}
            register={register}
            name="deliverables"
            errors={errors.deliverables}
            label="Delivery checklist"
            hint="Tick these off as the project progresses — they drive the progress bar."
            max={40}
            rows={1}
            placeholder="Shoot day 1"
            emptyText="No checklist yet — progress will follow the status pipeline instead."
            addLabel="Add checkpoint"
          />
        </div>

        <div className="space-y-5 border-t border-ink-200/70 pt-6">
          <Textarea
            label="Description"
            rows={3}
            optional
            error={errors.description?.message}
            {...register('description')}
          />
          <Textarea
            label="Internal notes"
            rows={2}
            optional
            error={errors.notes?.message}
            {...register('notes')}
          />
        </div>
      </form>
    </Modal>
  );
};
