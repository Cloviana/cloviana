'use client';

import { Check, Circle } from 'lucide-react';
import type { ReactNode } from 'react';

import { FlowHeader } from '@/components/layout/header';
import { paths } from '@/config/paths';
import { cn } from '@/utils/cn';

const steps = [
  ['Project', 'Brand and market basics'],
  ['Profile', 'Positioning and channels'],
  ['Topics', 'Buying conversations'],
  ['Prompts', 'Questions to monitor'],
] as const;

type SummaryItem = {
  label: string;
  value: string;
};

export function BusinessSetupLayout({
  children,
  currentStepIndex = 1,
  brandName,
  summaryItems = [],
}: {
  children: ReactNode;
  currentStepIndex?: number;
  brandName?: string | null;
  summaryItems?: SummaryItem[];
}) {
  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900">
      <FlowHeader href={paths.business.getHref()} />

      <main className="mx-auto grid w-full max-w-[1320px] flex-1 grid-cols-1 border-x border-slate-200 lg:grid-cols-[220px_minmax(0,1fr)_280px]">
        <aside className="hidden border-r border-slate-200 px-6 py-10 lg:block">
          <p className="mb-7 text-xs font-medium tracking-wide text-slate-500 uppercase">
            Client setup
          </p>
          <ol className="space-y-5">
            {steps.map(([title, description], index) => {
              const stepNumber = index + 1;
              const isComplete = stepNumber < currentStepIndex;
              const isCurrent = stepNumber === currentStepIndex;

              return (
                <li key={title} className="flex gap-3">
                  <div
                    className={cn(
                      'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border text-[10px]',
                      isComplete && 'border-slate-900 bg-slate-900 text-white',
                      isCurrent && 'border-blue-600 text-blue-600',
                      !isComplete &&
                        !isCurrent &&
                        'border-slate-300 text-slate-400',
                    )}
                  >
                    {isComplete ? <Check className="size-3" /> : stepNumber}
                  </div>
                  <div>
                    <p
                      className={cn(
                        'text-sm font-medium',
                        isCurrent ? 'text-slate-900' : 'text-slate-500',
                      )}
                    >
                      {title}
                    </p>
                    <p className="mt-0.5 text-xs leading-5 text-slate-400">
                      {description}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </aside>

        <section className="min-w-0 px-5 py-8 sm:px-10 sm:py-12 lg:px-14">
          <div className="mb-8 lg:hidden">
            <div className="mb-3 flex items-center justify-between text-xs text-slate-500">
              <span>Step {currentStepIndex} of 4</span>
              <span>{steps[currentStepIndex - 1]?.[0]}</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {steps.map(([title], index) => (
                <div
                  key={title}
                  className={cn(
                    'h-1 rounded-full bg-slate-200',
                    index < currentStepIndex && 'bg-slate-900',
                  )}
                />
              ))}
            </div>
          </div>
          <div className="mx-auto w-full max-w-2xl">{children}</div>
        </section>

        <aside className="hidden border-l border-slate-200 bg-slate-50/40 px-6 py-10 lg:block">
          <div className="sticky top-8">
            <div className="mb-6 flex items-center gap-2">
              <Circle className="size-2 fill-blue-600 text-blue-600" />
              <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">
                Monitoring plan
              </p>
            </div>
            <h2 className="text-base font-semibold text-slate-900">
              {brandName || 'New client project'}
            </h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Cloviana turns this setup into an approved prompt set and a daily
              multi-engine visibility baseline.
            </p>

            <dl className="mt-7 divide-y divide-slate-200 border-y border-slate-200">
              {summaryItems.length ? (
                summaryItems.map((item) => (
                  <div key={item.label} className="py-3">
                    <dt className="text-[11px] font-medium text-slate-400 uppercase">
                      {item.label}
                    </dt>
                    <dd className="mt-1 text-sm text-slate-700">
                      {item.value}
                    </dd>
                  </div>
                ))
              ) : (
                <div className="py-4 text-xs leading-5 text-slate-500">
                  Project details will appear here as you work.
                </div>
              )}
            </dl>

            <div className="mt-6 space-y-2 text-xs text-slate-500">
              <p>Engines: ChatGPT, Claude, Perplexity, Google AI Overviews</p>
              <p>Signals: mentions, citations, share of voice</p>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
