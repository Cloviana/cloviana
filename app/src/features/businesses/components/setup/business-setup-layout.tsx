'use client';

import type { ReactNode } from 'react';

import { FlowHeader } from '@/components/layout/header';
import { paths } from '@/config/paths';

type BusinessSetupLayoutProps = {
  children: ReactNode;
};

export function BusinessSetupLayout({ children }: BusinessSetupLayoutProps) {
  return (
    <div className="bg-studio flex h-screen flex-col overflow-y-auto">
      <header>
        <FlowHeader href={paths.business.getHref()} />
      </header>
      <main className="relative flex flex-1 items-center justify-center px-4 py-8 sm:px-6">
        <div className="mx-auto flex min-h-[500px] w-full max-w-md flex-col justify-center gap-16">
          {children}
        </div>
      </main>
    </div>
  );
}
