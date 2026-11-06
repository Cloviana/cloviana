import { Loader2Icon, LoaderIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

type SpinnerProps = React.ComponentProps<'svg'> & {
  variant?: 'spokes' | 'ring';
};

function Spinner({ className, variant = 'ring', ...props }: SpinnerProps) {
  const Icon = variant === 'spokes' ? LoaderIcon : Loader2Icon;

  return (
    <Icon
      role="status"
      aria-label="Loading"
      strokeWidth={2.4}
      className={cn(
        'text-icon-default size-4 animate-spin in-data-[slot=button]:text-current',
        className,
      )}
      {...props}
    />
  );
}

export { Spinner };
