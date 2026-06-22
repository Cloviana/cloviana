import { ChevronUp, Search } from 'lucide-react';
import type { Metadata } from 'next';
import Image from 'next/image';

import { AuditCta } from '@/app/_components/audit-cta';
import { Footer } from '@/components/layout/footer';
import { Navbar } from '@/components/layout/navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export const metadata: Metadata = {
  title: 'Blog | Cloviana',
  description:
    'Insights from Cloviana on AI search visibility, B2B SaaS discovery, and buyer research behavior.',
};

const TOPICS = [
  'Company',
  'Developers',
  'Enterprise',
  'Research',
  'Security',
  'Updates',
] as const;

export default function BlogPage() {
  return (
    <div className="bg-background relative flex min-h-screen flex-col">
      <header className="sticky top-0 right-0 left-0 z-50">
        <Navbar />
      </header>

      <main className="flex-1">
        <section className="padding-global border-border border-b">
          <div className="container py-12 md:py-16 lg:py-20">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1.45fr)_minmax(20rem,0.55fr)] lg:items-center">
              <div className="bg-hero-surface border-hero-surface-border relative min-h-[19rem] overflow-hidden rounded-xl border shadow-sm md:aspect-[16/7] md:min-h-0">
                <Image
                  src="/images/solution-card-bg.png"
                  alt=""
                  fill
                  priority
                  className="object-cover object-center"
                />
                <div className="absolute inset-0 bg-linear-to-r from-black/55 via-black/20 to-transparent" />
                <div className="absolute right-6 bottom-6 left-6 text-white md:right-auto md:max-w-xl">
                  <p className="mb-3 text-xs font-semibold tracking-[0.18em] uppercase opacity-80">
                    Featured
                  </p>
                  <p className="text-3xl leading-none font-medium text-balance md:text-5xl">
                    AI search is the new first page
                  </p>
                </div>
              </div>

              <article className="flex flex-col items-start gap-5 lg:pl-6">
                <p className="bg-primary-100 text-primary-dark rounded-md px-3 py-1 text-xs font-semibold tracking-[0.12em] uppercase">
                  Featured
                </p>
                <h1 className="max-w-lg text-3xl leading-tight font-medium text-balance md:text-4xl">
                  What B2B buyers see before they ever reach your website
                </h1>
                <p className="text-foreground-light max-w-md text-base leading-7">
                  A practical look at how answer engines shape vendor discovery,
                  shortlists, and category trust.
                </p>
                <Button variant="outline" className="rounded-full px-6">
                  Read more
                </Button>
              </article>
            </div>
          </div>
        </section>

        <section className="padding-global">
          <div className="container pt-8 pb-24 md:pt-10 md:pb-32">
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-semibold tracking-normal">
                  Topics
                </h2>
                <ChevronUp aria-hidden="true" className="size-5" />
              </div>

              <div className="no-scrollbar -mx-1 flex gap-2.5 overflow-x-auto px-1 pb-1 md:flex-wrap md:gap-3">
                {TOPICS.map((topic) => (
                  <button
                    key={topic}
                    type="button"
                    className="bg-surface text-foreground hover:border-foreground/15 hover:bg-studio min-h-11 shrink-0 rounded-full border border-transparent px-6 text-base font-semibold tracking-[0.02em] transition-colors"
                  >
                    {topic}
                  </button>
                ))}
              </div>

              <div className="relative max-w-3xl">
                <Search
                  aria-hidden="true"
                  className="text-muted-foreground pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2"
                />
                <Input
                  aria-label="Search articles"
                  placeholder="Search articles"
                  className="border-input bg-studio placeholder:text-foreground-lighter h-14 rounded-xl pr-4 pl-11 text-base shadow-none"
                />
              </div>

              <div className="min-h-[20rem]" />
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <AuditCta />
    </div>
  );
}
