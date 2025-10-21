import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/utils/cn';

const textareaVariants = cva(
  'border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive flex min-h-16 w-full rounded-md border px-3 py-2 text-base resize-none transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
  {
    variants: {
      variant: {
        default: 'dark:bg-input/30 bg-transparent',
        white:
          'bg-white text-foreground border-input placeholder:text-foreground-lighter/70',
      },
      size: {
        default: '',
        sm: 'py-1 text-sm',
        lg: 'py-3 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

type TextareaProps = Omit<React.ComponentProps<'textarea'>, 'size'> &
  VariantProps<typeof textareaVariants>;

function Textarea({ className, variant, size, ...props }: TextareaProps) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(textareaVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Textarea };
