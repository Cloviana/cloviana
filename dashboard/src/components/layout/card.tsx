import { cva, VariantProps } from 'class-variance-authority';
import { createElement, FC, ReactNode } from 'react';

import { cn } from '@/utils/cn';

const cardVariants = cva('relative w-full rounded-md border px-3.5 py-4', {
  variants: {
    background: {
      white: 'bg-white',
    },
    roundedAbove: {
      sm: 'sm:rounded-md',
      md: 'md:rounded-md',
    },
  },
  defaultVariants: {
    background: 'white',
    roundedAbove: 'md',
  },
});

interface CardProps extends VariantProps<typeof cardVariants> {
  children?: ReactNode;
  as?: 'div';
  className?: string;
}

export const Card: FC<CardProps> = ({
  children,
  background,
  className,
  roundedAbove,
  as = 'div',
}) =>
  createElement(
    as,
    {
      className: cn(cardVariants({ background, roundedAbove }), className),
    },
    children,
  );
