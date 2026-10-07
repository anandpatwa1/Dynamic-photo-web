import { Link } from 'react-router-dom';
import { ArrowLeft, Compass } from 'lucide-react';
import { Button } from '@/components/ui';

export const NotFound = () => (
  <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-6 text-center">
    <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-card">
      <Compass className="h-7 w-7 text-brand-500" aria-hidden="true" />
    </div>
    <p className="tabular text-sm font-semibold tracking-wider text-brand-600">404</p>
    <h1 className="mt-2 text-4xl font-semibold text-ink-900">This page doesn’t exist</h1>
    <p className="mt-3 max-w-sm text-balance text-md text-ink-500">
      The link may be outdated, or the record was removed.
    </p>
    <Button as={Link} to="/CRM/dashboard" icon={ArrowLeft} className="mt-8">
      Back to dashboard
    </Button>
  </div>
);

export default NotFound;
