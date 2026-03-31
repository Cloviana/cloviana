'use client';

import { motion } from 'motion/react';
import Image from 'next/image';

import { Marquee, MarqueeContent } from '@/components/ui/marquee';

import {
  ROW_1,
  ROW_2,
  ROW_3,
  AI_SOURCE_META,
  type PromptItem,
} from '../constants';

const PromptCard = ({
  text,
  pulseDelay,
  pulseInterval,
  source,
}: PromptItem) => {
  const { label, icon } = AI_SOURCE_META[source];
  return (
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
      <div className="mb-1.5 flex items-center gap-1.5 sm:mb-2">
        <Image
          src={icon}
          alt={label}
          width={12}
          height={12}
          className="h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5"
        />
        <span className="text-foreground-lighter text-[9px] font-medium sm:text-[10px]">
          {label}
        </span>
      </div>
      <p className="text-foreground-light line-clamp-2 text-[10px] leading-[1.45] sm:text-[12px] lg:text-[13px]">
        {text}
      </p>
    </motion.div>
  );
};

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
