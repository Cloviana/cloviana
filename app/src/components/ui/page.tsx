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
        'mx-auto w-full flex-1 px-6 py-9 sm:px-11',
        !fullWidth && 'max-w-5xl',
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
    <div className={cn('mb-5 space-y-[3px]', className)} {...props}>
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
      className={cn('text-base font-semibold tracking-tight', className)}
      {...props}
    >
      {children}
    </h1>
  );
};

const PageParagraph = ({
  className,
  children,
  ...props
}: React.ComponentProps<'p'>) => {
  return (
    <p
      className={cn('text-foreground-light text-[13px]', className)}
      {...props}
    >
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

export { Page, PageHeader, PageTitle, PageParagraph, PageContent };
