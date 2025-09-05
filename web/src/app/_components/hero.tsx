'use client';

import { motion } from 'framer-motion';
import { FC, useState } from 'react';

import { Button } from '@/components/actions';
import { links } from '@/config/links';
import { cn } from '@/utils/cn';

import { HatchCard } from './hatch-card';

interface HeroProps {
  className?: string;
}

export const Hero: FC<HeroProps> = ({ className }) => {
  const [email, setEmail] = useState('');

  const handleBookDemo = () => {
    if (!email) return;
    const calendlyUrl = `${links.demo}?email=${encodeURIComponent(email)}`;
    window.open(calendlyUrl, '_blank');
  };

  return (
    <section className={cn('relative w-full border-b', className)}>
      <div className="border-dashed-wide bg-background absolute top-0 right-0 left-0 z-0 h-[1.75rem] border-b" />
      <div className="border-dashed-wide bg-background absolute top-[1.75rem] right-0 left-0 z-0 h-[1.75rem] border-b" />
      <div className="border-dashed-wide bg-background absolute right-0 bottom-0 left-0 z-0 h-[1.75rem] border-t" />
      <div className="border-dashed-wide bg-background absolute right-0 bottom-[1.75rem] left-0 z-0 h-[1.75rem] border-t" />
      <div className="absolute inset-0 z-0 flex">
        <div className="h-full w-[11rem] border-r py-[3.5rem]">
          <HatchCard />
        </div>
        <div className="flex-1" />
        <div className="h-full w-[11rem] border-l py-[3.5rem]">
          <HatchCard />
        </div>
      </div>
      <div className="padding-global relative z-20 h-full">
        <div className="bg-background container h-full border-r border-l pt-[4rem]">
          <div className="mx-auto flex w-full flex-col items-center gap-6 text-center">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className="max-w-[20ch] text-3xl sm:text-4xl md:text-5xl lg:text-6xl"
            >
              The Modern SEO Automation Platform
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: 'easeOut', delay: 0.2 }}
              className="max-w-[55ch] text-sm md:text-base"
            >
              Cloviana is the AI-native SEO platform for growing Shopify brands.
              It finds keywords, writes blogs, improves product and page SEO,
              adds links, fixes site basics, and publishes to Shopify for you—so
              you show up in search and in AI answers.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut', delay: 0.4 }}
              className="mt-5 flex w-full max-w-sm items-center rounded-full border bg-white p-[2px] shadow-xs"
            >
              <input
                className="w-0 min-w-0 flex-1 truncate px-3 text-sm font-medium focus:outline-0"
                placeholder="What's your work email?"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Button onClick={handleBookDemo} className="shrink-0">
                Book a demo
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: 0.6 }}
              className="mockup-window w-full !rounded-t-lg border"
            >
              <div className="w-full border-t">
                <video
                  src="/hero-banner.mp4"
                  autoPlay
                  playsInline
                  muted
                  loop
                  className="w-full object-cover"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};
