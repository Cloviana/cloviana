import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/utils/cn';

const textareaVariants = cva(
  'placeholder:text-muted-foreground text-[13px] border-input flex min-h-[80px] w-full min-w-0 resize-none rounded-md border px-3 py-2 transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 focus-visible:border-ring focus-visible:ring-ring/30 focus-visible:ring-[3px] aria-invalid:bg-destructive/5 aria-invalid:ring-destructive/20 aria-invalid:border-destructive',
  {
    variants: {
      variant: {
        default:
          'bg-control text-foreground border-input placeholder:text-foreground-lighter/70',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

type TextareaProps = React.ComponentProps<'textarea'> &
  VariantProps<typeof textareaVariants>;

function Textarea({ className, variant, ...props }: TextareaProps) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(textareaVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Textarea };
