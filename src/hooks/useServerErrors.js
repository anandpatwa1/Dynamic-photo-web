import { useEffect } from 'react';

/**
 * Projects server-side field errors (`[{ field, message }]`) onto a React Hook
 * Form instance, so backend validation surfaces on the exact input that failed
 * rather than only in a toast.
 */
export const useServerErrors = (fieldErrors, setError) => {
  useEffect(() => {
    if (!fieldErrors?.length) return;

    fieldErrors.forEach(({ field, message }) => {
      if (field) setError(field, { type: 'server', message });
    });
  }, [fieldErrors, setError]);
};
