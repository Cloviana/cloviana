'use client';

import { ChevronLeft, ChevronRight, Check, Play, Search } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { paths } from '@/config/paths';

const CALENDLY_HREF = 'https://calendly.com/cloviana/30min';

const sources = ['g2.com', 'capterra.com', 'acme.com', 'techradar.com'];

function DemoPreview() {
  const answer =
    'Cloviana tracks the buyer prompts where competitors are recommended, fixes the sources AI models trust, and compounds share of voice over time.';
  const [visibleChars, setVisibleChars] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setVisibleChars((current) => {
        if (current >= answer.length) return 0;
        return current + 2;
      });
    }, 55);

    return () => window.clearInterval(timer);
  }, [answer.length]);

  const visibleAnswer = useMemo(
    () => answer.slice(0, visibleChars),
    [answer, visibleChars],
  );

  return (
    <div className="w-full max-w-xl">
      <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#ff5a00]/20 bg-white px-3 py-1.5 text-xs font-medium text-[#c94b00]">
        <Play className="size-3 fill-[#ff5a00] text-[#ff5a00]" />
        Landing preview playing
      </div>

      <div className="overflow-hidden rounded-md border border-stone-200 bg-white shadow-[0_22px_70px_rgba(15,23,42,0.08)]">
        <div className="flex items-center gap-2 border-b border-stone-200 px-4 py-3">
          <Search className="size-4 text-stone-400" />
          <p className="truncate text-sm text-stone-600">
            What is the best GEO agent for B2B SaaS?
          </p>
        </div>

        <div className="space-y-5 p-5">
          <div className="flex items-center gap-2">
            <Image
              src="/logo-icon.png"
              width={125}
              height={125}
              alt=""
              className="size-4"
            />
            <span className="text-xs font-semibold tracking-[0.14em] text-stone-400 uppercase">
              Answer
            </span>
          </div>

          <p className="min-h-[112px] text-sm leading-6 text-stone-700">
            {visibleAnswer}
            <span className="ml-0.5 inline-block h-4 w-px translate-y-0.5 animate-pulse bg-stone-500" />
          </p>

          <div className="flex flex-wrap gap-2">
            {sources.map((source, index) => (
              <span
                key={source}
                className="inline-flex items-center gap-2 rounded-md border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-xs font-medium text-stone-600"
              >
                <span className="text-stone-400">{index + 1}</span>
                <img
                  src={`https://www.google.com/s2/favicons?domain=${source}&sz=32`}
                  alt=""
                  className="size-3 rounded-sm"
                />
                {source}
              </span>
            ))}
          </div>
        </div>

        <div className="h-1 bg-stone-100">
          <div
            className="h-full bg-[#ff5a00] transition-all duration-75"
            style={{ width: `${(visibleChars / answer.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export default function DemoPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [firstName, setFirstName] = useState('');

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitted(true);
  }

  return (
    <main className="min-h-screen bg-white lg:grid lg:grid-cols-[minmax(0,0.92fr)_minmax(420px,0.72fr)]">
      <section className="flex min-h-screen items-center px-7 py-12">
        <div className="mx-auto w-full max-w-md">
          <Link
            href={paths.auth.login.getHref()}
            className="text-foreground-lighter hover:text-foreground mb-10 inline-flex items-center gap-2 text-sm"
          >
            <ChevronLeft className="size-4" />
            Back
          </Link>

          {!isSubmitted ? (
            <div className="space-y-7">
              <div className="space-y-2">
                <h1 className="text-[30px] leading-tight font-medium">
                  Book a demo
                </h1>
                <p className="text-foreground-light text-sm leading-6">
                  Get a first-hand look at how Cloviana improves AI search
                  visibility for your business.
                </p>
              </div>

              <form className="space-y-3" onSubmit={onSubmit}>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    size="lg"
                    placeholder="First name"
                    value={firstName}
                    onChange={(event) => setFirstName(event.target.value)}
                  />
                  <Input size="lg" placeholder="Last name" />
                </div>
                <Input size="lg" type="email" placeholder="Work email" />
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input size="lg" placeholder="Company" />
                  <Input size="lg" placeholder="https://company.com" />
                </div>
                <select
                  className="border-input text-foreground focus-visible:border-secondary focus-visible:ring-ring/50 h-9 w-full rounded-lg border bg-white px-3 text-sm outline-none focus-visible:ring-[3px]"
                  defaultValue=""
                >
                  <option value="" disabled>
                    What do you want to improve?
                  </option>
                  <option>AI visibility</option>
                  <option>Competitor mentions</option>
                  <option>Technical GEO foundation</option>
                  <option>Not sure yet</option>
                </select>
                <Textarea
                  rows={5}
                  placeholder="Anything else you'd like us to know?"
                  className="resize-none"
                />

                <Button
                  type="submit"
                  size="lg"
                  className="mt-40 w-full bg-[#ff5a00] text-white hover:bg-[#e45100]"
                >
                  Continue
                </Button>
              </form>
            </div>
          ) : (
            <div className="space-y-7">
              <div className="flex size-10 items-center justify-center rounded-full bg-[#ff5a00]/10 text-[#ff5a00]">
                <Check className="size-5" />
              </div>

              <div className="space-y-2">
                <h1 className="text-[30px] leading-tight font-medium">
                  You&apos;re all set{firstName ? `, ${firstName}` : ''}
                </h1>
                <p className="text-foreground-light text-sm leading-6">
                  Pick a time that works for you and we&apos;ll send a calendar
                  invite with everything you need.
                </p>
              </div>

              <Button
                asChild
                size="lg"
                className="bg-[#ff5a00] px-8 text-white hover:bg-[#e45100]"
              >
                <Link
                  href={CALENDLY_HREF}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Pick a time
                  <ChevronRight className="size-3.5" strokeWidth={2.5} />
                </Link>
              </Button>

              <p className="text-foreground-lighter text-xs">
                Scheduling link:{' '}
                <Link
                  href={CALENDLY_HREF}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground underline"
                >
                  calendly.com/cloviana/30min
                </Link>
              </p>
            </div>
          )}
        </div>
      </section>

      <aside
        className="bg-surface border-border hidden min-h-screen border-l px-12 py-16 lg:flex lg:flex-col lg:items-center lg:justify-center"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(15, 23, 42, 0.08) 1px, transparent 0)',
          backgroundSize: '12px 12px',
        }}
      >
        <div className="w-full max-w-xl space-y-12">
          <div className="max-w-lg">
            <p className="font-gambarino text-[30px] leading-[1.18]">
              The agent runs. You get recommended.
            </p>
            <p className="text-foreground-light mt-4 text-sm leading-6">
              Cloviana maps the conversations you are missing, improves the
              sources AI engines trust, and tracks the lift across every model.
            </p>
          </div>

          <DemoPreview />

          <div className="border-border grid grid-cols-2 border bg-white/70 text-xs text-slate-600">
            {['ChatGPT', 'Perplexity', 'Gemini', 'Claude'].map((engine) => (
              <div key={engine} className="border-border border p-4">
                {engine}
              </div>
            ))}
          </div>
        </div>
      </aside>
    </main>
  );
}
