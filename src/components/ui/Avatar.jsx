import { useState } from 'react';
import { cn } from '@/utils/cn';
import { initials as toInitials } from '@/utils/format';

const SIZES = {
  xs: 'h-6 w-6 text-2xs',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
  '2xl': 'h-24 w-24 text-2xl',
};

/**
 * Falls back to initials on a deterministic tint when no image is available
 * or the image fails to load.
 */
export const Avatar = ({ src, name = '', size = 'md', className, rounded = 'full' }) => {
  const [failed, setFailed] = useState(false);
  const showImage = src && !failed;

  return (
    <span
      className={cn(
        'inline-flex shrink-0 select-none items-center justify-center overflow-hidden bg-gradient-to-br from-brand-100 to-brand-200/70 font-semibold text-brand-800 ring-1 ring-inset ring-brand-300/40',
        rounded === 'full' ? 'rounded-full' : 'rounded-xl',
        SIZES[size],
        className,
      )}
      aria-hidden={!name || undefined}
      title={name || undefined}
    >
      {showImage ? (
        <img
          src={src}
          alt={name}
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        toInitials(name)
      )}
    </span>
  );
};
