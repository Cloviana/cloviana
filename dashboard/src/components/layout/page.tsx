import { cva, VariantProps } from 'class-variance-authority';
import { FC, HTMLAttributes, ReactNode } from 'react';

import { cn } from '@/utils/cn';

import { Button } from '../actions';

const pageVariants = cva(
  'relative mx-auto w-full max-w-[1000px] px-6 py-3 md:px-8',
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

type Action = {
  content?: string;
  url?: string;
  onClick?: () => void;
};

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
}) => {
  return (
    <div className={cn(pageVariants({ fullWidth, narrowWidth }))} {...rest}>
      <div className={'flex items-center justify-between gap-4 py-3.5'}>
        <h1 className="text-xl font-medium">{title}</h1>
        <div className="flex items-center gap-2">
          {primaryAction && (
            <Button
              size={'sm'}
              variant={'primary'}
              url={primaryAction.url}
              onClick={primaryAction.onClick}
            >
              {primaryAction.content}
            </Button>
          )}
        </div>
      </div>
      <div>{children}</div>
    </div>
  );
};
