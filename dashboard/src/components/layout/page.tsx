import { cva, VariantProps } from 'class-variance-authority';
import { FC, HTMLAttributes } from 'react';

import { Button, ButtonProps } from '@/components/actions';
import { cn } from '@/utils/cn';

const contentVariants = cva(
  'relative mx-auto w-full px-4 py-3 empty:px-0 md:px-8',
  {
    variants: {
      fullWidth: { true: 'max-w-none' },
      centeredLayout: {
        true: 'flex h-[calc(100vh-100px)] w-full items-center justify-center',
      },
    },
    defaultVariants: {
      fullWidth: true,
    },
  },
);

type RootProps = HTMLAttributes<HTMLElement>;
type ContentProps = HTMLAttributes<HTMLElement> &
  VariantProps<typeof contentVariants>;
type PageButtonProps = Omit<ButtonProps, 'size'>;

const Root: FC<RootProps> = ({ className, children, ...rest }) => (
  <div className={cn(className)} {...rest}>
    {children}
  </div>
);

const Header: FC<HTMLAttributes<HTMLElement>> = ({
  className,
  children,
  ...rest
}) => (
  <div
    className={cn(
      'flex h-10 items-center border-b border-surface-300 px-8',
      className,
    )}
    {...rest}
  >
    {children}
  </div>
);

const SubHeader: FC<HTMLAttributes<HTMLElement>> = ({
  className,
  children,
  ...rest
}) => (
  <div
    className={cn(
      'flex h-10 items-center border-b border-surface-300 px-8',
      className,
    )}
    {...rest}
  >
    {children}
  </div>
);

const Content: FC<ContentProps> = ({
  fullWidth,
  centeredLayout,
  className,
  ...rest
}) => (
  <section
    className={cn(
      'py-2',
      className,
      contentVariants({ fullWidth, centeredLayout }),
    )}
    {...rest}
  />
);

const Title: FC<HTMLAttributes<HTMLHeadingElement>> = ({
  className,
  children,
  ...rest
}) => (
  <div className="min-w-0">
    <h1 className={cn('truncate text-[13px] font-medium', className)} {...rest}>
      {children}
    </h1>
  </div>
);

const PageButton: FC<PageButtonProps> = ({ children, className, ...rest }) => (
  <Button size="sm" className={className} {...rest}>
    {children}
  </Button>
);

export { PageButton as Button, Content, Header, Root, SubHeader, Title };
