import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/utils/cn';

const inputVariants = cva(
  'file:text-foreground placeholder:text-muted-foreground selection:bg-primary text-sm selection:text-primary-foreground border-input w-full min-w-0 rounded-md border px-3 py-1 transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 focus-visible:bg-secondary/10 focus-visible:border-secondary focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:bg-destructive/5 aria-invalid:ring-destructive/20 aria-invalid:border-destructive',
  {
    variants: {
      variant: {
        default:
          'bg-white text-foreground border-input placeholder:text-foreground-lighter/70',
      },
      size: {
        default: 'h-8 focus-visible:ring-[3px]',
        sm: 'h-7 text-xs focus-visible:ring-[3px]',
        xs: 'h-6 text-xs focus-visible:ring-[3px]',
        lg: 'h-10 focus-visible:ring-[3.5px]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

type InputProps = Omit<React.ComponentProps<'input'>, 'size'> &
  VariantProps<typeof inputVariants>;

export function Input({
  className,
  type,
  variant,
  size,
  ...props
}: InputProps) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(inputVariants({ variant, size }), className)}
      {...props}
    />
  );
}
