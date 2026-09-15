import type { ComponentProps } from 'react';

import { cn } from '@/utils/cn';

export function PageHeader({ className, ...props }: ComponentProps<'header'>) {
  return (
    <header
      data-slot="page-header"
      className={cn(
        'bg-surface flex shrink-0 flex-col gap-y-3 py-3 has-data-[slot=tabs-list]:pb-0',
        className,
      )}
      {...props}
    />
  );
}

export function PageHeaderRow({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="page-header-row"
      className={cn(
        'flex items-center px-3.5 has-data-[slot=breadcrumb]:min-h-[30px] has-data-[slot=page-header-title]:min-h-[30px]',
        className,
      )}
      {...props}
    />
  );
}

export function PageHeaderTitle({ className, ...props }: ComponentProps<'h1'>) {
  return (
    <h1
      data-slot="page-header-title"
      className={cn('text-base font-medium', className)}
      {...props}
    />
  );
}

export function PageHeaderActions({
  className,
  ...props
}: ComponentProps<'div'>) {
  return (
    <div
      data-slot="page-header-actions"
      className={cn('flex shrink-0 items-center gap-2', className)}
      {...props}
    />
  );
}
