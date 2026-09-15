import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/utils/cn';

export const inputVariants = cva(
  'file:text-foreground placeholder:text-muted-foreground text-[13px] border-input w-full min-w-0 rounded-lg border px-3 py-1 transition-[color,box-shadow] outline-none file:inline-flex file:h-[30px] file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 focus-visible:border-ring focus-visible:ring-ring/30 focus-visible:ring-[3px] aria-invalid:bg-destructive/5 aria-invalid:ring-destructive/20 aria-invalid:border-destructive',
  {
    variants: {
      variant: {
        default:
          'bg-control text-foreground border-input placeholder:text-foreground-lighter/70',
      },
      size: {
        default: 'h-8 focus-visible:ring-[3px]',
        sm: 'h-[30px] focus-visible:ring-[3px]',
        xs: 'h-6 focus-visible:ring-[3px]',
        lg: 'h-9 focus-visible:ring-[3.5px]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export type InputProps = Omit<React.ComponentProps<'input'>, 'size'> &
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
