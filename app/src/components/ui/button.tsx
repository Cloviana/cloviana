import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/utils/cn';

const buttonVariants = cva(
  "focus-visible:border-ring flex items-center gap-1.5 transition-opacity focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-md font-medium outline-none transition-colors focus-visible:ring disabled:pointer-events-none disabled:opacity-60 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0 relative",
  {
    variants: {
      variant: {
        primary: 'bg-primary text-white hover:opacity-90',
        secondary: 'bg-secondary text-white hover:opacity-90',
        outline: 'border bg-white hover:bg-accent',
        dashed: 'border border-dashed bg-background hover:bg-accent',
        ghost: 'bg-background/30 backdrop-blur hover:bg-accent',
        link: 'text-secondary hover:underline',
      },
      size: {
        default: 'h-8 px-4 py-2 has-[>svg]:px-3 text-sm',
        sm: 'h-7 text-xs px-3 has-[>svg]:px-2.5',
        xs: 'h-6 px-2 has-[>svg]:px-2 text-xs',
        lg: 'h-10 px-6 has-[>svg]:px-4 text-sm',
        icon: 'size-9',
        'icon-sm': 'size-7',
        'icon-lg': 'size-10',
      },
    },
  },
);

export type ButtonProps = React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    loading?: boolean;
  };

function Button({
  className,
  variant,
  size,
  asChild = false,
  loading,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : 'button';

  if (asChild) {
    return (
      <Comp
        data-slot="button"
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      >
        {children}
      </Comp>
    );
  }

  return (
    <button
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <Spinner
          strokeWidth={3.5}
          className={
            ['xs', 'sm', 'default'].includes(size as string)
              ? 'size-3.5'
              : 'size-4'
          }
        />
      )}
      {children}
    </button>
  );
}

export { Button, buttonVariants };
