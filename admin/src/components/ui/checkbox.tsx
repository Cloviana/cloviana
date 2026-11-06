'use client';

import { Checkbox as CheckboxPrimitive } from '@base-ui/react/checkbox';
import { CheckIcon, MinusIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

function Checkbox({
  className,
  indeterminate,
  ...props
}: CheckboxPrimitive.Root.Props) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      indeterminate={indeterminate}
      className={cn(
        'peer border-line border-border-input bg-background-input text-icon-default not-data-checked:not-data-indeterminate:not-data-disabled:hover:bg-background-input-hovered group-has-[:focus-visible]/field-label:not-data-checked:border-border-input focus-visible:border-border-focused focus-visible:ring-border-focused data-disabled:border-border-disabled data-disabled:bg-background-disabled data-disabled:text-icon-disabled aria-invalid:border-border-danger aria-invalid:data-checked:border-border-danger aria-invalid:data-indeterminate:border-border-danger data-checked:focus-visible:not-aria-invalid:border-border-focused data-checked:border-border-selected data-checked:bg-background-selected-bold data-checked:text-icon-inverse data-checked:not-data-disabled:hover:bg-background-selected-bold-hovered data-checked:not-data-disabled:active:bg-background-selected-bold-pressed data-checked:data-disabled:border-border-disabled data-checked:data-disabled:bg-background-disabled data-checked:data-disabled:text-icon-disabled data-indeterminate:focus-visible:not-aria-invalid:border-border-focused data-indeterminate:border-border-selected data-indeterminate:bg-background-selected-bold data-indeterminate:text-icon-inverse data-indeterminate:not-data-disabled:hover:bg-background-selected-bold-hovered data-indeterminate:not-data-disabled:active:bg-background-selected-bold-pressed data-indeterminate:data-disabled:border-border-disabled data-indeterminate:data-disabled:bg-background-disabled data-indeterminate:data-disabled:text-icon-disabled group-has-[:focus-visible]/field-label:data-checked:not-aria-invalid:border-border-selected relative flex size-4 shrink-0 items-center justify-center rounded-sm transition-colors outline-none group-has-[:focus-visible]/field-label:ring-0 after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:ring-(length:--ds-border-width-focused) data-disabled:cursor-not-allowed',
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current transition-none [&>svg]:size-4"
      >
        {indeterminate ? <MinusIcon /> : <CheckIcon />}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
