'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { gaEvent } from '@/lib/ga/client';
import { cn } from '@/utils/cn';

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

interface FaqProps {
  heading: string;
  description: string;
  items?: FaqItem[];
  supportHeading?: string;
  supportDescription?: string;
  supportButtonText?: string;
  supportButtonUrl?: string;
  className?: string;
}

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

const Faq = ({
  heading = 'Frequently asked questions',
  description = "Everything you need to know about Cloviana. Can't find the answer you're looking for? Reach out to our team.",
  items = faqItems,
  className,
}: FaqProps) => {
  return (
    <section className={cn('py-32', className)}>
      <div className="container space-y-16">
        <div className="mx-auto flex max-w-3xl flex-col text-left md:text-center">
          <h2 className="mb-3 text-3xl font-semibold md:mb-4 lg:mb-6 lg:text-4xl">
            {heading}
          </h2>
          <p className="text-muted-foreground lg:text-lg">{description}</p>
        </div>
        <Accordion
          type="single"
          collapsible
          className="mx-auto w-full lg:max-w-3xl"
          onValueChange={(value) => {
            if (value) {
              const item = items.find((i) => i.id === value);
              if (item) gaEvent('faq_expanded', { question: item.question });
            }
          }}
        >
          {items.map((item) => (
            <AccordionItem key={item.id} value={item.id}>
              <AccordionTrigger className="transition-opacity duration-200 hover:no-underline hover:opacity-60">
                <div className="font-medium sm:py-1 lg:py-2 lg:text-lg">
                  {item.question}
                </div>
              </AccordionTrigger>
              <AccordionContent className="sm:mb-1 lg:mb-2">
                <div className="text-muted-foreground lg:text-lg">
                  {item.answer}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export { Faq };
