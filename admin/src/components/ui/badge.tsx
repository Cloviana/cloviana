import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'group/badge inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-sm border-line border-transparent px-2 text-body-small font-medium whitespace-nowrap transition-all focus-visible:border-border-focused focus-visible:ring-(length:--ds-border-width-focused) focus-visible:ring-border-focused has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-border-danger  [&>svg]:pointer-events-none [&>svg]:size-3!',
  {
    variants: {
      variant: {
        default:
          'bg-background-neutral-bold text-text-inverse [&:is(a,button)]:hover:bg-background-neutral-bold-hovered [&:is(a,button)]:active:bg-background-neutral-bold-pressed',
        muted:
          'border-border-accent-gray-subtle bg-background-accent-gray-subtlest text-text-accent-gray [&:is(a,button)]:hover:bg-background-accent-gray-subtlest-hovered [&:is(a,button)]:active:bg-background-accent-gray-subtlest-pressed',
        success:
          'border-border-success-subtle bg-background-success-subtler text-text-success-bolder [&:is(a,button)]:hover:bg-background-success-subtler-hovered [&:is(a,button)]:active:bg-background-success-subtler-pressed',
        warning:
          'border-border-warning-subtle bg-background-warning-subtler text-text-warning-bolder [&:is(a,button)]:hover:bg-background-warning-subtler-hovered [&:is(a,button)]:active:bg-background-warning-subtler-pressed',
        information:
          'border-border-information-subtle bg-background-information-subtler text-text-information-bolder [&:is(a,button)]:hover:bg-background-information-subtler-hovered [&:is(a,button)]:active:bg-background-information-subtler-pressed',
        danger:
          'border-border-danger-subtle bg-background-danger-subtler text-text-danger-bolder [&:is(a,button)]:hover:bg-background-danger-subtler-hovered [&:is(a,button)]:active:bg-background-danger-subtler-pressed',
        discovery:
          'border-border-discovery-subtle bg-background-discovery-subtler text-text-discovery-bolder [&:is(a,button)]:hover:bg-background-discovery-subtler-hovered [&:is(a,button)]:active:bg-background-discovery-subtler-pressed',
        outline:
          'border-border-default bg-background-neutral-subtle text-text-default [&:is(a,button)]:hover:bg-background-neutral-subtle-hovered [&:is(a,button)]:active:bg-background-neutral-subtle-pressed',
        ghost:
          'bg-background-neutral-subtle text-text-default [&:is(a,button)]:hover:bg-background-neutral-subtle-hovered [&:is(a,button)]:active:bg-background-neutral-subtle-pressed',
        link: 'text-link-default underline-offset-4 [&:is(a,button)]:hover:underline [&:is(a,button)]:active:text-link-pressed',
      },
      size: {
        default: 'h-5 py-0',
        lg: 'h-6 py-0.5',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

function Badge({
  className,
  variant = 'default',
  size = 'default',
  render,
  ...props
}: useRender.ComponentProps<'span'> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: 'span',
    props: mergeProps<'span'>(
      {
        className: cn(badgeVariants({ variant, size }), className),
      },
      props,
    ),
    render,
    state: {
      slot: 'badge',
      variant,
      size,
    },
  });
}

export { Badge, badgeVariants };
