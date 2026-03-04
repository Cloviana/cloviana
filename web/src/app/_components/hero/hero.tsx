'use client';

import Link from 'next/link';
import { FC } from 'react';

import { AISearchResultCycler } from '@/app/_components/hero/components/ai-search-result';
import { Button } from '@/components/ui/button';
import { ShinyButton } from '@/components/ui/shiny-button';
import { links } from '@/config/links';
import { gaEvent } from '@/lib/ga/client';
import { cn } from '@/utils/cn';

interface HeroProps {
  className?: string;
}

export const Hero: FC<HeroProps> = ({ className }) => {
  return (
    <section className={cn(className)}>
      <div className="padding-global">
        <div className="padding-section-medium container pb-[3rem]">
          <div className="mx-auto flex max-w-xl flex-col items-center gap-y-6 text-center">
            <h1 className="text-3xl md:text-4xl lg:text-5xl">
              Be the Answer Every B2B Buyer Gets
            </h1>
            <p className="text-foreground-light text-base md:text-base lg:text-lg">
              An autonomous agent that continuously optimizes your entire AI
              search presence — no developers, no agency, no dashboards.
            </p>

            <div className="space-y-2">
              <div className="flex flex-col items-stretch justify-center gap-4 md:flex-row md:items-center">
                <ShinyButton>
                  <Button
                    asChild
                    size={'lg'}
                    onClick={() => gaEvent('book_demo', { location: 'hero' })}
                  >
                    <Link href={links.demo}>Request a demo</Link>
                  </Button>
                </ShinyButton>
              </div>
              <span className="text-foreground-light text-xs">
                <strong>14 days free trial</strong> — All Cloviana features — No
                card required
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="container">
        <div className="bg-wine flex h-[30rem] items-start justify-center overflow-clip rounded-2xl border-t bg-[url(/images/wallpaper-hero.jpg)] bg-cover bg-top p-4">
          <div className="flex h-full w-full items-center justify-center gap-4">
            <AISearchResultCycler />
          </div>
        </div>
      </div>
    </section>
  );
};
