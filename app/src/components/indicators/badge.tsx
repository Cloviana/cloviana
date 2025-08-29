import { cva, VariantProps } from 'class-variance-authority';
import { FC, HTMLAttributes, ReactNode } from 'react';

import { cn } from '@/utils/cn';

const badgeVariants = cva(
  'flex h-min shrink-0 rounded px-1.5 py-[2px] text-xs font-medium',
  {
    variants: {
      variant: {
        blue: 'bg-blue-500/20 text-blue-700',
        green: 'bg-green-500/20 text-green-700',
        purple: 'bg-purple-500/20 text-purple-700',
        yellow: 'bg-yellow-500/20 text-yellow-700',
        gray: 'bg-gray-500/20 text-gray-700',
        red: 'bg-red-500/20 text-red-700',
        white: 'bg-gray-100 text-foreground-light',
      },
    },
    defaultVariants: {
      variant: 'purple',
    },
  },
);

export interface BadgeProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  children?: ReactNode;
  className?: string;
}

export const Badge: FC<BadgeProps> = ({ variant, children, className }) => (
  <span className={cn(badgeVariants({ variant }), className)}>{children}</span>
);
