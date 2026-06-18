import { ChevronRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

import { Button } from '@/components/ui/button';
import { paths } from '@/config/paths';
import { getBusinessEntry } from '@/features/businesses/api/business-entry';
import { createClient } from '@/lib/supabase/server';

const DEMO_HREF = 'https://calendly.com/cloviana/30min';

export default async function BusinessEntryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user?.email?.toLowerCase() === 'samuel@cloviana.com') {
    redirect('/admin/setup-client');
  }

  let entry;
  try {
    entry = await getBusinessEntry();
  } catch {
    redirect(paths.auth.login.getHref());
  }

  if (entry.destination === 'business' && entry.businessId) {
    redirect(paths.business.getHref(entry.businessId));
  }

  return (
    <main className="bg-studio text-foreground min-h-screen lg:grid lg:grid-cols-[minmax(0,0.92fr)_minmax(420px,0.72fr)]">
      <section className="flex min-h-screen items-center px-7 py-12">
        <div className="mx-auto flex w-full max-w-md flex-col gap-12">
          <Image
            src="/logo-icon.png"
            width={125}
            height={125}
            alt="Cloviana Logo"
            className="size-[25px]"
          />

          <div className="space-y-8">
            <div className="space-y-2">
              <p className="text-foreground-lighter text-xs font-semibold tracking-[0.22em] uppercase">
                Managed onboarding
              </p>
              <h1 className="text-[24px] leading-tight font-medium">
                Your workspace is being prepared
              </h1>
              <p className="text-foreground-light text-sm leading-6">
                Samuel is setting up the dashboard manually so the profile,
                prompts, competitors, and sources are already connected when you
                log in.
              </p>
            </div>

            <div className="border-border bg-surface rounded-md border p-4">
              <p className="text-sm font-medium">No setup is needed from you</p>
              <p className="text-foreground-light mt-1 text-sm leading-6">
                Cloviana will open this workspace once the first monitored
                business is ready.
              </p>
            </div>

            <Button asChild className="w-full" size="lg">
              <Link href={DEMO_HREF} target="_blank" rel="noopener noreferrer">
                Book a demo
                <ChevronRight className="size-3.5" strokeWidth={2.5} />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <aside className="bg-surface border-border hidden min-h-screen border-l px-12 py-16 lg:flex lg:flex-col lg:justify-between">
        <div>
          <p className="text-foreground-lighter text-xs font-semibold tracking-[0.24em] uppercase">
            Cloviana workspace
          </p>
          <div className="mt-12 max-w-lg">
            <p className="font-gambarino text-[30px] leading-[1.18]">
              Be the answer every B2B buyer gets.
            </p>
            <p className="text-foreground-light mt-4 text-sm leading-6">
              The dashboard is prepared around the exact conversations where
              buyers ask ChatGPT, Perplexity, and Gemini what to buy.
            </p>
          </div>
        </div>

        <div className="border-border grid grid-cols-2 border text-xs text-slate-600">
          {[
            'Buyer prompts',
            'Competitor set',
            'Trusted sources',
            'AI share of voice',
          ].map((item) => (
            <div key={item} className="border-border border p-4">
              {item}
            </div>
          ))}
        </div>
      </aside>
    </main>
  );
}
