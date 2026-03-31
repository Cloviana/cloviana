'use client';

import { motion } from 'motion/react';
import Link from 'next/link';
import { FC } from 'react';

import { AISearchResultCycler } from '@/app/_components/hero/components/ai-search-result';
import { Button } from '@/components/ui/button';
import {
  Marquee,
  MarqueeContent,
  MarqueeFade,
  MarqueeItem,
} from '@/components/ui/marquee';
import { ShinyButton } from '@/components/ui/shiny-button';
import { links } from '@/config/links';
import { gaEvent } from '@/lib/ga/client';
import { cn } from '@/utils/cn';

const EASE = [0.22, 1, 0.36, 1] as const;

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: EASE, delay },
});

interface HeroProps {
  className?: string;
}

export const Hero: FC<HeroProps> = ({ className }) => {
  return (
    <section className={cn(className)}>
      <div className="padding-global">
        <div className="padding-section-medium container !pb-[3rem]">
          <div className="mx-auto mb-[3rem] flex max-w-xl flex-col items-center gap-y-6 text-center">
            <motion.h1
              {...fadeUp(0)}
              className="text-3xl md:text-4xl lg:text-5xl"
            >
              Be the Answer Every B2B Buyer Gets
            </motion.h1>

            <motion.p
              {...fadeUp(0.1)}
              className="text-foreground-light text-base md:text-base lg:text-lg"
            >
              An autonomous agent that continuously optimizes your entire AI
              search presence — no developers, no agency, no dashboards.
            </motion.p>

            <motion.div {...fadeUp(0.2)} className="space-y-2">
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
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 28, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.75, ease: EASE, delay: 0.3 }}
            style={{
              backgroundImage: `
    url('/images/371f310e-6265-43f3-b469-e230ed7e67b9.png'),
    url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAECAYAAACzzX7wAAAAkElEQVR4AQCEAHv/AjlkNP9cdTv/qIxV/8uxj//Jy8X/0sLI/+Cjqv/FoZ//Avnc5AD/7uAA6PjSAMTk0ACf0OgApuHoAOYI6wAR/PEAAllgbQBKRlQA/wn/ANXbzQDgxYoAyMiaAI7UwQCm1rkAAhcpVAAGIE0A0fMdAMLO+gDa6BIA6PQZANzo9AC04eYAAAAA//+YZCf8AAAABklEQVQDAOt6R1OjIJldAAAAAElFTkSuQmCC')
  `,
            }}
            className="flex h-[30rem] items-start justify-center overflow-clip rounded-2xl bg-cover bg-top p-4"
          >
            <div className="flex h-full w-full items-center justify-center gap-4">
              <AISearchResultCycler />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.55 }}
            className="flex items-center gap-3"
          >
            <div className="hidden max-w-xs md:block">
              <p className="text-foreground-lighter text-left text-sm">
                Powered by the platforms behind smarter organic growth.
              </p>
            </div>
            <Marquee>
              <MarqueeFade side="left" />
              <MarqueeFade side="right" />
              <MarqueeContent pauseOnHover={false}>
                <MarqueeItem className="mx-10 flex h-28 w-28 items-center justify-center">
                  <img
                    src="/logos/openai-logo.svg"
                    alt="OpenAI"
                    className="h-7 object-contain opacity-65"
                  />
                </MarqueeItem>
                <MarqueeItem className="mx-10 flex h-28 w-28 items-center justify-center">
                  <img
                    src="/logos/Claude_Logo_0.svg"
                    alt="Claude"
                    className="h-7 object-contain opacity-65"
                  />
                </MarqueeItem>
                <MarqueeItem className="mx-10 flex h-28 w-28 items-center justify-center">
                  <img
                    src="/logos/Ideogram_id9LsmXQWf_0.svg"
                    alt="Ideogram"
                    className="h-9 object-contain opacity-65"
                  />
                </MarqueeItem>
                <MarqueeItem className="mx-10 flex h-28 w-28 items-center justify-center">
                  <img
                    src="/logos/Shopify.com_Logo_0.svg"
                    alt="Shopify"
                    className="h-7 object-contain opacity-65"
                  />
                </MarqueeItem>
                <MarqueeItem className="mx-10 flex h-28 w-28 items-center justify-center">
                  <img
                    src="/logos/SEMrush_idVgjVMO52_0.svg"
                    alt="SEMrush"
                    className="h-10 object-contain opacity-65"
                  />
                </MarqueeItem>
                <MarqueeItem className="mx-10 flex h-28 w-28 items-center justify-center">
                  <img
                    src="/logos/SE Ranking_idwstdxyha_1.svg"
                    alt="SE Ranking"
                    className="h-8 object-contain opacity-65"
                  />
                </MarqueeItem>
              </MarqueeContent>
            </Marquee>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
