import * as React from 'react';

import { cn } from '@/lib/utils';

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'border-line border-border-input bg-background-input text-text-default enabled:hover:bg-background-input-hovered enabled:active:bg-background-input-pressed enabled:hover:not-focus-visible:not-aria-invalid:border-border-input-hovered text-body-large placeholder:text-text-subtlest focus-visible:border-border-focused focus-visible:ring-border-focused/20 disabled:border-border-disabled disabled:bg-background-disabled disabled:text-text-disabled disabled:placeholder:text-text-disabled aria-invalid:border-border-danger aria-invalid:bg-background-danger aria-invalid:enabled:hover:bg-background-danger-hovered aria-invalid:enabled:active:bg-background-danger-pressed md:text-body flex field-sizing-content min-h-16 w-full rounded-md px-3 py-2 transition-colors outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed',
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
