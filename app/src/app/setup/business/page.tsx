import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { paths } from '@/config/paths';
import { getBusinessEntry } from '@/features/businesses/api/business-entry';

const setupSteps = [
  {
    number: '01',
    title: 'Project details',
    description:
      'Set the work email, brand, website, market, and reporting time zone.',
  },
  {
    number: '02',
    title: 'Profile',
    description:
      'Review the positioning and market context Cloviana discovers.',
  },
  {
    number: '03',
    title: 'Topics',
    description: 'Choose the buying conversations that matter for this market.',
  },
  {
    number: '04',
    title: 'Prompts',
    description:
      'Approve the exact questions we will monitor across AI search.',
  },
] as const;

const monitoringOutput = [
  ['Prompt set', 'Approved by you'],
  ['Engines', 'ChatGPT, Claude, Perplexity, Google'],
  ['Signals', 'Mentions, citations, share of voice'],
  ['First run', 'Starts after setup'],
] as const;

export default async function WelcomePage() {
  const entry = await getBusinessEntry();

  if (entry.destination === 'business') {
    redirect(paths.business.getHref(entry.businessId ?? undefined));
  }

  if (entry.businessId) {
    redirect(paths.setup.business.detail.getHref(entry.businessId));
  }

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <header className="mx-auto flex h-16 w-full max-w-[1180px] items-center border-b border-slate-200 px-6 sm:px-8">
        <Link
          href={paths.business.getHref()}
          className="flex items-center gap-2.5"
        >
          <Image
            src="/logo-icon.png"
            width={22}
            height={22}
            alt="Cloviana"
            className="size-[22px]"
          />
          <span className="text-sm font-semibold tracking-tight">Cloviana</span>
        </Link>
        <span className="ml-auto text-xs text-slate-500">Workspace setup</span>
      </header>

      <div className="mx-auto grid w-full max-w-[1180px] lg:min-h-[calc(100vh-4rem)] lg:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)]">
        <section className="flex flex-col justify-center px-6 py-16 sm:px-8 lg:border-r lg:border-slate-200 lg:py-20 lg:pr-20">
          <p className="text-xs font-medium tracking-[0.14em] text-slate-500 uppercase">
            First client
          </p>
          <h1 className="mt-5 max-w-2xl text-4xl leading-[1.08] font-semibold tracking-[-0.035em] sm:text-5xl">
            Set up the questions your buyers ask AI.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-slate-500">
            Cloviana researches the brand, builds a buyer-focused prompt set,
            and starts an AI visibility baseline. You review the important
            decisions before monitoring begins.
          </p>

          <div className="mt-12 border-t border-slate-200">
            {setupSteps.map((step) => (
              <div
                key={step.number}
                className="grid grid-cols-[44px_1fr] gap-4 border-b border-slate-200 py-5"
              >
                <span className="pt-0.5 font-mono text-xs text-slate-400">
                  {step.number}
                </span>
                <div>
                  <h2 className="text-sm font-semibold">{step.title}</h2>
                  <p className="mt-1 max-w-md text-sm leading-6 text-slate-500">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-9 flex flex-wrap items-center gap-5">
            <Button asChild size="lg" className="h-11 px-5">
              <Link href={paths.setup.business.new.getHref()}>
                Set up a brand
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <p className="text-xs text-slate-500">Usually takes 5-8 minutes</p>
          </div>
        </section>

        <aside className="flex items-center bg-slate-50/50 px-6 py-14 sm:px-8 lg:px-14 lg:py-20">
          <div className="w-full border border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <p className="text-sm font-semibold">AI visibility plan</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Created from your approved setup
                </p>
              </div>
              <span className="rounded-full border border-slate-200 px-2 py-1 text-[10px] font-medium tracking-wide text-slate-500 uppercase">
                Draft
              </span>
            </div>

            <dl className="divide-y divide-slate-200">
              {monitoringOutput.map(([label, value]) => (
                <div
                  key={label}
                  className="grid grid-cols-[120px_1fr] gap-4 px-5 py-4"
                >
                  <dt className="text-xs text-slate-400">{label}</dt>
                  <dd className="text-sm leading-5 text-slate-700">{value}</dd>
                </div>
              ))}
            </dl>

            <div className="border-t border-slate-200 px-5 py-4">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="size-1.5 rounded-full bg-blue-600" />
                Nothing runs until you approve the prompt set.
              </div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
