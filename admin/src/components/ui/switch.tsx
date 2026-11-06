'use client';

import { Switch as SwitchPrimitive } from '@base-ui/react/switch';

import { cn } from '@/lib/utils';

function Switch({
  className,
  size = 'default',
  ...props
}: SwitchPrimitive.Root.Props & {
  size?: 'sm' | 'default';
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(
        'peer group/switch bg-background-neutral-bold not-data-disabled:hover:bg-background-neutral-bold-hovered not-data-disabled:active:bg-background-neutral-bold-pressed data-checked:bg-background-success-bold data-checked:not-data-disabled:hover:bg-background-success-bold-hovered data-checked:not-data-disabled:active:bg-background-success-bold-pressed data-disabled:bg-background-disabled data-disabled:data-checked:bg-background-disabled focus-visible:ring-border-focused aria-invalid:ring-border-danger relative inline-flex shrink-0 items-center rounded-full p-0.5 transition-colors outline-none group-has-[:focus-visible]/field-label:ring-0 after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:ring-(length:--ds-border-width-focused) aria-invalid:ring-(length:--ds-border-width-focused) data-disabled:cursor-not-allowed data-[size=default]:h-5 data-[size=default]:w-9 data-[size=sm]:h-4 data-[size=sm]:w-7',
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="bg-icon-inverse group-data-disabled/switch:bg-icon-disabled pointer-events-none block rounded-full transition-[translate] group-data-[size=default]/switch:size-4 group-data-[size=sm]/switch:size-3 group-data-[size=default]/switch:data-checked:translate-x-4 group-data-[size=sm]/switch:data-checked:translate-x-3"
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
