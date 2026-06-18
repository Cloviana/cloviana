'use client';

import { Check } from 'lucide-react';
import Image from 'next/image';
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
}: {
  children: ReactNode;
  currentStepIndex?: number;
  brandName?: string | null;
  summaryItems?: SummaryItem[];
}) {
  const activeStep = Math.min(Math.max(currentStepIndex, 1), steps.length);

  return (
    <div className="bg-studio text-foreground flex min-h-screen flex-col">
      <FlowHeader href={paths.business.getHref()} />

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-7 pt-8 pb-14 sm:pt-10">
        <div className="mb-10 flex items-center gap-2">
          <Image
            src="/logo-icon.png"
            width={125}
            height={125}
            alt="Cloviana Logo"
            className="size-[25px]"
          />
          {brandName ? (
            <p className="text-foreground-light truncate text-sm">
              Setting up {brandName}
            </p>
          ) : null}
        </div>

        <div className="mb-10">
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-3 text-xs tracking-[0.16em] uppercase">
            {steps.map(([title], index) => {
              const stepNumber = index + 1;
              const isComplete = stepNumber < activeStep;
              const isCurrent = stepNumber === activeStep;

              return (
                <li key={title} className="flex items-center gap-2">
                  <span
                    className={cn(
                      'flex size-3 items-center justify-center rounded-full border text-[8px] transition-colors',
                      isComplete &&
                        'border-foreground bg-foreground text-white',
                      isCurrent && 'border-foreground bg-transparent',
                      !isComplete &&
                        !isCurrent &&
                        'border-border bg-transparent',
                    )}
                  >
                    {isComplete ? <Check className="size-2" /> : null}
                  </span>
                  <span
                    className={cn(
                      'font-medium',
                      isCurrent ? 'text-foreground' : 'text-foreground-lighter',
                    )}
                  >
                    {title}
                  </span>
                  {index < steps.length - 1 ? (
                    <span className="text-foreground-lighter">-&gt;</span>
                  ) : null}
                </li>
              );
            })}
          </ol>
          <div className="mt-4 grid grid-cols-4 gap-1.5">
            {steps.map(([title], index) => (
              <div
                key={title}
                className={cn(
                  'bg-border h-1 rounded-full',
                  index < activeStep && 'bg-foreground',
                )}
              />
            ))}
          </div>
        </div>

        <section className="w-full">{children}</section>
      </main>
    </div>
  );
}
