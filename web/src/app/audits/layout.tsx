import { ReactNode } from 'react';

import { Footer } from '@/components/layout/footer/default';
import { Navbar } from '@/components/layout/navbar/navbar';

export const metadata = {
  title: 'Free AI Visibility Report | Cloviana',
  description:
    "See where your brand appears — or doesn't — when buyers ask ChatGPT, Perplexity, and Google for software recommendations. Free report. No credit card. Takes 60 seconds.",
  keywords: [
    'AI visibility report',
    'AI search audit',
    'ChatGPT brand visibility',
    'Perplexity brand ranking',
    'Google AI Overviews optimization',
    'B2B AI search presence',
    'AI share of voice',
  ],
  alternates: {
    canonical: 'https://cloviana.com/audits',
  },
  openGraph: {
    title: 'Free AI Visibility Report | Cloviana',
    description:
      "See where your brand appears — or doesn't — when buyers ask AI for software recommendations. Free. Takes 60 seconds.",
    url: 'https://cloviana.com/audits',
    images: [
      {
        url: 'https://cloviana.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Cloviana — Free AI Visibility Report',
      },
    ],
  },
};

const toolSchema = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Cloviana AI Visibility Report',
  description:
    "A free tool that shows B2B SaaS companies where their brand appears — or doesn't — across ChatGPT, Perplexity, and Google AI Overviews when buyers search for software recommendations in their category.",
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  url: 'https://cloviana.com/audits',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  provider: {
    '@type': 'Organization',
    name: 'Cloviana',
    url: 'https://cloviana.com',
  },
});

const faqSchema = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is an AI visibility report?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'An AI visibility report shows how often your brand is cited when buyers ask AI platforms for software recommendations in your category. It measures your share of voice across ChatGPT, Perplexity, and Google AI Overviews — the three platforms where most B2B software research now begins.',
      },
    },
    {
      '@type': 'Question',
      name: 'Which AI platforms does this check?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The report checks ChatGPT (OpenAI), Perplexity, and Google AI Overviews (Google AIO) — the platforms where B2B buyers most commonly ask for software recommendations before contacting vendors.',
      },
    },
    {
      '@type': 'Question',
      name: 'How is the AI visibility score calculated?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Your score reflects how frequently your brand is cited in AI-generated answers for relevant category queries, weighted by position within those answers. A score of 0% means your brand isn't appearing. A score of 100% means you're cited across every relevant query.",
      },
    },
    {
      '@type': 'Question',
      name: "Why doesn't my brand appear in AI answers?",
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Most brands don't appear because their content isn't structured for AI extraction, lacks authoritative signals like citations and statistics, or isn't present on the third-party sources AI systems rely on — review sites, industry publications, and comparison pages. Traditional SEO rankings don't automatically translate to AI visibility.",
      },
    },
    {
      '@type': 'Question',
      name: 'How long does the AI visibility report take?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Reports typically complete within 24–48 hours. You'll receive an email with your full results when it's ready — no need to keep the page open.",
      },
    },
    {
      '@type': 'Question',
      name: 'Is the AI visibility report really free?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. The AI Visibility Report is completely free, with no credit card required.',
      },
    },
  ],
});

export default function AuditsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toolSchema }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: faqSchema }}
      />
      <div className="bg-background relative flex min-h-screen flex-col">
        <header className="sticky top-0 right-0 left-0 z-50">
          <Navbar />
        </header>
        <main className="relative flex-1 space-y-0">{children}</main>
        <Footer />
      </div>
    </>
  );
}
