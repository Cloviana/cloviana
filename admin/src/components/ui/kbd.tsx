import { cn } from '@/lib/utils';

function Kbd({ className, ...props }: React.ComponentProps<'kbd'>) {
  return (
    <kbd
      data-slot="kbd"
      className={cn(
        'bg-background-accent-gray-subtlest text-text-subtle text-body-small pointer-events-none inline-flex h-5 w-fit min-w-5 items-center justify-center gap-1 rounded-xs px-1 font-sans font-medium select-none',
        "[&_svg:not([class*='size-'])]:size-3",
        '[[data-slot=tooltip-content]_&]:bg-background-inverse-subtle [[data-slot=tooltip-content]_&]:text-text-inverse',
        className,
      )}
      {...props}
    />
  );
}

function KbdGroup({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <kbd
      data-slot="kbd-group"
      className={cn('inline-flex items-center gap-1', className)}
      {...props}
    />
  );
}

export { Kbd, KbdGroup };
