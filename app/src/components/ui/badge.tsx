import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/utils/cn';

const badgeVariants = cva(
  'inline-flex cursor-default items-center justify-center border font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        // Like success/warning: `-surface` and `-surface-foreground` are their
        // own tokens, not reused from `--primary`/`--primary-foreground` (those
        // stay pinned for solid `bg-primary` buttons). Dark mode's foreground
        // is deliberately lower-chroma than `--primary` itself — reusing the
        // brand color's full saturation as small pill text read as neon.
        primary:
          'border-transparent bg-primary-surface text-primary-surface-foreground',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        muted: 'border-transparent bg-muted text-muted-foreground',
        destructive:
          'border-transparent bg-destructive-foreground text-destructive dark:bg-destructive dark:text-destructive-foreground',
        // These two tint from `-surface`, not `-foreground`. Their `-foreground`
        // token is a text colour here, so using it as a background gave dark-on-
        // dark in light mode and, in dark mode, a fill identical to its own text.
        // Like `muted`, the surface pair already reads in both themes unaided.
        success:
          'border-transparent bg-success-surface text-success-foreground',
        warning:
          'border-transparent bg-warning-surface text-warning-foreground',
        outline: 'border-border bg-transparent text-foreground',
      },
      size: {
        xs: 'h-4 min-w-4 rounded-lg px-1 text-[10px]',
        sm: 'h-5 min-w-5 rounded-md px-1.5 text-[11px]',
        default: 'h-6 min-w-6 rounded-lg px-2.5 text-xs',
        lg: 'h-7 min-w-7 rounded-lg px-3 text-sm',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  },
);

export interface BadgeProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
