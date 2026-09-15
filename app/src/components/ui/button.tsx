import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/utils/cn';

const buttonVariants = cva(
  "focus-visible:border-ring transition-opacity focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-md font-medium outline-none transition-colors focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-60 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0 relative",
  {
    variants: {
      variant: {
        primary:
          'bg-primary text-primary-foreground hover:opacity-90 disabled:bg-muted-foreground/15 disabled:text-muted-foreground disabled:opacity-100',
        secondary:
          'bg-secondary text-secondary-foreground hover:opacity-90 disabled:bg-muted disabled:text-muted-foreground disabled:opacity-100',
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:bg-muted-foreground/15 disabled:text-muted-foreground disabled:opacity-100',
        outline: 'border border-input bg-control hover:bg-accent',
        dashed: 'border border-input border-dashed bg-control hover:bg-accent',
        ghost: 'bg-transparent backdrop-blur hover:bg-accent',
        link: 'underline hover:text-secondary opacity-80 hover:opacity-100 [font-weight:inherit]',
      },
      size: {
        default: 'h-8 px-4 py-2 has-[>svg]:px-3 text-sm',
        sm: 'h-[30px] text-xs px-3 has-[>svg]:px-2',
        xs: 'h-6 px-2 has-[>svg]:px-2 text-xs',
        lg: 'h-10 px-6 has-[>svg]:px-4 text-sm',
        icon: 'size-8',
        'icon-sm': 'size-[30px]',
        'icon-xs': 'size-6',
        'icon-lg': 'size-10',
      },
    },
    compoundVariants: [
      {
        variant: ['outline', 'dashed', 'ghost', 'link'],
        size: ['icon', 'icon-sm', 'icon-lg'],
        className: 'text-foreground-light',
      },
    ],
  },
);

export type ButtonProps = React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    loading?: boolean;
  };

function Button({
  className,
  variant,
  size,
  asChild = false,
  loading,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : 'button';
  const resolvedVariant = variant ?? 'primary';
  const resolvedSize =
    resolvedVariant === 'link' ? undefined : (size ?? 'default');
  const buttonClassName = cn(
    buttonVariants({ variant: resolvedVariant, size: resolvedSize }),
    className,
  );

  if (asChild) {
    return (
      <Comp data-slot="button" className={buttonClassName} {...props}>
        {children}
      </Comp>
    );
  }

  return (
    <button
      data-slot="button"
      className={cn(
        buttonClassName,
        loading && '!text-transparent',
        loading && '[&>*:not(.absolute)]:invisible',
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <div
          className={cn(
            'absolute inset-0 z-10 flex items-center justify-center',
            resolvedVariant === 'primary' ||
              resolvedVariant === 'secondary' ||
              resolvedVariant === 'destructive'
              ? 'text-muted-foreground'
              : 'text-foreground',
          )}
        >
          <Spinner
            strokeWidth={3.3}
            className={
              ['xs', 'sm', 'default'].includes(resolvedSize as string)
                ? 'size-3.5'
                : 'size-4'
            }
          />
        </div>
      )}
      {children}
    </button>
  );
}

export { Button, buttonVariants };
