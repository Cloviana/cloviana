import { ScrollAreaProps } from '@radix-ui/react-scroll-area';
import { FC, HTMLAttributes, RefAttributes } from 'react';

import { Button as Button_, ButtonProps } from '@/components/actions';
import { cn } from '@/utils/cn';

import { ScrollArea, ScrollBar } from './scroll-area';

type RootProps = HTMLAttributes<HTMLElement>;
type ContentProps = ScrollAreaProps & RefAttributes<HTMLDivElement>;
type PageButtonProps = ButtonProps;

const Root: FC<RootProps> = ({ className, children, ...rest }) => (
  <div
    className={cn('flex h-full min-h-0 flex-col overflow-hidden', className)}
    {...rest}
  >
    {children}
  </div>
);

const Header: FC<HTMLAttributes<HTMLElement>> = ({
  className,
  children,
  ...rest
}) => (
  <div
    className={cn('flex h-10 shrink-0 items-center border-b px-8', className)}
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
      'z-10 flex h-10 shrink-0 items-center border-b px-8',
      className,
    )}
    {...rest}
  >
    {children}
  </div>
);

const Content: FC<ContentProps> = ({ className, children, ...rest }) => (
  <ScrollArea className={className} {...rest}>
    {children}
    <ScrollBar orientation="vertical" />
    <ScrollBar orientation="horizontal" />
  </ScrollArea>
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

const Button: FC<PageButtonProps> = ({ children, className, ...rest }) => (
  <Button_ size="sm" className={className} {...rest}>
    {children}
  </Button_>
);

export const Page = { Button, Content, Header, Root, SubHeader, Title };
