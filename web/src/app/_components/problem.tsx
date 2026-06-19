'use client';

import { motion, MotionValue, useScroll, useTransform } from 'motion/react';
import { FC, useRef } from 'react';

import { cn } from '@/utils/cn';

const EASE = [0.22, 1, 0.36, 1] as const;

const paragraph =
  '96% of B2B buyers ask AI before they ever talk to sales. Every answer that skips your name is a deal you lost before it started. Cloviana changes that.';

const words = paragraph.split(' ');

interface FrostWordProps {
  word: string;
  progress: MotionValue<number>;
  index: number;
  total: number;
}

const FrostWord: FC<FrostWordProps> = ({ word, progress, index, total }) => {
  const start = (index / total) * 0.7;
  const end = start + 0.3;
  const opacity = useTransform(progress, [start, end], [0.15, 1]);
  const blur = useTransform(progress, [start, end], ['blur(6px)', 'blur(0px)']);

  return (
    <motion.span
      style={{ opacity, filter: blur }}
      transition={{ duration: 0.5, ease: EASE }}
      className="inline will-change-[filter,opacity]"
    >
      {word}
      {index < total - 1 ? ' ' : ''}
    </motion.span>
  );
};

export const Problem: FC<{ className?: string }> = ({ className }) => {
  const targetRef = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ['start 80%', 'end 50%'],
  });

  return (
    <section ref={targetRef} className={cn(className, 'padding-global')}>
      <div className="padding-section-medium container">
        <div className="mx-auto max-w-4xl">
          <p className="text-foreground text-center text-xl sm:text-2xl md:text-3xl lg:text-[36px] lg:leading-[1.3]">
            {words.map((word, index) => (
              <FrostWord
                key={index}
                word={word}
                progress={scrollYProgress}
                index={index}
                total={words.length}
              />
            ))}
          </p>
        </div>
      </div>
    </section>
  );
};
