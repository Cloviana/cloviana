import type { ReactNode } from 'react';

import { cn } from '@/utils/cn';

type DashboardPageLayoutProps = {
  children: ReactNode;
  header?: ReactNode;
  content?: 'default' | 'centered';
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
          'flex min-h-0 flex-1 overflow-y-auto px-16 py-8',
          content === 'centered' && 'items-center justify-center',
          className,
        )}
      >
        {children}
      </main>
    </div>
  );
}
