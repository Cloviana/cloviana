'use client';

import { Button as ButtonPrimitive } from '@base-ui/react/button';
import { cva, type VariantProps } from 'class-variance-authority';

import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-md border-line border-transparent bg-clip-padding text-body font-medium text-text-default whitespace-nowrap transition-all outline-none select-none focus-visible:border-border-focused focus-visible:ring-(length:--ds-border-width-focused) focus-visible:ring-border-focused disabled:pointer-events-none disabled:text-text-disabled aria-invalid:border-border-danger   [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          'bg-background-brand-bold text-text-default enabled:hover:bg-background-brand-bold-hovered enabled:active:bg-background-brand-bold-pressed',
        outline:
          'border-border-button bg-surface enabled:hover:bg-surface-hovered enabled:active:bg-surface-pressed enabled:aria-expanded:bg-surface-pressed disabled:border-border-disabled',
        secondary:
          'bg-background-neutral text-text-default enabled:hover:bg-background-neutral-hovered enabled:active:bg-background-neutral-pressed enabled:aria-expanded:bg-background-neutral-pressed',
        ghost:
          'bg-background-neutral-subtle enabled:hover:bg-background-neutral-subtle-hovered enabled:active:bg-background-neutral-subtle-pressed enabled:aria-expanded:not-in-[[data-slot=table-row]]:bg-background-neutral-subtle-pressed',
        destructive:
          'bg-background-danger-subtler text-text-danger enabled:hover:bg-background-danger-subtler-hovered enabled:active:bg-background-danger-subtler-pressed',
        'destructive-solid':
          'bg-background-danger-bold text-text-inverse enabled:hover:bg-background-danger-bold-hovered enabled:active:bg-background-danger-bold-pressed',
        // Buttons that sit on top of imagery: a light surface, and the same without a background.
        overlay:
          'bg-surface text-text-default enabled:hover:bg-surface-hovered enabled:active:bg-surface-pressed enabled:aria-expanded:bg-surface-pressed',
        'overlay-ghost':
          'bg-transparent text-text-inverse enabled:hover:bg-background-inverse-subtle-hovered enabled:active:bg-background-inverse-subtle-pressed enabled:aria-expanded:bg-background-inverse-subtle-pressed',
        link: 'text-link-default enabled:hover:underline enabled:active:text-link-pressed',
      },
      size: {
        default:
          'h-8 gap-1.5 px-3 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2',
        xs: "h-6 gap-1 px-2 text-body in-data-[slot=button-group]:rounded-md has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1 px-3 text-body in-data-[slot=button-group]:rounded-md has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-4",
        lg: 'h-10 gap-1.5 px-3 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2',
        // An action inside a sentence: no height or padding, and the surrounding text's size, weight and line height.
        inline: 'h-auto gap-1 p-0 text-[length:inherit] font-[weight:inherit]',
        icon: 'size-8',
        'icon-xs':
          "size-6 in-data-[slot=button-group]:rounded-md [&_svg:not([class*='size-'])]:size-3",
        'icon-sm': 'size-8 in-data-[slot=button-group]:rounded-md',
        'icon-lg': 'size-10',
      },
    },
    compoundVariants: [
      {
        variant: [
          'default',
          'outline',
          'secondary',
          'destructive',
          'destructive-solid',
          'overlay',
        ],
        className: 'disabled:bg-background-disabled',
      },
      {
        variant: ['ghost', 'overlay-ghost', 'link'],
        className: 'disabled:bg-transparent',
      },
    ],
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export type ButtonProps = ButtonPrimitive.Props &
  VariantProps<typeof buttonVariants> & {
    loading?: boolean;
  };

function Button({
  className,
  variant = 'default',
  size = 'default',
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <ButtonPrimitive
      data-slot="button"
      aria-busy={loading || undefined}
      disabled={disabled || loading}
      className={(state) =>
        cn(
          buttonVariants({ variant, size }),
          loading && 'relative',
          typeof className === 'function' ? className(state) : className,
        )
      }
      {...props}
    >
      {loading ? (
        <>
          <span className="invisible inline-flex items-center justify-center gap-[inherit]">
            {children}
          </span>
          <span className="absolute inset-0 flex items-center justify-center">
            <Spinner className="size-4 text-current" />
          </span>
        </>
      ) : (
        children
      )}
    </ButtonPrimitive>
  );
}

export { Button, buttonVariants };
