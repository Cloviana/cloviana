'use client';

import { motion } from 'motion/react';

import { Marquee, MarqueeContent } from '@/components/ui/marquee';

import { ROW_1, ROW_2, ROW_3, type PromptItem } from '../constants';

const PromptCard = ({ text, pulseDelay, pulseInterval }: PromptItem) => (
  <motion.div
    className="bg-background mx-1.5 w-[150px] flex-shrink-0 rounded-md px-2.5 py-2 backdrop-blur sm:mx-2 sm:w-[210px] sm:rounded-lg sm:px-4 sm:py-3 lg:w-[280px]"
    animate={{ opacity: [0.5, 1, 0.5] }}
    transition={{
      duration: 1.4,
      delay: pulseDelay,
      repeat: Infinity,
      repeatDelay: pulseInterval,
      ease: 'easeInOut',
    }}
  >
    <p className="text-foreground-light line-clamp-2 text-[10px] leading-[1.45] sm:text-[12px] lg:text-[13px]">
      {text}
    </p>
  </motion.div>
);

export const PromptUniverse = () => (
  <div
    className="flex h-full w-full flex-col justify-center gap-2 py-3 sm:gap-3 sm:py-5 lg:gap-4 lg:py-8"
    style={{
      maskImage:
        'linear-gradient(to right, transparent, black 12%, black 88%, transparent)',
    }}
  >
    <Marquee>
      <MarqueeContent direction="left" speed={22} pauseOnHover={false}>
        {ROW_1.map((p, i) => (
          <PromptCard key={i} {...p} />
        ))}
      </MarqueeContent>
    </Marquee>
    <Marquee>
      <MarqueeContent direction="right" speed={18} pauseOnHover={false}>
        {ROW_2.map((p, i) => (
          <PromptCard key={i} {...p} />
        ))}
      </MarqueeContent>
    </Marquee>
    <Marquee className="hidden sm:block">
      <MarqueeContent direction="left" speed={26} pauseOnHover={false}>
        {ROW_3.map((p, i) => (
          <PromptCard key={i} {...p} />
        ))}
      </MarqueeContent>
    </Marquee>
  </div>
);
