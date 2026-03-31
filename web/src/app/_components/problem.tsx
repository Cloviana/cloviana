'use client';

import { motion } from 'motion/react';
import { FC } from 'react';

import { cn } from '@/utils/cn';

export const Problem: FC<{ className?: string }> = ({ className }) => {
  return (
    <section className={cn(className, 'padding-global')}>
      <div className="padding-section-medium container max-w-6xl">
        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="text-foreground-light text-center text-3xl md:text-4xl lg:text-[40px]/12"
        >
          <span className="sm:hidden">
            94% of B2B buyers ask AI before sales.{' '}
            <span className="text-foreground">
              Cloviana makes sure they find you.
            </span>
          </span>
          <span className="hidden sm:inline">
            B2B buyers now ask AI before talking to sales — 94% of them. Every
            answer that skips your name is a lost deal.{' '}
            <span className="text-foreground">Cloviana changes that.</span>
          </span>
        </motion.h2>
      </div>
    </section>
  );
};
