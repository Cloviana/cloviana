import { Loader2Icon } from 'lucide-react';

import { cn } from '@/utils/cn';

function Spinner({ className, ...props }: React.ComponentProps<'svg'>) {
  return (
    <Loader2Icon
      role="status"
      aria-label="Loading"
      strokeWidth={3.5}
      className={cn('size-4 animate-spin', className)}
      {...props}
    />
  );
}

export { Spinner };
