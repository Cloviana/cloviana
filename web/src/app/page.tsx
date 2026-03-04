import { Footer } from '@/components/sections/footer';
import { Navbar } from '@/components/sections/navbar';
import { Faq } from '@/components/ui/faq';

import { Hero, Problem } from './_components';

const faqItems = [
  {
    id: 'faq-1',
    question: 'What exactly does Cloviana do?',
    answer:
      "Cloviana is an autonomous GEO agent that continuously optimizes your presence across all AI search engines — ChatGPT, Perplexity, Gemini, Claude, and beyond. It simulates real buyer queries to find where you're invisible, fixes your technical schema, publishes authoritative content to fill the gaps, and monitors your rankings automatically.",
  },
  {
    id: 'faq-2',
    question: 'How is this different from an SEO agency?',
    answer:
      "SEO agencies optimize for Google keywords. Cloviana optimizes for how LLMs read, interpret, and cite your content. AI search engines don't rank pages — they select sources they trust as authoritative answers. That requires a completely different approach to schema, content structure, and semantic authority.",
  },
  {
    id: 'faq-3',
    question: 'How much work does this require from our team?',
    answer:
      'Zero. Cloviana is fully managed — we run the entire optimization loop. No developers, no dashboards, no briefs to write. You focus on closing the demos that come in.',
  },
  {
    id: 'faq-4',
    question: 'How do you measure results?',
    answer:
      'We track your AI mention share — how often your product appears in AI-generated answers for relevant buyer queries across all major AI search engines. You get a baseline visibility score at onboarding and a clear view of how it improves as the loop runs.',
  },
  {
    id: 'faq-5',
    question: 'How long before we see results?',
    answer:
      "Technical fixes and schema updates go live in the first two weeks — you'll see movement fast. Content-driven gains compound over 60–90 days as AI engines weight new authoritative sources. Most clients see their first ranking improvements within the first month.",
  },
  {
    id: 'faq-6',
    question: 'Is Cloviana right for us?',
    answer:
      "If you're a B2B SaaS company with an established product and an inbound motion you want to protect, yes. Especially if you've noticed organic traffic softening or you're watching competitors show up in AI answers where you don't. That's exactly the problem we fix.",
  },
];

export default function HomePage() {
  return (
    <div className="relative min-h-screen bg-white">
      <header className="sticky top-0 right-0 left-0 z-50">
        <Navbar />
      </header>

      <main className="space-y-0">
        <Hero />
        <Problem />
        <Faq
          items={faqItems}
          heading="Frequently asked questions"
          description="Everything you need to know about Cloviana. Can't find the answer you're looking for? Reach out to our team."
        />
      </main>

      <Footer />
    </div>
  );
}
