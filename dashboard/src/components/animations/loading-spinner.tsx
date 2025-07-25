/* eslint-disable tailwindcss/no-custom-classname */

import { cva, type VariantProps } from 'class-variance-authority';
import { FC, HTMLAttributes } from 'react';

import { cn } from '@/utils/cn';

const loadingVariants = cva('loading loading-spinner', {
  variants: {
    size: {
      xs: 'loading-xs',
      sm: 'loading-sm',
      md: 'loading-md',
      lg: 'loading-lg',
      xl: 'loading-xl',
    },
    color: {
      white: 'text-white',
      base: 'text-foreground', // your “base” tone
      light: 'text-foreground-light', // your “light” tone
      lighter: 'text-foreground-lighter', // your “lighter” tone
      primary: 'text-primary',
    },
  },
});

type SpanAttrsWithoutColor = Omit<HTMLAttributes<HTMLSpanElement>, 'color'>;

interface LoadingProps
  extends VariantProps<typeof loadingVariants>,
    SpanAttrsWithoutColor {}

export const LoadingSpinner: FC<LoadingProps> = ({
  size = 'xs',
  color,
  className,
  ...rest
}) => {
  return (
    <span
      className={cn(loadingVariants({ size, color }), className)}
      {...rest}
    />
  );
};
