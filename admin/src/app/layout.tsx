import type { ReactNode } from 'react';

import '@/styles/globals.css';
import { AppProvider } from '@/app/provider';
import { Toaster } from '@/components/ui/sonner';

export const metadata = { title: 'Cloviana' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppProvider>
          <Toaster />
          {children}
        </AppProvider>
      </body>
    </html>
  );
}

export const dynamic = 'force-dynamic';
