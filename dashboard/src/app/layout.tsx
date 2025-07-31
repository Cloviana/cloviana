import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import Script from 'next/script';
import React, { ReactNode } from 'react';

import { AppProvider } from '@/app/provider';
import '@/styles/globals.css';
import { dmSans, inter, interDisplay } from '@/lib/fonts';
import { cn } from '@/utils/cn';
import { env } from '@/config/env';

export const metadata = {
  title: 'Cloviana',
};

const RootLayout = async ({ children }: { children: ReactNode }) => {
  const queryClient = new QueryClient();
  const dehydratedState = dehydrate(queryClient);

  return (
    <html
      lang="en"
      className={cn(interDisplay.variable, dmSans.variable, inter.variable)}
    >
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-VSMD7B6WN1"
          strategy="afterInteractive"
        />
        <Script
          id="ga-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){ dataLayer.push(arguments); }
              gtag('js', new Date());
              gtag('config', 'G-VSMD7B6WN1', { page_path: window.location.pathname });
            `,
          }}
        />
        <link
          href="https://cdn.jsdelivr.net/combine/npm/daisyui@5/components/loading.css"
          rel="stylesheet"
          type="text/css"
        />

        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined&display=swap"
          rel="stylesheet"
          fetchPriority="high"
        />

        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body>
        <AppProvider>
          <HydrationBoundary state={dehydratedState}>
            {children}
          </HydrationBoundary>
        </AppProvider>
      </body>
    </html>
  );
};

export default RootLayout;
export const dynamic = 'force-dynamic';
