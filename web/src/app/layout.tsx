import Script from 'next/script';
import React, { ReactNode } from 'react';

import '@/styles/globals.css';
import { env } from '@/config/env';
import { MATERIAL_SYMBOLS_STYLESHEET } from '@/config/material-symbols';
import { calSans, gambarino, switzer } from '@/lib/fonts';
import { cn } from '@/utils/cn';

export const metadata = {
  title: 'Cloviana — Be the Answer Every B2B Buyer Gets',
  description:
    'Cloviana is an autonomous GEO agent that continuously optimizes your AI search presence across ChatGPT, Perplexity, Gemini, and beyond — no developers, no agency, no dashboards.',
  keywords: [
    'generative engine optimization',
    'GEO for B2B SaaS',
    'AI search optimization',
    'B2B AI visibility',
    'ChatGPT SEO',
    'Perplexity optimization',
    'AI search ranking',
    'B2B SaaS growth marketing',
  ],
  openGraph: {
    type: 'website',
    url: 'https://cloviana.com',
    title: 'Cloviana — Be the Answer Every B2B Buyer Gets',
    description:
      'Autonomous GEO that makes your B2B SaaS the #1 AI-recommended solution in your category. Zero developer lift. Continuous optimization.',
    siteName: 'Cloviana',
    images: [
      {
        url: 'https://cloviana.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Cloviana — Autonomous GEO for B2B SaaS',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@cloviana',
    creator: '@cloviana',
    title: 'Cloviana — Be the Answer Every B2B Buyer Gets',
    description:
      '94% of B2B buyers ask AI before talking to sales. Cloviana makes sure they hear your name first.',
    images: ['https://cloviana.com/og-image.png'],
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  alternates: {
    canonical: 'https://cloviana.com',
  },
};

const RootLayout = async ({ children }: { children: ReactNode }) => {
  return (
    <html
      lang="en"
      className={cn(calSans.variable, gambarino.variable, switzer.variable)}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'Cloviana',
              url: 'https://cloviana.com',
              logo: 'https://cloviana.com/logo-full.png',
              sameAs: ['https://twitter.com/cloviana'],
              description:
                'Cloviana is an automated SEO content engine for Shopify brands. It turns product catalogs into high-intent blog posts that rank in Google and AI search.',
            }),
          }}
        />
        <Script
          src="https://app.guideflow.com/assets/opt.js"
          data-iframe-id="0p0y33obvk"
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
          src="https://app.guideflow.com/assets/opt.js"
          data-iframe-id="zklvm36fjr"
          strategy="afterInteractive"
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
