import { FC, HTMLAttributes } from 'react';

import { GIcon } from '@/components/icons';
import { cn } from '@/utils/cn';

type Status = 'complete' | 'current' | 'upcoming';

interface StepItemProps extends HTMLAttributes<HTMLDivElement> {
  status?: Status;
}

export const StepItem: FC<StepItemProps> = ({
  status = 'upcoming',
  children,
  ...props
}) => (
  <div
    {...props}
    className={cn(
      'shadow-xs flex w-full cursor-pointer items-center gap-3 rounded-md border border-gray-200 px-4 py-2 transition-colors',
      status === 'current'
        ? 'border-sky-500 bg-gray-50'
        : 'bg-gray-50 hover:bg-gray-100',
      status === 'upcoming' && 'pointer-events-none',
    )}
  >
    <div
      className={cn(
        'flex size-3.5 items-center justify-center rounded-full',
        status === 'complete' ? 'bg-sky-600' : 'border bg-white',
      )}
    >
      {status === 'complete' && (
        <GIcon fill name="check" className="text-white" size={12} />
      )}
    </div>
    <span className="text-sm font-medium">{children}</span>
  </div>
);
