import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Landmark, Smartphone } from 'lucide-react';
import toast from 'react-hot-toast';

import { Input } from '@/components/ui';
import { FormSection, FieldGrid } from '@/components/forms/FormSection';
import {bankSchema} from '@/validations/settings.schema';
import { keepCleared } from '@/utils/pruneEmpty';
import { saveSettings } from '@/redux/setting/settingsSlice';

const toDefaults = (bank = {}) => ({
  accountName: bank.accountName ?? '',
  accountNumber: bank.accountNumber ?? '',
  ifsc: bank.ifsc ?? '',
  bankName: bank.bankName ?? '',
  branch: bank.branch ?? '',
  upiId: bank.upiId ?? '',
  upiName: bank.upiName ?? '',
});

export const BankingTab = ({ settings, saving }) => {
  const dispatch = useDispatch();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(bankSchema),
    defaultValues: toDefaults(settings?.bank),
  });

  useEffect(() => {
    if (settings?.bank) reset(toDefaults(settings.bank));
  }, [settings?.bank, reset]);

  const onSubmit = async (values) => {
    const result = await dispatch(saveSettings({ bank: keepCleared(values) }));
    if (saveSettings.fulfilled.match(result)) toast.success('Bank details saved');
  };

  return (
    <div className="space-y-6">
      <FormSection
        title="Bank account"
        description="Printed on invoices so clients know exactly where to pay."
        icon={Landmark}
        onSubmit={handleSubmit(onSubmit)}
        saving={saving}
        dirty={isDirty}
      >
        <FieldGrid>
          <Input
            label="Account holder name"
            placeholder="Dynamic Production"
            error={errors.accountName?.message}
            {...register('accountName')}
          />
          <Input
            label="Account number"
            placeholder="00000000000000"
            className="tabular"
            error={errors.accountNumber?.message}
            {...register('accountNumber')}
          />
          <Input
            label="IFSC code"
            placeholder="HDFC0001234"
            className="uppercase"
            error={errors.ifsc?.message}
            {...register('ifsc')}
          />
          <Input
            label="Bank name"
            placeholder="HDFC Bank"
            error={errors.bankName?.message}
            {...register('bankName')}
          />
          <Input
            label="Branch"
            placeholder="Vijay Nagar, Indore"
            optional
            error={errors.branch?.message}
            {...register('branch')}
          />
        </FieldGrid>
      </FormSection>

      <FormSection
        title="UPI"
        description="Pair this with a payment QR under Branding for instant settlements."
        icon={Smartphone}
        onSubmit={handleSubmit(onSubmit)}
        saving={saving}
        dirty={isDirty}
      >
        <FieldGrid>
          <Input
            label="UPI ID"
            placeholder="dynamicproduction@upi"
            error={errors.upiId?.message}
            {...register('upiId')}
          />
          <Input
            label="UPI display name"
            placeholder="Dynamic Production"
            optional
            error={errors.upiName?.message}
            {...register('upiName')}
          />
        </FieldGrid>
      </FormSection>
    </div>
  );
};
