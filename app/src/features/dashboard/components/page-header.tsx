import type { ComponentProps, ReactNode } from 'react';

import { cn } from '@/utils/cn';

type PageHeaderProps = {
  title: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
};

export function PageHeader({ title, actions, children }: PageHeaderProps) {
  return (
    <header className="bg-surface shrink-0">
      <PageHeaderRow className="h-12 justify-between gap-4">
        <h1 className="text-base font-medium">{title}</h1>
        {actions && (
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        )}
      </PageHeaderRow>
      {children}
    </header>
  );
}

type PageHeaderRowProps = ComponentProps<'div'>;

export function PageHeaderRow({ className, ...props }: PageHeaderRowProps) {
  return (
    <div
      data-slot="page-header-row"
      className={cn('flex items-center px-3', className)}
      {...props}
    />
  );
}
