'use client';

import * as LabelPrimitive from '@radix-ui/react-label';
import * as React from 'react';

import { cn } from '@/lib/utils';

function Label({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        'text-body text-text-default group-data-[disabled=true]:text-text-disabled peer-disabled:text-text-disabled flex items-center gap-2 font-medium select-none group-data-[disabled=true]:pointer-events-none peer-disabled:cursor-not-allowed',
        className,
      )}
      {...props}
    />
  );
}

export { Label };
