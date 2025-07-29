'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { FC, HTMLAttributes, useRef } from 'react';

import { cn } from '@/utils/cn';

interface ValuePropositionProps extends HTMLAttributes<HTMLDivElement> {}

export const ValueProposition: FC<ValuePropositionProps> = ({
  className,
  ...props
}) => {
  const text = `Stop paying agencies for empty promises.
Get enterprise‑grade SEO on your Shopify store—no developers or huge budgets required.
Powered by AEO, the next evolution of search.
One‑click Shopify integration for hands‑free traffic, conversions & growth.`;

  const words = text.split(/(\s+)/);
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const fastProgress = useTransform(scrollYProgress, [0, 0.5], [0, 1]);

  return (
    <div
      className={cn(
        'container flex h-[45rem] items-center justify-center',
        className,
      )}
      {...props}
    >
      <div className="max-w-4xl" ref={ref}>
        <p className="whitespace-pre-wrap text-center text-xl font-semibold md:text-3xl lg:text-4xl">
          {words.map((w, i) =>
            /\s+/.test(w) ? (
              w
            ) : (
              <Word
                key={i}
                index={i}
                total={words.length}
                progress={fastProgress}
              >
                {w}
              </Word>
            ),
          )}
        </p>
      </div>
    </div>
  );
};

interface WordProps {
  index: number;
  total: number;
  progress: any;
  children: string;
}

const Word: FC<WordProps> = ({ index, total, progress, children }) => {
  const start = index / total;
  const end = (index + 1) / total;
  const blurValue = useTransform(progress, [start, end], [6, 0]);
  const filter = useTransform(blurValue, (v) => `blur(${v}px)`);
  const opacity = useTransform(progress, [start, end], [0.25, 1]);

  return (
    <motion.span
      style={{
        display: 'inline-block',
        filter,
        opacity,
      }}
    >
      {children}
    </motion.span>
  );
};
