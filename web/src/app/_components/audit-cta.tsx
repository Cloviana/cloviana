'use client';

import { motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import { FC, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Leaderboard, LeaderboardItem } from '@/components/ui/leaderboard';
import { cn } from '@/utils/cn';

const EASE = [0.22, 1, 0.36, 1] as const;

const SAMPLE_LEADERBOARD: LeaderboardItem[] = [
  { position: 1, domain: 'opus.pro', name: 'OpusClip', share: 43.6 },
  { position: 2, domain: 'descript.com', name: 'Descript', share: 35.9 },
  { position: 3, domain: 'vizard.ai', name: 'Vizard.ai', share: 23.1 },
  { position: 4, domain: 'veed.io', name: 'VEED.io', share: 15.4 },
  { position: 5, domain: 'capcut.com', name: 'CapCut', share: 7.7 },
  { position: 6, domain: 'reap.video', name: 'Reap', share: 5.1 },
];

export const AuditCta: FC<{ className?: string }> = ({ className }) => {
  const router = useRouter();
  const [domain, setDomain] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain.trim()) return;
    router.push(`/audits?domain=${encodeURIComponent(domain.trim())}`);
  };

  return (
    <section className={cn(className, 'padding-global')}>
      <div className="padding-section-medium container">
        {/* Header */}
        <div className="mb-16 flex flex-col gap-x-8 gap-y-3 lg:flex-row lg:items-start lg:justify-between lg:gap-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6, ease: EASE }}
            className="w-full text-3xl lg:w-1/2 lg:max-w-[22ch] lg:text-4xl"
          >
            The agent runs. You get recommended.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6, ease: EASE, delay: 0.1 }}
            className="text-foreground-light w-full lg:w-1/2 lg:max-w-[50ch] lg:pt-2 lg:text-lg"
          >
            Cloviana works continuously in the background — mapping where your
            buyers are searching, optimizing your presence across every AI
            model, and compounding your share of voice over time.
          </motion.p>
        </div>

        <div className="flex items-stretch gap-8">
          <div
            className="relative flex min-h-[420px] w-1/2 flex-col justify-between overflow-hidden rounded-2xl bg-cover bg-center p-8"
            style={{
              backgroundImage:
                "url('/images/371f310e-6265-43f3-b469-e230ed7e67b9.png')",
            }}
          >
            {/* Input at top */}
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="https://yoursite.com"
                className="bg-white/90 backdrop-blur-sm"
              />
              <Button type="submit">Analyze brand</Button>
            </form>

            {/* Heading + subheading at bottom */}
            <div className="space-y-2">
              <h3 className="text-2xl text-white lg:text-3xl">
                See where you stand
              </h3>
              <p className="text-white/75 lg:text-lg">
                Enter your URL and get a free AI Visibility Report across
                ChatGPT, Perplexity, and Google — in 60 seconds.
              </p>
            </div>
          </div>

          <div className="w-1/2">
            <Leaderboard items={SAMPLE_LEADERBOARD} targetDomain="opus.pro" />
          </div>
        </div>
      </div>
    </section>
  );
};
