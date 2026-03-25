'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { useForm } from 'react-hook-form';

import { Footer } from '@/components/sections/footer/default';
import { Navbar } from '@/components/sections/navbar/navbar';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Leaderboard, LeaderboardItem } from '@/components/ui/leaderboard';
import { AuditRequestDialog } from '@/features/audit';

const SAMPLE_LEADERBOARD: LeaderboardItem[] = [
  { position: 1, domain: 'opus.pro', name: 'OpusClip', share: 43.6 },
  { position: 2, domain: 'descript.com', name: 'Descript', share: 35.9 },
  { position: 3, domain: 'vizard.ai', name: 'Vizard.ai', share: 23.1 },
  { position: 4, domain: 'veed.io', name: 'VEED.io', share: 15.4 },
  { position: 5, domain: 'capcut.com', name: 'CapCut', share: 7.7 },
  { position: 6, domain: 'reap.video', name: 'Reap', share: 5.1 },
];

function validateUrl(input: string): true | string {
  try {
    new URL(input.trim());
    return true;
  } catch {
    return 'Enter a valid URL, e.g. https://yoursite.com';
  }
}

function AuditForm({ onSubmit }: { onSubmit: (domain: string) => void }) {
  const searchParams = useSearchParams();
  const form = useForm<{ domain: string }>({
    defaultValues: { domain: searchParams.get('domain') ?? '' },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(({ domain }) => onSubmit(domain.trim()))}
        noValidate
        className="w-full max-w-md space-y-4"
      >
        <FormField
          control={form.control}
          name="domain"
          rules={{ required: 'Enter your URL.', validate: validateUrl }}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  {...field}
                  size="lg"
                  placeholder="https://yoursite.com"
                />
              </FormControl>
              <FormMessage className="pl-1" />
            </FormItem>
          )}
        />
        <div className="pt-2">
          <Button type="submit" size="lg" className="w-full">
            Analyze my brand
          </Button>
        </div>
      </form>
    </Form>
  );
}

function CreateAuditPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [dialogOpen, setDialogOpen] = useState(
    () => !!searchParams.get('domain'),
  );

  const onSubmit = (domain: string) => {
    router.push(`/audits?domain=${encodeURIComponent(domain)}`);
    setDialogOpen(true);
  };

  return (
    <>
      <main className="relative flex-1">
        <section className="padding-global">
          <div className="padding-section-medium container">
            <div className="flex flex-col items-center gap-12 lg:flex-row lg:gap-16">
              <div className="flex w-full flex-col items-center gap-8 lg:w-1/2 lg:items-start">
                <div className="space-y-4 text-center lg:text-left">
                  <h1 className="text-4xl lg:text-5xl">
                    Get your free
                    <br />
                    AI Visibility Report
                  </h1>
                  <p className="text-foreground-light max-w-[45ch] text-lg">
                    See your AI visibility score across ChatGPT, Perplexity, and
                    Google AIO — ranked against your competitors. Free. Takes 60
                    seconds.
                  </p>
                </div>
                <AuditForm onSubmit={onSubmit} />
              </div>

              <div className="w-full lg:w-1/2">
                <Leaderboard
                  items={SAMPLE_LEADERBOARD}
                  targetDomain="opus.pro"
                />
              </div>
            </div>
          </div>
        </section>
      </main>
      <AuditRequestDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}

export default function CreateAuditPage() {
  return (
    <div className="bg-background relative flex min-h-screen flex-col">
      <header className="sticky top-0 right-0 left-0 z-50">
        <Navbar />
      </header>
      <Suspense>
        <CreateAuditPageContent />
      </Suspense>
      <Footer />
    </div>
  );
}
