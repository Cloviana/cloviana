'use client';

import { Toggle as TogglePrimitive } from '@base-ui/react/toggle';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const toggleVariants = cva(
  "group/toggle inline-flex items-center justify-center gap-1 rounded-md text-body font-medium text-text-default whitespace-nowrap transition-all outline-none enabled:hover:bg-background-neutral-subtle-hovered enabled:active:bg-background-neutral-subtle-pressed focus-visible:border-border-focused focus-visible:ring-(length:--ds-border-width-focused) focus-visible:ring-border-focused disabled:pointer-events-none disabled:text-text-disabled aria-invalid:border-border-danger  aria-pressed:bg-background-selected aria-pressed:text-text-selected aria-pressed:disabled:bg-background-disabled aria-pressed:disabled:text-text-disabled aria-pressed:enabled:hover:bg-background-selected-hovered aria-pressed:enabled:active:bg-background-selected-pressed data-[state=on]:bg-background-selected data-[state=on]:text-text-selected data-[state=on]:disabled:bg-background-disabled data-[state=on]:disabled:text-text-disabled data-[state=on]:enabled:hover:bg-background-selected-hovered data-[state=on]:enabled:active:bg-background-selected-pressed [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: 'bg-transparent',
        outline:
          'border-line border-border-default bg-background-neutral-subtle enabled:hover:bg-background-neutral-subtle-hovered enabled:active:bg-background-neutral-subtle-pressed aria-pressed:border-border-selected data-[state=on]:border-border-selected aria-pressed:focus-visible:not-aria-invalid:border-border-focused data-[state=on]:focus-visible:not-aria-invalid:border-border-focused aria-invalid:aria-pressed:border-border-danger aria-invalid:data-[state=on]:border-border-danger disabled:border-border-disabled disabled:bg-background-disabled aria-pressed:disabled:border-border-disabled data-[state=on]:disabled:border-border-disabled',
      },
      size: {
        default:
          'h-8 min-w-8 px-3 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2',
        sm: "h-8 min-w-8 rounded-sm px-3 text-body has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-4",
        lg: 'h-10 min-w-10 px-3 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

function Toggle({
  className,
  variant = 'default',
  size = 'default',
  ...props
}: TogglePrimitive.Props & VariantProps<typeof toggleVariants>) {
  return (
    <TogglePrimitive
      data-slot="toggle"
      className={cn(toggleVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Toggle, toggleVariants };
