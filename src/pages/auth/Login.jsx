import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

import {
  Button,
  FormError,
  Input,
} from '@/components/ui';
import { login, clearAuthError } from '@/redux/auth/authSlice';
import { loginSchema } from '@/validations/auth.schema';
import { useAuth } from '@/hooks/useAuth';
import { useServerErrors } from '@/hooks/useServerErrors';
import { safeRedirect } from '@/utils/safeRedirect';

export const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { loading, error, fieldErrors } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', rememberMe: true },
  });

  useServerErrors(fieldErrors, setError);

  // Clear any stale error when arriving on the page.
  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  const onSubmit = async (values) => {
    const result = await dispatch(login(values));
    if (login.fulfilled.match(result)) {
      toast.success(`Welcome back, ${result.payload.user.name.split(' ')[0]}`);
      navigate(safeRedirect(location.state?.from), { replace: true });
    }
  };

  return (
    <div className="animate-fade-up">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold text-ink-900">Sign in</h1>
        <p className="mt-2 text-md text-ink-500">
          Welcome back. Enter your details to open the studio desk.
        </p>
      </header>

      <FormError error={error} className="mb-6" />

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <Input
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="you@studio.com"
          icon={Mail}
          error={errors.email?.message}
          {...register('email')}
        />

        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          placeholder="••••••••"
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

        <label className="flex cursor-pointer select-none items-center gap-2.5">
          <input
            type="checkbox"
            className="h-4 w-4 cursor-pointer rounded border-ink-300 text-brand-500 focus:ring-brand-500/40"
            {...register('rememberMe')}
          />
          <span className="text-sm text-ink-600">Keep me signed in</span>
        </label>

        <Button type="submit" size="lg" fullWidth loading={loading} iconRight={ArrowRight}>
          Sign in
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-ink-500">
        First time here?{' '}
        <Link to="/CRM/register" className="font-medium text-brand-600 hover:text-brand-700">
          Create the studio account
        </Link>
      </p>
    </div>
  );
};

export default Login;
