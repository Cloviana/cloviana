import type { ReactNode } from 'react';

import { cn } from '@/utils/cn';

type DashboardPageLayoutProps = {
  children: ReactNode;
  header?: ReactNode;
  layout?: 'stack' | 'grid';
  width?: 'narrow' | 'padded' | 'full';
  className?: string;
};

export function DashboardPageLayout({
  children,
  header,
  layout = 'stack',
  width = 'narrow',
  className,
}: DashboardPageLayoutProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {header}
      <main
        className={cn(
          'flex min-h-0 flex-1 flex-col overflow-y-auto',
          className,
        )}
      >
        <div
          className={cn(
            'min-h-0 w-full',
            width === 'narrow' && 'mx-auto max-w-4xl px-3.5 py-4',
            width === 'padded' && 'px-3.5 py-4',
            layout === 'grid'
              ? 'grid shrink-0 grid-cols-12 items-start gap-3.5'
              : 'flex flex-1 flex-col',
          )}
        >
          {children}
        </div>
      </main>
    </div>
  );
}
