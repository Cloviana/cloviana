import { Loader2Icon, LoaderIcon } from 'lucide-react';

import { cn } from '@/utils/cn';

type SpinnerProps = React.ComponentProps<'svg'> & {
  variant?: '1' | '2';
};

function Spinner({ className, variant = '2', ...props }: SpinnerProps) {
  const Icon = variant === '1' ? LoaderIcon : Loader2Icon;

  return (
    <Icon
      role="status"
      aria-label="Loading"
      strokeWidth={3.5}
      className={cn('size-4 animate-spin', className)}
      {...props}
    />
  );
}

export { Spinner };
