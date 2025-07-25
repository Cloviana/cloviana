import { cva, VariantProps } from 'class-variance-authority';
import { HTMLAttributes, ReactNode } from 'react';

import { cn } from '@/utils/cn';

const buttonGroupVariants = cva('flex items-center', {
  variants: {
    gap: {
      extraTight: 'gap-2',
      tight: 'gap-3',
      loose: 'gap-5',
    },
    wrap: {
      true: 'flex-wrap',
    },
  },
});

type ButtonGroupsProps = VariantProps<typeof buttonGroupVariants> &
  HTMLAttributes<HTMLElement> & {
    children?: ReactNode;
  };

export const ButtonGroup = ({
  children,
  className,
  gap = 'tight',
  wrap,
  ...rest
}: ButtonGroupsProps) => {
  return (
    <div
      className={cn(buttonGroupVariants({ gap, wrap }), className)}
      {...rest}
    >
      {children}
    </div>
  );
};
