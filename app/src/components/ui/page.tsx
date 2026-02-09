import * as React from 'react';

import { Button, ButtonProps } from '@/components/ui/button';
import { cn } from '@/utils/cn';

const Page = ({
  fullWidth = true,
  className,
  children,
  ...props
}: React.ComponentProps<'div'> & { fullWidth?: boolean }) => {
  return (
    <div
      className={cn(
        'mx-auto w-full flex-1 py-4',
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
  title,
  description,
  primaryAction,
  ...props
}: React.ComponentProps<'div'> & {
  title: string;
  description?: string;
  primaryAction?: ButtonProps;
}) => {
  return (
    <div
      className={cn('mb-5 flex items-center justify-between px-4', className)}
      {...props}
    >
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <div className="max-w-2xl">
          <p className="text-foreground/65 text-sm">{description}</p>
        </div>
      </div>
      <div className="flex items-center justify-end">
        {primaryAction && (
          <Button {...primaryAction}>{primaryAction.children}</Button>
        )}
      </div>
    </div>
  );
};

const PageContent = ({
  className,
  children,
  ...props
}: React.ComponentProps<'div'>) => {
  return (
    <div className={cn('relative w-full space-y-6 px-4', className)} {...props}>
      {children}
    </div>
  );
};

export { Page, PageHeader, PageContent };
