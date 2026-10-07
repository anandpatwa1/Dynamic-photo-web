import { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Camera, KeyRound, Lock, LogOut, ShieldCheck, User as UserIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

import { Avatar, Badge, Button, Input, PageHeader } from '@/components/ui';
import { FormSection, FieldGrid } from '@/components/forms/FormSection';
import { profileSchema, changePasswordSchema } from '@/validations/auth.schema';
import { updateProfile, updateAvatar, changePassword, logout } from '@/redux/auth/authSlice';
import { useAuth } from '@/hooks/useAuth';
import { useServerErrors } from '@/hooks/useServerErrors';
import { formatDateTime, humanize } from '@/utils/format';

export const Profile = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, loading, fieldErrors } = useAuth();
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const details = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name ?? '',
      phone: user?.phone ?? '',
      designation: user?.designation ?? '',
    },
  });

  const password = useForm({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  useServerErrors(fieldErrors, password.setError);

  useEffect(() => {
    if (user) {
      details.reset({
        name: user.name ?? '',
        phone: user.phone ?? '',
        designation: user.designation ?? '',
      });
    }
  }, [user, details]);

  const onSaveDetails = async (values) => {
    const result = await dispatch(updateProfile(values));
    if (updateProfile.fulfilled.match(result)) toast.success('Profile updated');
    else toast.error(result.payload?.message ?? 'Could not save your profile');
  };

  const onChangePassword = async (values) => {
    const result = await dispatch(changePassword(values));
    if (changePassword.fulfilled.match(result)) {
      toast.success('Password changed — your other sessions have been signed out');
      password.reset();
    } else {
      toast.error(result.payload?.message ?? 'Could not change your password');
    }
  };

  const onPickAvatar = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const result = await dispatch(updateAvatar(file));
    setUploading(false);

    if (updateAvatar.fulfilled.match(result)) toast.success('Photo updated');
    else toast.error(result.payload?.message ?? 'Could not upload the photo');

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const onSignOut = async () => {
    await dispatch(logout());
    toast.success('Signed out');
    navigate('/CRM/login', { replace: true });
  };

  return (
    <>
      <PageHeader title="Your profile" description="Your details, photo and password." />

      <div className="mx-auto max-w-3xl space-y-6">
        <FormSection title="Photo" description="Shown beside your name across the workspace." icon={Camera} as="div">
          <div className="flex flex-wrap items-center gap-5">
            <Avatar src={user?.avatar?.url} name={user?.name} size="2xl" rounded="xl" />

            <div className="min-w-0">
              <p className="text-md font-semibold text-ink-900">{user?.name}</p>
              <p className="text-sm text-ink-500">{user?.email}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge tone="brand">{humanize(user?.role)}</Badge>
                {user?.lastLoginAt && (
                  <span className="text-xs text-ink-400">
                    Last signed in {formatDateTime(user.lastLoginAt)}
                  </span>
                )}
              </div>

              <Button
                variant="secondary"
                size="sm"
                icon={Camera}
                loading={uploading}
                onClick={() => fileInputRef.current?.click()}
                className="mt-3.5"
              >
                Change photo
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                onChange={onPickAvatar}
              />
            </div>
          </div>
        </FormSection>

        <FormSection
          title="Your details"
          description="How your name appears on documents you create."
          icon={UserIcon}
          onSubmit={details.handleSubmit(onSaveDetails)}
          saving={loading}
          dirty={details.formState.isDirty}
        >
          <FieldGrid>
            <Input
              label="Full name"
              required
              error={details.formState.errors.name?.message}
              {...details.register('name')}
            />
            <Input
              label="Phone"
              optional
              error={details.formState.errors.phone?.message}
              {...details.register('phone')}
            />
            <Input
              label="Designation"
              optional
              placeholder="Lead Photographer"
              error={details.formState.errors.designation?.message}
              {...details.register('designation')}
            />
            <Input label="Email" value={user?.email ?? ''} readOnly hint="Your email cannot be changed here" />
          </FieldGrid>
        </FormSection>

        <FormSection
          title="Password"
          description="Changing your password signs you out everywhere else."
          icon={KeyRound}
          onSubmit={password.handleSubmit(onChangePassword)}
          saving={loading}
          dirty={password.formState.isDirty}
          submitLabel="Change password"
        >
          <Input
            label="Current password"
            type="password"
            autoComplete="current-password"
            icon={Lock}
            error={password.formState.errors.currentPassword?.message}
            {...password.register('currentPassword')}
          />
          <FieldGrid>
            <Input
              label="New password"
              type="password"
              autoComplete="new-password"
              icon={Lock}
              hint="At least 8 characters, with upper, lower and a number"
              error={password.formState.errors.newPassword?.message}
              {...password.register('newPassword')}
            />
            <Input
              label="Confirm new password"
              type="password"
              autoComplete="new-password"
              icon={Lock}
              error={password.formState.errors.confirmPassword?.message}
              {...password.register('confirmPassword')}
            />
          </FieldGrid>
        </FormSection>

        <FormSection title="Session" description="Sign out of this device." icon={ShieldCheck} as="div">
          <Button variant="danger-soft" icon={LogOut} onClick={onSignOut}>
            Sign out
          </Button>
        </FormSection>
      </div>
    </>
  );
};

export default Profile;
