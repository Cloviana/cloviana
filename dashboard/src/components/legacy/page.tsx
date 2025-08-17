import { cva, VariantProps } from 'class-variance-authority';
import { FC, HTMLAttributes, ReactNode } from 'react';

import { Button, ButtonProps } from '@/components/legacy/button';
import { cn } from '@/utils/cn';

const pageVariants = cva(
  'relative mx-auto w-full max-w-[1000px] px-6 py-3 empty:px-0 md:px-8',
  {
    variants: {
      fullWidth: { true: 'max-w-none' },
      narrowWidth: { true: 'max-w-[720px]' },
    },
    defaultVariants: {
      fullWidth: false,
    },
  },
);

type Action = ButtonProps;

interface PageProps
  extends VariantProps<typeof pageVariants>,
    HTMLAttributes<HTMLElement> {
  children?: ReactNode;
  title?: string;
  primaryAction?: Action;
}

export const Page: FC<PageProps> = ({
  children,
  fullWidth,
  narrowWidth,
  title,
  primaryAction,
  ...rest
}) => (
  <div className={cn(pageVariants({ fullWidth, narrowWidth }))} {...rest}>
    {(title || primaryAction) && (
      <div className="flex items-center justify-between gap-4 py-3.5">
        {title && <h1 className="text-xl font-medium">{title}</h1>}
        {primaryAction && (
          <Button size="sm" variant="primary" {...primaryAction}>
            {primaryAction.children}
          </Button>
        )}
      </div>
    )}

    {children}
  </div>
);
