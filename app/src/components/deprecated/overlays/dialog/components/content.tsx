import {
  DialogContentProps,
  Content as ContentRX,
} from '@radix-ui/react-dialog';
import { cva, VariantProps } from 'class-variance-authority';
import { FC } from 'react';

import { cn } from '@/utils/cn';

const contentVariants = cva(
  'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-md border bg-white',
  {
    variants: {
      width: {
        sm: 'w-full max-w-sm',
        md: 'w-full max-w-md',
        lg: 'w-full max-w-lg',
        xl: 'w-full max-w-xl',
        '2xl': 'w-full max-w-2xl',
        '3xl': 'w-full max-w-3xl',
        '4xl': 'w-full max-w-4xl',
        '5xl': 'w-full max-w-5xl',
        '6xl': 'w-full max-w-6xl',
        '7xl': 'w-full max-w-7xl',
      },
    },
    defaultVariants: {
      width: '4xl',
    },
  },
);

type CV = VariantProps<typeof contentVariants>;

interface ContentProps extends CV, DialogContentProps {}

export const Content: FC<ContentProps> = ({
  className,
  children,
  width,
  ...props
}) => (
  <ContentRX {...props} className={cn(contentVariants({ width }), className)}>
    {children}
  </ContentRX>
);
