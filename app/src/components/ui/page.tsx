import * as React from 'react';

import { cn } from '@/utils/cn';

const Page = ({
  fullWidth,
  children,
}: React.ComponentProps<'div'> & { fullWidth?: boolean }) => {
  return (
    <div className="py-9">
      <div className={cn('mx-auto w-full px-11', !fullWidth && 'max-w-5xl')}>
        {children}
      </div>
    </div>
  );
};

const PageHeader = ({ children }: React.ComponentProps<'div'>) => {
  return <div className="mb-7 space-y-1">{children}</div>;
};

const PageTitle = ({ children }: React.ComponentProps<'h1'>) => {
  return <h1 className="text-xl font-semibold tracking-tight">{children}</h1>;
};

const PageParagraph = ({ children }: React.ComponentProps<'p'>) => {
  return <p className="text-foreground-light text-sm">{children}</p>;
};

const PageContent = ({ children }: React.ComponentProps<'div'>) => {
  return <div className="grid gap-6">{children}</div>;
};

export { Page, PageHeader, PageTitle, PageParagraph, PageContent };
