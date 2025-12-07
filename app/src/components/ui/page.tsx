import { LucideIcon } from 'lucide-react';
import * as React from 'react';

import { Button, ButtonProps } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
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
        'mx-auto w-full flex-1',
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
  heading,
  primaryAction,
  ...props
}: React.ComponentProps<'div'> & {
  heading: {
    title: string;
    icon: LucideIcon;
  };
  primaryAction?: ButtonProps;
}) => {
  const isMobile = useIsMobile();

  return (
    <div
      className={cn(
        'mb-5 flex h-12 items-center justify-between border-b px-4',
        className,
      )}
      {...props}
    >
      <div className="flex items-center gap-2">
        {isMobile ? (
          <SidebarTrigger />
        ) : (
          <heading.icon strokeWidth={2.2} className="size-[17px]" />
        )}
        <h1 className="text-base font-semibold">{heading.title}</h1>
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
