'use client';

import * as ProgressPrimitive from '@radix-ui/react-progress';
import * as React from 'react';

import { cn } from '@/lib/utils';

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, max = 100, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    value={value}
    max={max}
    className={cn(
      'bg-background-neutral relative h-2 w-full overflow-hidden rounded-full',
      className,
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className="bg-background-information-bold h-full w-full flex-1 transition-all"
      style={{ transform: `translateX(-${100 - ((value ?? 0) / max) * 100}%)` }}
    />
  </ProgressPrimitive.Root>
));
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
