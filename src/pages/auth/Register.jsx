import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Eye, EyeOff, Lock, Mail, User } from 'lucide-react';
import toast from 'react-hot-toast';

import {
  Button,
  FormError,
  Input,
} from '@/components/ui';
import { registerUser } from '@/redux/auth/authSlice';
import { registerSchema, passwordStrength } from '@/validations/auth.schema';
import { useAuth } from '@/hooks/useAuth';
import { useServerErrors } from '@/hooks/useServerErrors';
import { cn } from '@/utils/cn';

const STRENGTH = [
  { label: 'Too weak', bar: 'bg-danger-500', text: 'text-danger-600' },
  { label: 'Weak', bar: 'bg-danger-500', text: 'text-danger-600' },
  { label: 'Fair', bar: 'bg-warning-500', text: 'text-warning-600' },
  { label: 'Good', bar: 'bg-info-500', text: 'text-info-600' },
  { label: 'Strong', bar: 'bg-success-500', text: 'text-success-600' },
];

const PasswordMeter = ({ value }) => {
  const score = passwordStrength(value);
  const meta = STRENGTH[score];

  if (!value) return null;

  return (
    <div className="mt-2">
      <div className="flex gap-1.5" aria-hidden="true">
        {[0, 1, 2, 3].map((index) => (
          <span
            key={index}
            className={cn(
              'h-1 flex-1 rounded-full transition-colors duration-300',
              index < score ? meta.bar : 'bg-ink-200',
            )}
          />
        ))}
      </div>
      <p className={cn('mt-1.5 text-xs font-medium', meta.text)}>Password strength: {meta.label}</p>
    </div>
  );
};

export const Register = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, fieldErrors } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  });

  useServerErrors(fieldErrors, setError);
  const password = useWatch({ control, name: 'password' });

  const onSubmit = async (values) => {
    const { confirmPassword, ...payload } = values;
    const result = await dispatch(registerUser(payload));

    if (registerUser.fulfilled.match(result)) {
      // The first account is created as Super Admin and signed in immediately.
      if (result.payload.accessToken) {
        toast.success('Studio account created');
        navigate('/CRM/dashboard', { replace: true });
      } else {
        toast.success('Account created — please sign in');
        navigate('/CRM/login', { replace: true });
      }
    }
  };

  return (
    <div className="animate-fade-up">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold text-ink-900">Create your account</h1>
        <p className="mt-2 text-md text-ink-500">
          The first account becomes the studio Super Admin with full access.
        </p>
      </header>

      <FormError error={error} className="mb-6" />

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <Input
          label="Full name"
          autoComplete="name"
          placeholder="Anand Patwa"
          icon={User}
          error={errors.name?.message}
          {...register('name')}
        />

        <Input
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="you@studio.com"
          icon={Mail}
          error={errors.email?.message}
          {...register('email')}
        />

        <div>
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="At least 8 characters"
            icon={Lock}
            error={errors.password?.message}
            trailing={
              <Button
                variant="ghost"
                size="sm"
                iconOnly
                icon={showPassword ? EyeOff : Eye}
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              />
            }
            {...register('password')}
          />
          {!errors.password && <PasswordMeter value={password} />}
        </div>

        <Input
          label="Confirm password"
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          placeholder="Re-enter your password"
          icon={Lock}
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <Button type="submit" size="lg" fullWidth loading={loading} iconRight={ArrowRight}>
          Create account
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-ink-500">
        Already have an account?{' '}
        <Link to="/CRM/login" className="font-medium text-brand-600 hover:text-brand-700">
          Sign in
        </Link>
      </p>
    </div>
  );
};

export default Register;
