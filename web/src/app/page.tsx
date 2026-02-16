import Script from 'next/script';

import { SectionTracker } from '@/components/analytics/section-tracker';
import { Footer } from '@/components/sections/footer';
import { Navbar } from '@/components/sections/navbar';
import { Faq } from '@/components/ui/faq';

import {
  FinalCTA,
  Hero,
  Comparison,
  HowItWorks,
  Examples,
  Stats,
  Testimonial,
} from './_components';

const faqItems = [
  {
    id: 'faq-1',
    question: 'How does Cloviana work?',
    answer:
      'Connect your Shopify store, sync your products, and Cloviana takes it from there. It discovers commercial keywords tied to your catalog, builds a prioritized content plan, and generates product-led blog posts ready to review and publish. You can publish manually or set autopilot to handle it on a schedule.',
  },
  {
    id: 'faq-2',
    question: 'Is this just generic AI content, or will it actually rank?',
    answer:
      "Every post is built around buyer-intent keywords — terms people search when they're ready to buy, not just browse. Content is structured to match how Google and AI search engines evaluate relevance and authority. It's not generic AI content; it's tied to your products and written to convert.",
  },
  {
    id: 'faq-3',
    question: 'Do I need SEO experience to use Cloviana?',
    answer:
      'None at all. Cloviana handles keyword research, content strategy, and writing automatically. Your only job is to spend a few minutes reviewing each draft and hit publish. Everything else runs on autopilot.',
  },
  {
    id: 'faq-4',
    question: 'Why not just use ChatGPT to write my content?',
    answer:
      "ChatGPT gives you a blank page. Cloviana starts from your product catalog, identifies purchase-intent keywords, and generates posts that naturally feature your products in context. The goal isn't just to produce content — it's to produce content that ranks in Google and AI search, and drives sales.",
  },
  {
    id: 'faq-5',
    question: 'What size store does Cloviana work best for?',
    answer:
      "Cloviana works best for stores with 10 or more SKUs — more products means more keyword angles and more internal linking opportunities. That said, stores with 3–9 focused products can still see strong results if there's clear search demand for their category. If you're brand new with no sales yet, it's worth waiting until you have some traction first.",
  },
  {
    id: 'faq-6',
    question: "What's included in the free trial?",
    answer:
      'You get 14 days free with access to all Cloviana features — keyword discovery, content strategy, blog generation, and autopilot scheduling. During the trial you can publish up to 2 posts. No credit card required to start.',
  },
];

export default function HomePage() {
  return (
    <div className="relative min-h-screen">
      <header className="sticky top-0 right-0 left-0 z-50">
        <Navbar />
      </header>

      <Script
        id="faq-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: faqItems.map((item) => ({
              '@type': 'Question',
              name: item.question,
              acceptedAnswer: {
                '@type': 'Answer',
                text: item.answer,
              },
            })),
          }),
        }}
      />
      <main className="bg-background">
        <div className="relative">
          <SectionTracker section="hero" />
          <Hero />
        </div>
        <div className="relative">
          <SectionTracker section="examples" />
          <Examples />
        </div>
        <div className="relative">
          <SectionTracker section="how_it_works" />
          <HowItWorks />
        </div>
        <div className="relative">
          <SectionTracker section="stats" />
          <Stats />
        </div>
        <div className="relative">
          <SectionTracker section="comparison" />
          <Comparison />
        </div>
        <div className="relative">
          <SectionTracker section="testimonial" />
          <Testimonial />
        </div>
        <div className="relative">
          <SectionTracker section="faq" />
        </div>
        <Faq
          items={faqItems}
          heading="Frequently asked questions"
          description="Everything you need to know about Cloviana. Can't find the answer you're looking for? Reach out to our team."
        />
        <div className="relative">
          <SectionTracker section="final_cta" />
          <FinalCTA />
        </div>
      </main>

      <Footer />
    </div>
  );
}
