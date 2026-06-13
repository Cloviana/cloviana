import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/utils/cn';

const badgeVariants = cva(
  'inline-flex cursor-default items-center rounded-lg font-medium border px-2.5 py-1 text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80',
        secondary: 'border-transparent bg-[#e5f4fe] text-blue-900',
        muted: 'border-transparent bg-muted text-muted-foreground',

        destructive:
          'border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80',
        success: 'border-transparent bg-green-500/10 text-green-700',
        sky: 'border-transparent bg-sky-100 text-sky-800 hover:bg-sky-100/80',
        warning: 'border-transparent bg-orange-500/10 text-orange-700',
        outline: 'text-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
