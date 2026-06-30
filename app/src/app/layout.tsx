import Script from 'next/script';
import type { ReactNode } from 'react';

import { AppProvider } from '@/app/provider';
import '@/styles/globals.css';
import { Toaster } from '@/components/ui/sonner';
import { env } from '@/config/env';
import { MATERIAL_SYMBOLS_STYLESHEET } from '@/config/material-symbols';
import { dmSans, geist, inter, interDisplay } from '@/lib/fonts';
import { cn } from '@/utils/cn';

export const metadata = {
  title: 'Cloviana',
};

const RootLayout = async ({ children }: { children: ReactNode }) => {
  return (
    <html
      lang="en"
      className={cn(
        interDisplay.variable,
        dmSans.variable,
        inter.variable,
        geist.variable,
      )}
    >
      <head>
        {process.env.NODE_ENV === 'production' && (
          <>
            <Script
              id="crisp-chat"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
              window.$crisp=[];
              window.CRISP_WEBSITE_ID="60f1d13f-4bdc-4146-a861-4b9d66513f06";
              (function(){
                d=document;
                s=d.createElement("script");
                s.src="https://client.crisp.chat/l.js";
                s.async=1;
                d.getElementsByTagName("head")[0].appendChild(s);
              })();
            `,
              }}
            />
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${env.GA4_ID}`}
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
              gtag('config', '${env.GA4_ID}', { page_path: window.location.pathname });
            `,
              }}
            />
          </>
        )}

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
        <link rel="icon" href="/favicon.ico" />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body>
        <Toaster />
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
};

export default RootLayout;
export const dynamic = 'force-dynamic';
