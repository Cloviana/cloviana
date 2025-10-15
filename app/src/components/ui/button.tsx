import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/utils/cn';

const buttonVariants = cva(
  "focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium outline-none transition-all focus-visible:ring disabled:pointer-events-none disabled:opacity-50 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0 relative",
  {
    variants: {
      variant: {
        default:
          'border-primary/20 bg-linear-to-b from-primary/90 to-primary border shadow-xs text-white hover:opacity-85',
        'brand-secondary':
          'border-brand-secondary/20 bg-linear-to-b from-brand-secondary/90 to-brand-secondary border shadow-xs text-brand-secondary-foreground hover:opacity-85',
        outline: 'shadow-xs border bg-background hover:bg-[#ebeaea]',
        ghost: 'bg-background/30 backdrop-blur hover:bg-[#ebeaea]',
      },
      size: {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        sm: 'h-8 gap-1.5 px-3 has-[>svg]:px-2.5',
        xs: 'h-6 gap-1.5 px-2 has-[>svg]:px-2 text-xs font-normal',
        lg: 'h-10 px-6 has-[>svg]:px-4',
        icon: 'size-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

function Button({
  className,
  variant,
  size,
  loading = false,
  asChild = false,
  children,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    loading?: boolean;
  }) {
  const Comp = asChild ? Slot : 'button';

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      <span className={cn('transition-opacity', loading && 'opacity-0')}>
        {children}
      </span>
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center text-current">
          <span
            className={cn(
              'loading loading-spinner',
              size === 'xs' ? 'loading-xs' : 'loading-sm',
            )}
          />
        </span>
      )}
    </Comp>
  );
}

export { Button, buttonVariants };
