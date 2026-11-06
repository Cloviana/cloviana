import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils';

const headingVariants = cva('text-text-default', {
  variants: {
    variant: {
      page: 'text-heading-medium',
      section: 'text-heading-small',
      dialog: 'text-heading-medium',
      compact: 'text-heading-xsmall',
    },
  },
  defaultVariants: {
    variant: 'section',
  },
});

type HeadingProps = ComponentProps<'h2'> &
  VariantProps<typeof headingVariants> & {
    as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  };

function Heading({
  as: Component = 'h2',
  className,
  variant,
  ...props
}: HeadingProps) {
  return (
    <Component
      data-slot="heading"
      className={cn(headingVariants({ variant }), className)}
      {...props}
    />
  );
}

const textVariants = cva('font-normal', {
  variants: {
    variant: {
      body: 'text-body  text-text-default',
      label: 'text-body  font-medium text-text-default',
      description: 'text-body  text-text-subtle',
      muted: 'text-body  text-text-subtlest',
      caption: 'text-body-small  text-text-subtlest',
    },
  },
  defaultVariants: {
    variant: 'body',
  },
});

type TextProps = ComponentProps<'p'> &
  VariantProps<typeof textVariants> & {
    as?: 'p' | 'span' | 'div';
  };

function Text({
  as: Component = 'p',
  className,
  variant,
  ...props
}: TextProps) {
  return (
    <Component
      data-slot="text"
      className={cn(textVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Heading, Text, headingVariants, textVariants };
export type { HeadingProps, TextProps };
