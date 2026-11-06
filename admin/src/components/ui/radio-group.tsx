'use client';

import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import { Circle } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib/utils';

const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Root
      className={cn('grid gap-2', className)}
      {...props}
      ref={ref}
    />
  );
});
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName;

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(
        'border-border-input bg-background-input text-text-default enabled:hover:bg-background-input-hovered enabled:active:bg-background-input-pressed data-[state=checked]:border-border-selected data-[state=checked]:bg-background-selected-bold data-[state=checked]:text-text-inverse data-[state=checked]:enabled:hover:bg-background-selected-bold-hovered data-[state=checked]:enabled:active:bg-background-selected-bold-pressed focus-visible:ring-border-focused disabled:border-border-disabled disabled:bg-background-disabled disabled:text-text-disabled aspect-square h-4 w-4 rounded-full border outline-none focus-visible:ring-(length:--ds-border-width-focused) disabled:cursor-not-allowed',
        className,
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
        <Circle className="h-2 w-2 fill-current stroke-none" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );
});
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName;

export { RadioGroup, RadioGroupItem };
