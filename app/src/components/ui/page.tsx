import * as React from 'react';

import { cn } from '@/utils/cn';

const Page = ({
  fullWidth,
  className,
  children,
  ...props
}: React.ComponentProps<'div'> & { fullWidth?: boolean }) => {
  return (
    <div
      className={cn(
        'mx-auto w-full flex-1 px-7 py-9',
        !fullWidth && 'max-w-[1200px]',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
};

const PageHeader = ({
  className,
  children,
  ...props
}: React.ComponentProps<'div'>) => {
  return (
    <div className={cn('mb-5', className)} {...props}>
      {children}
    </div>
  );
};

const PageTitle = ({
  className,
  children,
  ...props
}: React.ComponentProps<'h1'>) => {
  return (
    <h1
      className={cn('text-xl font-semibold tracking-tight', className)}
      {...props}
    >
      {children}
    </h1>
  );
};

const PageDescription = ({
  className,
  children,
  ...props
}: React.ComponentProps<'p'>) => {
  return (
    <p className={cn('text-foreground-lighter text-xs', className)} {...props}>
      {children}
    </p>
  );
};

const PageContent = ({
  className,
  children,
  ...props
}: React.ComponentProps<'div'>) => {
  return (
    <div className={cn('relative w-full space-y-6', className)} {...props}>
      {children}
    </div>
  );
};

export { Page, PageHeader, PageTitle, PageDescription, PageContent };
