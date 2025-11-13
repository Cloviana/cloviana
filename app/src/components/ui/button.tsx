import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/utils/cn';

const buttonVariants = cva(
  "focus-visible:border-ring transition-opacity focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive inline-flex shrink-0 cursor-pointer items-center justify-center gap-1 whitespace-nowrap rounded-md font-medium outline-none transition-all focus-visible:ring disabled:pointer-events-none disabled:opacity-50 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0 relative",
  {
    variants: {
      variant: {
        primary: 'bg-primary text-white hover:opacity-90',
        secondary: 'bg-secondary text-white hover:opacity-90',
        outline: 'border bg-background hover:bg-[#ebeaea]',
        dashed: 'border border-dashed bg-background hover:bg-[#ebeaea]',
        ghost: 'bg-background/30 backdrop-blur hover:bg-[#ebeaea]',
        link: 'text-secondary hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3 text-sm',
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

function Button({
  className,
  variant,
  size,
  asChild = false,
  children,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    loading?: boolean;
  }) {
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
      {...props}
    >
      {children}

      {/*loading && (
        <span className="absolute inset-0 flex items-center justify-center text-current">
          <span
            className={cn(
              'loading loading-spinner',
              size === 'xs' || size === 'sm' ? 'loading-xs' : 'loading-sm',
            )}
          />
        </span>
      )*/}
    </button>
  );
}

export { Button, buttonVariants };
