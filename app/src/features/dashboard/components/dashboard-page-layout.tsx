import type { ReactNode } from 'react';

import { cn } from '@/utils/cn';

type DashboardPageLayoutProps = {
  children: ReactNode;
  header?: ReactNode;
  content?: 'full' | 'default';
  contentWidth?: 'constrained' | 'full';
  className?: string;
};

export function DashboardPageLayout({
  children,
  header,
  content = 'default',
  className,
}: DashboardPageLayoutProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {header}
      <main
        className={cn(
          'flex min-h-0 flex-1 flex-col overflow-y-auto',
          content === 'default' ? 'p-3' : 'w-full',
          className,
        )}
      >
        <div className={cn('flex min-h-0 w-full flex-1 flex-col')}>
          {children}
        </div>
      </main>
    </div>
  );
}
