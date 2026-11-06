'use client';

import * as SliderPrimitive from '@radix-ui/react-slider';
import * as React from 'react';

import { cn } from '@/lib/utils';

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      'relative flex w-full touch-none items-center select-none',
      className,
    )}
    {...props}
  >
    <SliderPrimitive.Track className="bg-background-neutral relative h-1.5 w-full grow overflow-hidden rounded-full">
      <SliderPrimitive.Range className="bg-background-selected-bold absolute h-full" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="border-border-input bg-background-input enabled:hover:bg-background-input-hovered enabled:active:bg-background-input-pressed focus-visible:ring-border-focused disabled:border-border-disabled disabled:bg-background-disabled block h-4 w-4 rounded-full border transition-colors focus-visible:ring-(length:--ds-border-width-focused) focus-visible:outline-none disabled:pointer-events-none" />
  </SliderPrimitive.Root>
));
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
