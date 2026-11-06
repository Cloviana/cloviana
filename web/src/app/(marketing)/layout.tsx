import type { ReactNode } from 'react';

import { Footer } from '@/components/layout/footer/default';
import { Navbar } from '@/components/layout/navbar/navbar';

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-background relative flex min-h-screen flex-col">
      <header className="sticky top-0 right-0 left-0 z-50">
        <Navbar />
      </header>
      <main className="flex-1 space-y-0">{children}</main>
      <Footer />
    </div>
  );
}
