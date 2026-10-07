import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, MapPin, Receipt } from 'lucide-react';
import toast from 'react-hot-toast';

import { Input } from '@/components/ui';
import { FormSection, FieldGrid, FieldSpan } from '@/components/forms/FormSection';
import {companySchema} from '@/validations/settings.schema';
import { keepCleared } from '@/utils/pruneEmpty';
import { saveSettings } from '@/redux/setting/settingsSlice';

const toDefaults = (company = {}) => ({
  name: company.name ?? '',
  tagline: company.tagline ?? '',
  email: company.email ?? '',
  phone: company.phone ?? '',
  alternatePhone: company.alternatePhone ?? '',
  website: company.website ?? '',
  gstin: company.gstin ?? '',
  pan: company.pan ?? '',
  placeOfSupply: company.placeOfSupply ?? '',
  address: {
    line1: company.address?.line1 ?? '',
    line2: company.address?.line2 ?? '',
    city: company.address?.city ?? '',
    state: company.address?.state ?? '',
    pincode: company.address?.pincode ?? '',
    country: company.address?.country ?? 'India',
  },
});

export const CompanyTab = ({ settings, saving }) => {
  const dispatch = useDispatch();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(companySchema),
    defaultValues: toDefaults(settings?.company),
  });

  // Re-seed the form once settings arrive from the API.
  useEffect(() => {
    if (settings?.company) reset(toDefaults(settings.company));
  }, [settings?.company, reset]);

  const onSubmit = async (values) => {
    const result = await dispatch(saveSettings({ company: keepCleared(values) }));
    if (saveSettings.fulfilled.match(result)) toast.success('Company details saved');
  };

  return (
    <div className="space-y-6">
      <FormSection
        title="Company details"
        description="This is the letterhead on every quotation, estimate and invoice you send."
        icon={Building2}
        onSubmit={handleSubmit(onSubmit)}
        saving={saving}
        dirty={isDirty}
      >
        <FieldGrid>
          <Input label="Company name" required error={errors.name?.message} {...register('name')} />
          <Input
            label="Tagline"
            placeholder="Capturing Moments, Creating Impact"
            hint="Printed under the logo"
            error={errors.tagline?.message}
            {...register('tagline')}
          />
          <Input
            label="Email"
            type="email"
            placeholder="studio@gmail.com"
            error={errors.email?.message}
            {...register('email')}
          />
          <Input
            label="Phone"
            placeholder="8770703380"
            error={errors.phone?.message}
            {...register('phone')}
          />
          <Input
            label="Alternate phone"
            optional
            error={errors.alternatePhone?.message}
            {...register('alternatePhone')}
          />
          <Input
            label="Website"
            placeholder="https://dynamicproduction.in"
            optional
            error={errors.website?.message}
            {...register('website')}
          />
        </FieldGrid>
      </FormSection>

      <FormSection
        title="Registered address"
        description="Shown in the document header alongside your contact details."
        icon={MapPin}
        onSubmit={handleSubmit(onSubmit)}
        saving={saving}
        dirty={isDirty}
      >
        <FieldGrid>
          <FieldSpan>
            <Input
              label="Address line 1"
              placeholder="46, Near Shiv Mandir, Kanadiya"
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
          <Input
            label="City"
            placeholder="Indore"
            error={errors.address?.city?.message}
            {...register('address.city')}
          />
          <Input
            label="State"
            placeholder="Madhya Pradesh"
            error={errors.address?.state?.message}
            {...register('address.state')}
          />
          <Input
            label="PIN code"
            placeholder="452016"
            error={errors.address?.pincode?.message}
            {...register('address.pincode')}
          />
          <Input
            label="Country"
            error={errors.address?.country?.message}
            {...register('address.country')}
          />
        </FieldGrid>
      </FormSection>

      <FormSection
        title="Tax identity"
        description="Optional. Include these only if you raise GST invoices."
        icon={Receipt}
        onSubmit={handleSubmit(onSubmit)}
        saving={saving}
        dirty={isDirty}
      >
        <FieldGrid columns={3}>
          <Input
            label="GSTIN"
            placeholder="23AAACD1234E1ZP"
            className="uppercase"
            error={errors.gstin?.message}
            {...register('gstin')}
          />
          <Input
            label="PAN"
            placeholder="AAACD1234E"
            className="uppercase"
            error={errors.pan?.message}
            {...register('pan')}
          />
          <Input
            label="Place of supply"
            placeholder="Indore, Madhya Pradesh"
            error={errors.placeOfSupply?.message}
            {...register('placeOfSupply')}
          />
        </FieldGrid>
      </FormSection>
    </div>
  );
};
