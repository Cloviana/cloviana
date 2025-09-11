import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/utils/cn';

const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          'border border-primary/20 bg-gradient-to-b from-primary/90 to-primary text-white hover:opacity-85 shadow-xs',
        outline: 'bg-[#fefbf9] border shadow-xs hover:bg-[#ebeaea]',
        ghost: 'hover:bg-[#ebeaea]',
        green:
          'border border-[#3ab07f]/20 bg-gradient-to-b from-[#3ab07f]/90 to-[#3ab07f] text-white hover:opacity-85 shadow-xs',
        purple:
          'border border-[#a875b5]/20 bg-gradient-to-b from-[#a875b5]/90 to-[#a875b5] text-white hover:opacity-85 shadow-xs',
        blue: 'border border-[#4a8bac]/20 bg-gradient-to-b from-[#4a8bac]/90 to-[#4a8bac] text-white hover:opacity-85 shadow-xs',
        red: 'border border-[#a94444]/20 bg-gradient-to-b from-[#a94444]/90 to-[#a94444] text-white hover:opacity-85 shadow-xs',
      },
      size: {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        sm: 'h-8 gap-1.5 px-3 has-[>svg]:px-2.5',
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
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : 'button';

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
