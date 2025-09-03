import Script from 'next/script';
import React, { ReactNode } from 'react';

import '@/styles/globals.css';
import { MATERIAL_SYMBOLS_STYLESHEET } from '@/config/material-symbols';
import { dmSans, gambarino, inter, switzer } from '@/lib/fonts';
import { cn } from '@/utils/cn';

export const metadata = {
  title: 'Cloviana',
  description: 'Showcasing Best Practices For Building React Applications',
};

const RootLayout = async ({ children }: { children: ReactNode }) => {
  return (
    <html
      lang="en"
      className={cn(
        switzer.variable,
        gambarino.variable,
        dmSans.variable,
        inter.variable,
      )}
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
          href="https://cdn.jsdelivr.net/combine/npm/daisyui@5/components/loading.css,npm/daisyui@5/components/mockup.css"
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
          rel="stylesheet"
          href={MATERIAL_SYMBOLS_STYLESHEET}
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
      <body>{children}</body>
    </html>
  );
};

export default RootLayout;
export const dynamic = 'force-dynamic';
